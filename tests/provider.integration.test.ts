import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { dispatch } from "../server/providers/nonprofitProviders";

test("fundraising adapter requires a payload-bound receipt", async () => {
  const server = http.createServer((req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ providerRequestId: "p1", payloadHash: req.headers["x-payload-hash"] })); });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.FUNDRAISING_PROVIDER_URL = `http://127.0.0.1:${(server.address() as any).port}`; process.env.FUNDRAISING_PROVIDER_TOKEN = "test";
  try { assert.equal((await dispatch({ connector: "fundraising", operation: "donor.upsert", payload: {}, payload_hash: "a".repeat(64), idempotency_key: "i" })).providerRequestId, "p1"); }
  finally { server.close(); }
});

test("provider failure remains explicit for retry and dead-letter policy", async () => {
  const server = http.createServer((_req, res) => { res.statusCode = 503; res.end("{}"); });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.ACCOUNTING_PROVIDER_URL = `http://127.0.0.1:${(server.address() as any).port}`; process.env.ACCOUNTING_PROVIDER_TOKEN = "test";
  try { await assert.rejects(() => dispatch({ connector: "accounting", operation: "journal.upsert", payload: {}, payload_hash: "b".repeat(64), idempotency_key: "i2" }), /provider_503/); }
  finally { server.close(); }
});
