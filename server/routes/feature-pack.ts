import { Router, type Request, type Response, type NextFunction } from "express";
import { pool } from "../db";
import { storage } from "../storage";
import * as fp from "../lib/feature-pack";

const router = Router();
function userId(req: any): string | null { return req.session?.userId || req.user?.claims?.sub || null; }
function requireAuth(req: any, res: Response, next: NextFunction) { if (!userId(req)) return res.status(401).json({ error: "authentication_required" }); next(); }
router.use(requireAuth);

let ensured = false;
async function ensureTasks() {
  if (ensured) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS nonprofit_workspace_tasks (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', priority TEXT NOT NULL DEFAULT 'medium', description TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  ensured = true;
}
// Authenticated tasks: list/create/update
router.get("/tasks", async (req: any, res, next) => {
  try {
    await ensureTasks(); const uid = userId(req)!;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : ""; const status = typeof req.query.status === "string" ? req.query.status : "";
    const params: any[] = [uid]; const clauses = ["user_id=$1"];
    if (status) { params.push(status); clauses.push(`status=$${params.length}`); }
    if (q) { params.push(`%${q}%`); clauses.push(`title ILIKE $${params.length}`); }
    const r = await pool.query(`SELECT * FROM nonprofit_workspace_tasks WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT 200`, params);
    res.json({ tasks: r.rows });
  } catch (e) { next(e); }
});
router.post("/tasks", async (req: any, res, next) => {
  try {
    await ensureTasks(); const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) return res.status(400).json({ error: "title_required" });
    const id = (await import("node:crypto")).randomUUID();
    const r = await pool.query("INSERT INTO nonprofit_workspace_tasks(id,user_id,title,status,priority,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING *", [id, userId(req), title, req.body.status || "open", req.body.priority || "medium", req.body.description || ""]);
    res.status(201).json({ task: r.rows[0] });
  } catch (e) { next(e); }
});
router.patch("/tasks/:id", async (req: any, res, next) => {
  try {
    await ensureTasks(); const fields: string[] = []; const params: any[] = [];
    for (const k of ["title", "status", "priority", "description"]) if (k in (req.body || {})) { params.push(req.body[k]); fields.push(`${k}=$${params.length}`); }
    if (!fields.length) return res.status(400).json({ error: "no_changes" });
    params.push(req.params.id, userId(req));
    const r = await pool.query(`UPDATE nonprofit_workspace_tasks SET ${fields.join(",")},updated_at=NOW() WHERE id=$${params.length - 1} AND user_id=$${params.length} RETURNING *`, params);
    if (!r.rowCount) return res.status(404).json({ error: "task_not_found" });
    res.json({ task: r.rows[0] });
  } catch (e) { next(e); }
});
// JSON/CSV export of main records (policies)
router.get("/policies/export", async (req: any, res, next) => {
  try {
    const policies: any[] = await storage.getUserPolicies(userId(req)!);
    const q = typeof req.query.q === "string" ? req.query.q.toLowerCase() : ""; const status = typeof req.query.status === "string" ? req.query.status : "";
    const rows = policies.filter((p) => (!status || p.status === status) && (!q || JSON.stringify(p).toLowerCase().includes(q)));
    if (req.query.format === "json") { res.setHeader("Content-Disposition", 'attachment; filename="policies.json"'); return res.type("application/json").send(fp.recordsToJson(rows)); }
    res.setHeader("Content-Disposition", 'attachment; filename="policies.csv"'); return res.type("text/csv").send(fp.recordsToCsv(rows as any, ["id", "type", "status", "coverageAmount", "monthlyPremium", "deductible"]));
  } catch (e) { next(e); }
});
// AI: deterministic fallback unless provider configured
router.post("/ai/coverage-summary", async (req: any, res, next) => {
  try {
    const rows: any[] = await storage.getUserPolicies(userId(req)!);
    if (!fp.hasProvider()) return res.json(fp.fallbackCoverageSummary(rows));
    return res.json(await fp.callProvider("coverage-summary", `Summarise coverage.\nRecords: ${JSON.stringify(rows).slice(0, 6000)}`));
  } catch (e) { next(e); }
});
router.post("/ai/claims-risk", async (req: any, res, next) => {
  try {
    const rows: any[] = await storage.getUserClaims(userId(req)!);
    if (!fp.hasProvider()) return res.json(fp.fallbackClaimsRisk(rows));
    return res.json(await fp.callProvider("claims-risk", `Assess claims risk.\nRecords: ${JSON.stringify(rows).slice(0, 6000)}`));
  } catch (e) { next(e); }
});
router.post("/ai/program-health", async (req: any, res, next) => {
  try {
    const r = await pool.query("SELECT kind,state FROM nonprofit_records WHERE organization_id=$1 LIMIT 200", [String(req.header("x-organization-id") || "")]).catch(() => ({ rows: [] as any[] }));
    if (!fp.hasProvider()) return res.json(fp.fallbackProgramHealth(r.rows));
    return res.json(await fp.callProvider("program-health", `Summarise programme health.\nRecords: ${JSON.stringify(r.rows).slice(0, 6000)}`));
  } catch (e) { next(e); }
});
router.use((error: any, _req: Request, res: Response, _next: NextFunction) => { res.status(error.status || 500).json({ error: error.message || "internal_error" }); });
export default router;
