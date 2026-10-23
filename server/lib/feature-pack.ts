// Pure helpers: export, readable rendering, deterministic AI fallback (no provider call).
export function escCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function recordsToCsv(rows: Record<string, unknown>[], fields: string[]): string {
  return [fields.join(","), ...rows.map((r) => fields.map((k) => escCsv(r[k])).join(","))].join("\n") + "\n";
}
export function recordsToJson(rows: unknown[]): string { return JSON.stringify({ exportedAt: new Date().toISOString(), records: rows }, null, 2); }
export function readableLabel(k: string): string { return String(k).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()); }
export function scalar(v: unknown): string { if (v === null || v === undefined) return "(not supplied)"; if (v === "") return "(empty)"; return String(v); }
export function readableSections(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.map((v) => readableSections(v)).join("\n") : "(empty list)";
  if (value && typeof value === "object") {
    const e = Object.entries(value as Record<string, unknown>);
    return e.length ? e.map(([k, v]) => (v && typeof v === "object" ? `${readableLabel(k)}:\n${readableSections(v)}` : `${readableLabel(k)}: ${scalar(v)}`)).join("\n") : "(no fields)";
  }
  return scalar(value);
}
export function hasProvider(env: NodeJS.ProcessEnv = process.env): boolean { return Boolean((env.OPENROUTER_API_KEY || env.OPENAI_API_KEY || "").trim()); }
function countBy(rows: Record<string, any>[], key: string): Record<string, number> { const o: Record<string, number> = {}; for (const r of rows || []) { const k = String(r[key] ?? "(empty)"); o[k] = (o[k] || 0) + 1; } return o; }
export function fallbackCoverageSummary(policies: Record<string, any>[] = []) {
  const byStatus = countBy(policies, "status"); const byType = countBy(policies, "type");
  return { aiGenerated: false, source: "deterministic-fallback", providerConfigured: false, feature: "coverage-summary", summary: `${policies.length} policy record(s) reviewed.`, sections: { totalPolicies: policies.length, byStatus, byType, activePolicies: byStatus.active || 0 }, readable: readableSections({ totalPolicies: policies.length, byStatus, byType }) };
}
export function fallbackClaimsRisk(claims: Record<string, any>[] = []) {
  const byStatus = countBy(claims, "status");
  const open = claims.filter((c) => !["paid", "closed", "denied"].includes(String(c.status))).length;
  return { aiGenerated: false, source: "deterministic-fallback", providerConfigured: false, feature: "claims-risk", summary: `${claims.length} claim(s); ${open} open.`, sections: { totalClaims: claims.length, byStatus, openClaims: open }, readable: readableSections({ totalClaims: claims.length, byStatus, openClaims: open }) };
}
export function fallbackProgramHealth(records: Record<string, any>[] = []) {
  const byState = countBy(records, "state"); const byKind = countBy(records, "kind");
  return { aiGenerated: false, source: "deterministic-fallback", providerConfigured: false, feature: "program-health", summary: `${records.length} programme record(s) reviewed.`, sections: { totalRecords: records.length, byState, byKind }, readable: readableSections({ totalRecords: records.length, byState, byKind }) };
}
export async function callProvider(feature: string, prompt: string, env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch): Promise<any> {
  const key = (env.OPENROUTER_API_KEY || env.OPENAI_API_KEY || "").trim();
  if (!key) return null;
  const isOR = Boolean((env.OPENROUTER_API_KEY || "").trim());
  const base = isOR ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";
  const model = env.OPENROUTER_MODEL || env.OPENAI_MODEL || (isOR ? "openrouter/free" : "gpt-4o-mini");
  const res = await fetchImpl(`${base}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "system", content: "Return JSON {summary, sections} grounded only in supplied records." }, { role: "user", content: prompt }], temperature: 0.2 }) });
  if (!res.ok) { const e: any = new Error(`AI provider failed with HTTP ${res.status}`); e.status = 502; throw e; }
  const data: any = await res.json(); const content = data?.choices?.[0]?.message?.content || "";
  if (!content || !data?.id) { const e: any = new Error("AI provider returned incomplete response"); e.status = 502; throw e; }
  let parsed: any; try { parsed = JSON.parse(content); } catch { parsed = { summary: content, sections: {} }; }
  return { aiGenerated: true, source: isOR ? "openrouter" : "openai", providerConfigured: true, feature, model: data.model || model, providerReceiptId: data.id, ...parsed, readable: readableSections(parsed.sections || parsed) };
}
