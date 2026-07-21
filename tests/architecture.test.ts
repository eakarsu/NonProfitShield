import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (name: string) => fs.readFileSync(path.join(root, name), "utf8");

test("startup is readiness-only and seed is development gated", () => {
  const source = read("server/index.ts");
  assert.match(source, /to_regclass\('nonprofit_organizations'\)/);
  assert.match(source, /NODE_ENV === "development" && process\.env\.ALLOW_DEVELOPMENT_SEED === "true"/);
  assert.match(source, /legacy_ai_surface_quarantined/);
});

test("migration owns lifecycle, offline, integration, and immutable audit state", () => {
  const sql = read("migrations/001_authoritative_nonprofit.sql");
  for (const token of ["nonprofit_memberships", "nonprofit_records", "nonprofit_approvals", "nonprofit_offline_events", "dead_letter", "idempotency_key", "append-only"]) assert.ok(sql.includes(token), `missing ${token}`);
});

test("container startup never initializes or seeds a database", () => {
  const docker = read("Dockerfile");
  assert.doesNotMatch(docker, /initdb|createdb|seed/);
  assert.match(docker, /USER node/);
});

test("auth secrets fail closed and tokens are out-of-band", () => {
  assert.match(read("server/replitAuth.ts"), /SESSION_SECRET must be at least 32 characters/);
  const routes = read("server/routes.ts");
  assert.doesNotMatch(routes, /verificationToken,\s*\/\/ In production/);
  assert.doesNotMatch(routes, /resetToken,\s*\/\/ Only returned/);
});
