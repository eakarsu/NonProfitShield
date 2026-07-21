import crypto from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import { pool } from "../db";
import { authorize, decideApproval, DomainError, hash, integrationDelivery, reconcile, resourceKinds, transitionRecord, validateOfflineEnvelope, validateRecord, type ResourceKind } from "../domain/nonprofitWorkflow";
import { dispatch } from "../providers/nonprofitProviders";

type Identity = { userId: string; organizationId: string; role: string; status: string };
type AuthorizedRequest = Request & { nonprofitIdentity?: Identity; user?: any; session?: any; rawBody?: Buffer };
const router = Router();

const userId = (req: AuthorizedRequest) => req.session?.userId || req.user?.claims?.sub || null;
const organizationId = (req: AuthorizedRequest) => String(req.header("x-organization-id") || "");

function permit(action: string) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = userId(req); const org = organizationId(req);
      if (!actor) return res.status(401).json({ error: "authentication_required" });
      if (!org) return res.status(400).json({ error: "organization_header_required" });
      const result = await pool.query("SELECT user_id,organization_id,role,status FROM nonprofit_memberships WHERE organization_id=$1 AND user_id=$2", [org, actor]);
      if (!result.rowCount) return res.status(403).json({ error: "membership_required" });
      const row = result.rows[0];
      const identity = { userId: String(row.user_id), organizationId: String(row.organization_id), role: row.role, status: row.status };
      authorize(identity, org, action); req.nonprofitIdentity = identity; next();
    } catch (error) { next(error); }
  };
}

async function audit(client: any, identity: Identity, action: string, resourceType: string, resourceId: string, beforeHash?: string | null, afterHash?: string | null, metadata: Record<string, unknown> = {}) {
  await client.query("INSERT INTO nonprofit_audit(organization_id,actor_id,actor_role,action,resource_type,resource_id,before_hash,after_hash,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", [identity.organizationId, identity.userId, identity.role, action, resourceType, resourceId, beforeHash || null, afterHash || null, metadata]);
}

router.post("/records/:kind", permit("create"), async (req: AuthorizedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const identity = req.nonprofitIdentity!; const value = validateRecord(req.params.kind, req.body); const id = crypto.randomUUID();
    await client.query("BEGIN");
    if (value.kind === "beneficiary") {
      const consent = await client.query("SELECT 1 FROM nonprofit_records WHERE id=$1 AND organization_id=$2 AND kind='consent' AND state='granted' AND expires_at>NOW()", [value.data.consentId, identity.organizationId]);
      if (!consent.rowCount) throw new DomainError("active_consent_required");
    }
    if (value.kind === "outcome") {
      const program = await client.query("SELECT 1 FROM nonprofit_records WHERE id=$1 AND organization_id=$2 AND kind='program' AND state='active' AND expires_at>NOW()", [value.data.programId, identity.organizationId]);
      if (!program.rowCount) throw new DomainError("active_program_required");
    }
    await client.query("INSERT INTO nonprofit_records(id,organization_id,kind,external_ref,state,owner_id,data,data_hash,consent_record_id,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()+($10||' days')::interval)", [id, identity.organizationId, value.kind, value.data.externalRef, value.state, String(value.data.ownerId || identity.userId), value.data, value.dataHash, value.data.consentId || null, value.retentionDays]);
    await client.query("INSERT INTO nonprofit_record_history(organization_id,record_id,to_state,actor_id,evidence_hash) VALUES($1,$2,$3,$4,$5)", [identity.organizationId, id, value.state, identity.userId, value.dataHash]);
    await audit(client, identity, "record.created", value.kind, id, null, value.dataHash);
    await client.query("COMMIT"); res.status(201).json({ id, kind: value.kind, state: value.state, dataHash: value.dataHash });
  } catch (error) { await client.query("ROLLBACK"); next(error); } finally { client.release(); }
});

router.get("/records/:kind", permit("read"), async (req: AuthorizedRequest, res, next) => {
  try {
    if (!resourceKinds.includes(req.params.kind as ResourceKind)) throw new DomainError("unsupported_resource_kind");
    const result = await pool.query("SELECT id,kind,external_ref,state,owner_id,data,data_hash,expires_at,created_at,updated_at FROM nonprofit_records WHERE organization_id=$1 AND kind=$2 AND expires_at>NOW() ORDER BY created_at DESC LIMIT 500", [req.nonprofitIdentity!.organizationId, req.params.kind]);
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.post("/records/:kind/:id/transition", permit("transition"), async (req: AuthorizedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const identity = req.nonprofitIdentity!; await client.query("BEGIN");
    const found = await client.query("SELECT * FROM nonprofit_records WHERE id=$1 AND organization_id=$2 AND kind=$3 AND expires_at>NOW() FOR UPDATE", [req.params.id, identity.organizationId, req.params.kind]);
    if (!found.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "record_not_found" }); }
    const row = found.rows[0]; let approval: any = null;
    if (req.body.approvalId) {
      const approved = await client.query("SELECT * FROM nonprofit_approvals WHERE id=$1 AND organization_id=$2 AND resource_id=$3 AND resource_kind=$4 AND decision='approved'", [req.body.approvalId, identity.organizationId, row.id, row.kind]);
      if (!approved.rowCount) throw new DomainError("approved_decision_required"); approval = approved.rows[0];
    }
    const target = transitionRecord(row.kind, row.state, req.body.target, { approvalId: approval?.id, requesterId: approval?.requested_by, approverId: approval?.decided_by });
    await client.query("UPDATE nonprofit_records SET state=$1,version=version+1,updated_at=NOW() WHERE id=$2", [target, row.id]);
    await client.query("INSERT INTO nonprofit_record_history(organization_id,record_id,from_state,to_state,actor_id,approval_id,evidence_hash) VALUES($1,$2,$3,$4,$5,$6,$7)", [identity.organizationId, row.id, row.state, target, identity.userId, approval?.id || null, hash(req.body.evidence || {})]);
    await audit(client, identity, "record.transitioned", row.kind, row.id, hash({ state: row.state, version: row.version }), hash({ state: target, version: row.version + 1 }), { approvalId: approval?.id || null });
    if (row.kind === "consent" && ["withdrawn", "expired"].includes(target)) await client.query("UPDATE nonprofit_integration_jobs SET status='dead_letter',last_error='consent_inactive',updated_at=NOW() WHERE organization_id=$1 AND status IN ('queued','retrying','leased') AND payload->>'consentId'=$2", [identity.organizationId, row.id]);
    await client.query("COMMIT"); res.json({ id: row.id, state: target, version: row.version + 1 });
  } catch (error) { await client.query("ROLLBACK"); next(error); } finally { client.release(); }
});

router.post("/approvals", permit("transition"), async (req: AuthorizedRequest, res, next) => {
  try {
    const identity = req.nonprofitIdentity!;
    if (!resourceKinds.includes(req.body.resourceKind)) throw new DomainError("unsupported_resource_kind");
    if (!req.body.resourceId || !req.body.requestedTransition || !req.body.reason) throw new DomainError("complete_approval_request_required");
    const record = await pool.query("SELECT 1 FROM nonprofit_records WHERE id=$1 AND organization_id=$2 AND kind=$3 AND expires_at>NOW()", [req.body.resourceId, identity.organizationId, req.body.resourceKind]);
    if (!record.rowCount) return res.status(404).json({ error: "record_not_found" });
    const id = crypto.randomUUID(); await pool.query("INSERT INTO nonprofit_approvals(id,organization_id,resource_kind,resource_id,requested_transition,requested_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7)", [id, identity.organizationId, req.body.resourceKind, req.body.resourceId, req.body.requestedTransition, identity.userId, req.body.reason]);
    res.status(201).json({ id, decision: "pending" });
  } catch (error) { next(error); }
});

router.post("/approvals/:id/decision", permit("approve"), async (req: AuthorizedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const identity = req.nonprofitIdentity!; await client.query("BEGIN");
    const found = await client.query("SELECT * FROM nonprofit_approvals WHERE id=$1 AND organization_id=$2 AND decision='pending' FOR UPDATE", [req.params.id, identity.organizationId]);
    if (!found.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "approval_not_pending" }); }
    const row = found.rows[0]; const decision = decideApproval(String(row.requested_by), identity.userId, req.body.decision);
    await client.query("UPDATE nonprofit_approvals SET decision=$1,decided_by=$2,decision_note=$3,decided_at=NOW() WHERE id=$4", [decision, identity.userId, req.body.note || null, row.id]);
    await audit(client, identity, "approval.decided", "approval", row.id, hash({ decision: "pending" }), hash({ decision }));
    await client.query("COMMIT"); res.json({ id: row.id, decision });
  } catch (error) { await client.query("ROLLBACK"); next(error); } finally { client.release(); }
});

router.post("/integrations", permit("integrate"), async (req: AuthorizedRequest, res, next) => {
  try {
    const identity = req.nonprofitIdentity!; const item = integrationDelivery(req.body.connector, req.body.operation, req.body.payload, req.body.idempotencyKey);
    if (req.body.consequential) {
      const approval = await pool.query("SELECT 1 FROM nonprofit_approvals WHERE id=$1 AND organization_id=$2 AND decision='approved'", [req.body.approvalId, identity.organizationId]);
      if (!approval.rowCount) throw new DomainError("approved_decision_required");
    }
    const id = crypto.randomUUID(); const result = await pool.query("INSERT INTO nonprofit_integration_jobs(id,organization_id,connector,operation,idempotency_key,payload_hash,payload,approval_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(organization_id,connector,idempotency_key) DO UPDATE SET updated_at=nonprofit_integration_jobs.updated_at RETURNING *", [id, identity.organizationId, item.connector, item.operation, item.idempotencyKey, item.payloadHash, req.body.payload, req.body.approvalId || null]);
    res.status(202).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post("/integrations/:id/attempt", permit("integrate"), async (req: AuthorizedRequest, res, next) => {
  try {
    const identity = req.nonprofitIdentity!; const found = await pool.query("SELECT * FROM nonprofit_integration_jobs WHERE id=$1 AND organization_id=$2 AND status IN ('queued','retrying') AND next_attempt_at<=NOW()", [req.params.id, identity.organizationId]);
    if (!found.rowCount) return res.status(404).json({ error: "integration_not_dispatchable" });
    const row = found.rows[0];
    try {
      const receipt = await dispatch(row); const updated = await pool.query("UPDATE nonprofit_integration_jobs SET status='confirmed',receipt=$1,attempts=attempts+1,updated_at=NOW() WHERE id=$2 RETURNING *", [receipt, row.id]); res.json(updated.rows[0]);
    } catch (error: any) {
      const updated = await pool.query("UPDATE nonprofit_integration_jobs SET attempts=attempts+1,status=CASE WHEN attempts+1>=max_attempts THEN 'dead_letter' ELSE 'retrying' END,next_attempt_at=NOW()+(POWER(2,LEAST(attempts,8))||' seconds')::interval,last_error=$1,updated_at=NOW() WHERE id=$2 RETURNING *", [error.message, row.id]); res.status(503).json(updated.rows[0]);
    }
  } catch (error) { next(error); }
});

router.post("/reconciliations", permit("integrate"), async (req: AuthorizedRequest, res, next) => {
  try {
    if (!req.body.connector || !req.body.sourceVersion || !req.body.expected || !req.body.observed) throw new DomainError("complete_reconciliation_required");
    integrationDelivery(req.body.connector, "reconcile", req.body.observed, req.body.idempotencyKey || crypto.randomUUID());
    const outcome = reconcile(req.body.expected, req.body.observed); const id = crypto.randomUUID();
    await pool.query("INSERT INTO nonprofit_reconciliations(id,organization_id,connector,source_version,expected,observed,matched,differences,result_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", [id, req.nonprofitIdentity!.organizationId, req.body.connector, req.body.sourceVersion, req.body.expected, req.body.observed, outcome.matched, outcome.differences, outcome.resultHash]);
    res.status(outcome.matched ? 201 : 409).json({ id, ...outcome });
  } catch (error) { next(error); }
});

router.post("/offline/events", permit("offline"), async (req: AuthorizedRequest, res, next) => {
  try {
    const identity = req.nonprofitIdentity!; const value = validateOfflineEnvelope(req.body); const id = crypto.randomUUID();
    const result = await pool.query("INSERT INTO nonprofit_offline_events(id,organization_id,actor_id,device_id,event_id,schema_version,sequence,recorded_at,payload,payload_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(organization_id,device_id,event_id) DO NOTHING RETURNING id", [id, identity.organizationId, identity.userId, value.deviceId, value.eventId, value.schemaVersion, value.sequence, value.recordedAt, value.payload, value.payloadHash]);
    if (!result.rowCount) {
      const existing = await pool.query("SELECT payload_hash FROM nonprofit_offline_events WHERE organization_id=$1 AND device_id=$2 AND event_id=$3", [identity.organizationId, value.deviceId, value.eventId]);
      if (existing.rows[0].payload_hash !== value.payloadHash) return res.status(409).json({ error: "offline_idempotency_mismatch" });
    }
    res.status(202).json({ id: result.rows[0]?.id || null, payloadHash: value.payloadHash, duplicate: !result.rowCount });
  } catch (error) { next(error); }
});

router.post("/retention/purge", permit("purge"), async (req: AuthorizedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const identity = req.nonprofitIdentity!; const limit = Math.min(Math.max(Number(req.body.limit) || 100, 1), 1000); await client.query("BEGIN");
    const expired = await client.query("SELECT id FROM nonprofit_records WHERE organization_id=$1 AND expires_at<=NOW() ORDER BY expires_at LIMIT $2 FOR UPDATE SKIP LOCKED", [identity.organizationId, limit]); const ids = expired.rows.map((row) => row.id);
    if (ids.length) { await client.query("DELETE FROM nonprofit_record_history WHERE organization_id=$1 AND record_id=ANY($2::uuid[])", [identity.organizationId, ids]); await client.query("DELETE FROM nonprofit_records WHERE organization_id=$1 AND id=ANY($2::uuid[])", [identity.organizationId, ids]); }
    await audit(client, identity, "retention.purged", "organization", identity.organizationId, null, null, { count: ids.length, recordHashesOnly: true });
    await client.query("COMMIT"); res.json({ purged: ids.length });
  } catch (error) { await client.query("ROLLBACK"); next(error); } finally { client.release(); }
});

router.post("/webhooks/:connector", async (req: AuthorizedRequest, res, next) => {
  try {
    const org = organizationId(req); const eventId = req.body?.eventId; const signature = req.header("x-signature") || "";
    if (!org || !eventId) throw new DomainError("webhook_identity_required");
    integrationDelivery(req.params.connector, "webhook", req.body, String(eventId));
    const secret = process.env.NONPROFIT_WEBHOOK_SECRET; if (!secret || secret.length < 32) throw new Error("webhook_secret_not_configured");
    const expected = crypto.createHmac("sha256", secret).update(req.rawBody || Buffer.from(JSON.stringify(req.body))).digest("hex");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(401).json({ error: "invalid_signature" });
    await pool.query("INSERT INTO nonprofit_webhook_receipts(id,organization_id,connector,provider_event_id,payload_hash) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING", [crypto.randomUUID(), org, req.params.connector, eventId, hash(req.body)]);
    res.status(202).json({ accepted: true });
  } catch (error) { next(error); }
});

router.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof DomainError ? error.message : "internal_error";
  const status = error instanceof DomainError ? (/scope_denied|membership_inactive/.test(message) ? 403 : 422) : 500;
  if (status === 500) console.error("Nonprofit workflow error", error?.message);
  res.status(status).json({ error: message });
});

export default router;
