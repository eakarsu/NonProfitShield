import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

test("database enforces tenant idempotency and immutable audit", { skip: process.env.RUN_DATABASE_TESTS !== "true" }, async () => {
  const { pool } = await import("../server/db"); const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = `test-${Date.now()}`; await client.query("INSERT INTO users(id,email,email_verified) VALUES($1,$2,TRUE)", [user, `${user}@example.test`]);
    const org = (await client.query("INSERT INTO nonprofit_organizations(name) VALUES('Acceptance Test') RETURNING id")).rows[0].id;
    await client.query("INSERT INTO nonprofit_memberships(organization_id,user_id,role) VALUES($1,$2,'executive')", [org, user]);
    const job = [crypto.randomUUID(), org, "accounting", "journal.upsert", "same-key", "a".repeat(64), {}];
    await client.query("INSERT INTO nonprofit_integration_jobs(id,organization_id,connector,operation,idempotency_key,payload_hash,payload) VALUES($1,$2,$3,$4,$5,$6,$7)", job);
    await assert.rejects(() => client.query("INSERT INTO nonprofit_integration_jobs(id,organization_id,connector,operation,idempotency_key,payload_hash,payload) VALUES($1,$2,$3,$4,$5,$6,$7)", [crypto.randomUUID(), ...job.slice(1)]), /duplicate key/);
    await client.query("ROLLBACK"); await client.query("BEGIN");
    await client.query("INSERT INTO nonprofit_audit(organization_id,actor_id,actor_role,action,resource_type,resource_id) VALUES($1,$2,'executive','test','record','r')", [org, user]);
    await assert.rejects(() => client.query("UPDATE nonprofit_audit SET action='tampered' WHERE organization_id=$1", [org]), /append-only/);
    await client.query("ROLLBACK");
  } finally { client.release(); await pool.end(); }
});
