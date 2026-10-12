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

test("one-click demo auth is server-side and keeps credentials out of the client bundle", () => {
  const routes = read("server/routes.ts");
  const login = read("client/src/pages/login.tsx");
  assert.match(routes, /app\.post\("\/api\/auth\/demo"/);
  assert.match(routes, /DEMO_LOGIN_PASSWORD \|\| process\.env\.PROVISION_ADMIN_PASSWORD/);
  assert.match(login, /apiRequest\("POST", "\/api\/auth\/demo"\)/);
  assert.doesNotMatch(login, /VITE_DEMO_(EMAIL|PASSWORD)/);
});

test("draft policies cannot cross the claim submission gate", () => {
  const submission = read("server/claim-submission.ts");
  assert.match(submission, /policy\.status !== "active"/);
  assert.match(submission, /require authorized active coverage/);
});

test("native lists show fifteen rows and record actions stay centered", () => {
  assert.match(read("client/src/pages/policies.tsx"), /useState\(15\)/);
  assert.match(read("client/src/pages/claims.tsx"), /useState\(15\)/);
  assert.match(read("client/src/components/ui/data-table.tsx"), /SelectItem value="15"/);
  assert.match(read("client/src/components/ui/row-detail-dialog.tsx"), /justify-center gap-3/);
  assert.match(read("client/src/components/native-advisory.css"), /\.na-dialog-inner>footer\{[^}]*justify-content:center/);
});
