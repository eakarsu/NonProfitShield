import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { recordsToCsv, recordsToJson, readableSections, fallbackCoverageSummary, fallbackClaimsRisk, hasProvider } from "../server/lib/feature-pack";

const root = path.resolve(import.meta.dirname, "..");
const read = (n: string) => fs.readFileSync(path.join(root, n), "utf8");

test("export preserves false, 0 and empty values", () => {
  const rows = [{ name: "A", count: 0, active: false, note: "" }];
  assert.match(recordsToCsv(rows as any, ["name", "count", "active", "note"]), /A,0,false,/);
  const parsed = JSON.parse(recordsToJson(rows));
  assert.equal(parsed.records[0].count, 0); assert.equal(parsed.records[0].active, false); assert.equal(parsed.records[0].note, "");
});
test("deterministic AI fallback is labelled and grounded", () => {
  const out = fallbackCoverageSummary([{ status: "active", type: "auto" }, { status: "active", type: "home" }]);
  assert.equal(out.aiGenerated, false); assert.equal(out.sections.totalPolicies, 2); assert.equal(out.sections.activePolicies, 2);
  assert.equal(fallbackClaimsRisk([{ status: "open" }]).aiGenerated, false);
  assert.equal(hasProvider({} as any), false);
});
test("readable sections preserve false, 0 and empty", () => {
  const text = readableSections({ count: 0, active: false, note: "" });
  assert.match(text, /Count: 0/); assert.match(text, /Active: false/); assert.match(text, /Note: \(empty\)/);
});
test("feature pack tasks, search and export are mounted with auth", () => {
  assert.match(read("server/index.ts"), /\/api\/feature/);
  assert.match(read("server/routes/feature-pack.ts"), /router\.get\("\/tasks"/);
  assert.match(read("server/routes/feature-pack.ts"), /authentication_required/);
  assert.match(read("server/routes/nonprofit.ts"), /req\.query\.q/);
});
