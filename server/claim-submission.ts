import type { Request, Response } from "express";
import { sql, eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { claims, policies, claimSubmissionSchema, claimMetadataEditSchema } from "@shared/schema";
import { db } from "./db";
import { analyzeDamageImages } from "./openai";

class ClaimSubmissionError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Use the same PG session and policy ownership as the native claim application.
// Lock them only in short transactions, never while waiting for the provider.
async function authorizeSession(tx: any, sessionId: string, userId: string) {
  const result = await tx.execute(sql`
    SELECT s.sess, u.email_verified FROM sessions s
    JOIN users u ON u.id = COALESCE(s.sess->>'userId', s.sess#>>'{passport,user,claims,sub}')
    WHERE s.sid = ${sessionId} AND s.expire > NOW() AND u.id = ${userId}
    FOR SHARE OF s, u
  `);
  const row = result.rows[0];
  if (!row) throw new ClaimSubmissionError(401, "Your session is no longer active. Sign in again.");
  if (row.sess.userId) {
    if (!row.email_verified) throw new ClaimSubmissionError(401, "Verify your email before submitting a claim.");
  } else {
    const expiry = row.sess.passport?.user?.expires_at;
    if (!Number.isFinite(expiry) || expiry * 1000 <= Date.now()) throw new ClaimSubmissionError(401, "Your session has expired. Sign in again.");
  }
}

async function authorize(tx: any, sessionId: string, userId: string, policyId: number) {
  await authorizeSession(tx, sessionId, userId);
  const [policy] = await tx.select({ id: policies.id, status: policies.status }).from(policies)
    .where(and(eq(policies.id, policyId), eq(policies.userId, userId))).for("share");
  if (!policy) throw new ClaimSubmissionError(404, "Select a policy belonging to your account.");
  if (policy.status !== "active") {
    throw new ClaimSubmissionError(403, "The selected policy is not active. Claim assessment and submission require authorized active coverage.");
  }
}

const claimIdsSchema = z.array(z.number().int().positive().safe()).min(1).max(100);

export function createClaimRecordMutationHandler({ database = db, operation = "update", bulk = false }: { database?: typeof db; operation?: "update" | "delete"; bulk?: boolean } = {}) {
  return async (req: Request, res: Response) => {
    const controller = new AbortController();
    const cancel = () => { if (!res.writableEnded) controller.abort(); };
    req.on("aborted", cancel);
    res.on("close", cancel);
    try {
      if (req.aborted || res.destroyed) controller.abort();
      const request = req as any;
      const userId: string | undefined = request.session?.userId || request.user?.claims?.sub;
      if (!userId || !request.sessionID) throw new ClaimSubmissionError(401, "Unauthorized");
      let ids: number[], updates: { title?: string; description?: string; incidentDate?: string } | undefined;
      if (bulk) {
        const schema = operation === "update" ? z.object({ ids: claimIdsSchema, updates: claimMetadataEditSchema }).strict() : z.object({ ids: claimIdsSchema }).strict();
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) throw new ClaimSubmissionError(400, "Supply actual claim IDs and only title, description, or incident date edits.");
        ids = [...new Set(parsed.data.ids)];
        if (operation === "update") updates = claimMetadataEditSchema.parse(req.body.updates);
      } else {
        const id = Number(req.params.id);
        if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id < 1) throw new ClaimSubmissionError(400, "Invalid claim ID.");
        ids = [id];
        if (operation === "update") {
          const parsed = claimMetadataEditSchema.safeParse(req.body);
          if (!parsed.success) throw new ClaimSubmissionError(400, "Edit only the claim title, description, or incident date.");
          updates = parsed.data;
        }
      }
      const result = await database.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
        await tx.execute(sql`SET LOCAL statement_timeout = '10s'`);
        controller.signal.throwIfAborted();
        await authorizeSession(tx, request.sessionID, userId);
        const owned = await tx.select({ id: claims.id }).from(claims)
          .where(and(inArray(claims.id, ids), eq(claims.userId, userId))).for("update");
        if (owned.length !== ids.length) throw new ClaimSubmissionError(404, "One or more claims were not found in your account.");
        controller.signal.throwIfAborted();
        const where = and(inArray(claims.id, ids), eq(claims.userId, userId));
        const rows = operation === "delete" ? await tx.delete(claims).where(where).returning({ id: claims.id }) : await tx.update(claims).set({
          ...(updates?.title !== undefined ? { title: updates.title } : {}),
          ...(updates?.description !== undefined ? { description: updates.description } : {}),
          ...(updates?.incidentDate !== undefined ? { incidentDate: new Date(`${updates.incidentDate}T00:00:00Z`) } : {}),
          updatedAt: new Date(),
        }).where(where).returning();
        await new Promise<void>((resolve) => setImmediate(resolve));
        controller.signal.throwIfAborted();
        return rows;
      });
      if (!res.destroyed) {
        if (operation === "delete") res.json({ message: "Claim deletion completed", count: result.length });
        else if (bulk) res.json({ message: `${result.length} claims updated`, data: result });
        else res.json(result[0]);
      }
    } catch (error) {
      if (res.destroyed || req.aborted) return;
      if (error instanceof ClaimSubmissionError) res.status(error.status).json({ message: error.message });
      else if (controller.signal.aborted) res.status(499).json({ message: "Claim change cancelled." });
      else res.status(500).json({ message: "The claim change could not be completed. Check Claims before trying again." });
    } finally {
      req.off("aborted", cancel);
      res.off("close", cancel);
    }
  };
}

export function createClaimSubmissionHandler({ database = db, analyze = analyzeDamageImages, timeoutMs = 90000 } = {}) {
  return async (req: Request & { files?: Express.Multer.File[] | Record<string, Express.Multer.File[]> }, res: Response) => {
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => { if (!res.writableEnded) controller.abort(); };
    req.on("aborted", cancel);
    res.on("close", cancel);
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    timeout.unref();
    try {
      if (req.aborted || res.destroyed) controller.abort();
      controller.signal.throwIfAborted();
      const request = req as any;
      const userId: string | undefined = request.session?.userId || request.user?.claims?.sub;
      if (!userId || !request.sessionID) throw new ClaimSubmissionError(401, "Unauthorized");
      const files = Array.isArray(req.files) ? req.files : [];
      if (!files.length || files.length > 10) throw new ClaimSubmissionError(400, "Upload between one and ten damage photos.");
      const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
      if (files.some((file) => !allowed.has(file.mimetype) || file.size > 10 * 1024 * 1024)) {
        throw new ClaimSubmissionError(400, "Use JPEG, PNG, WebP, or GIF images up to 10 MB each.");
      }
      const images = files.map((file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`);
      const parsed = claimSubmissionSchema.safeParse({ ...req.body, images });
      if (!parsed.success) throw new ClaimSubmissionError(400, parsed.error.issues[0]?.message || "Check the claim details.");
      const data = parsed.data;
      await database.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
        await tx.execute(sql`SET LOCAL statement_timeout = '10s'`);
        controller.signal.throwIfAborted();
        await authorize(tx, request.sessionID, userId, data.policyId);
        controller.signal.throwIfAborted();
      });
      let aiAssessment;
      try { aiAssessment = await analyze(images, { signal: controller.signal, details: data }); }
      catch (error) {
        controller.signal.throwIfAborted();
        if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL?.trim()) throw new ClaimSubmissionError(503, "Configure an OpenRouter API key and an image-capable model before submitting this claim.");
        throw new ClaimSubmissionError(502, "OpenRouter could not complete the image assessment. Your claim was not saved; try again.");
      }
      controller.signal.throwIfAborted();
      const claim = await database.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
        await tx.execute(sql`SET LOCAL statement_timeout = '10s'`);
        controller.signal.throwIfAborted();
        await authorize(tx, request.sessionID, userId, data.policyId);
        controller.signal.throwIfAborted();
        const [saved] = await tx.insert(claims).values({
          userId, policyId: data.policyId, title: data.title, description: data.description,
          incidentDate: new Date(`${data.incidentDate}T00:00:00Z`), images,
          aiAssessment, estimatedAmount: aiAssessment.estimatedCost.total.toFixed(2),
        }).returning();
        // Give queued disconnects a chance to reach the final pre-COMMIT guard.
        await new Promise<void>((resolve) => setImmediate(resolve));
        controller.signal.throwIfAborted();
        return saved;
      });
      // A completed commit is retained even if the browser closes immediately after it.
      if (!res.destroyed) res.status(201).json(claim);
    } catch (error) {
      if (res.destroyed || req.aborted) return;
      if (controller.signal.aborted) {
        res.status(timedOut ? 504 : 499).json({ message: timedOut ? "Image analysis timed out. Your claim was not saved." : "Claim submission cancelled." });
      } else if (error instanceof ClaimSubmissionError) {
        res.status(error.status).json({ message: error.message });
      } else {
        console.error("Claim submission failed", { name: error instanceof Error ? error.name : "UnknownError" });
        res.status(500).json({ message: "Your claim could not be saved. Try again." });
      }
    } finally {
      clearTimeout(timeout);
      req.off("aborted", cancel);
      res.off("close", cancel);
    }
  };
}
