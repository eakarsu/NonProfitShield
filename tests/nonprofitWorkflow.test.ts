import test from "node:test";
import assert from "node:assert/strict";
import { authorize, decideApproval, hash, integrationDelivery, reconcile, transitionRecord, validateOfflineEnvelope, validateRecord } from "../server/domain/nonprofitWorkflow";

test("organization and role scope is enforceable", () => {
  authorize({ organizationId: "o1", role: "field_staff", status: "active" }, "o1", "offline");
  assert.throws(() => authorize({ organizationId: "o2", role: "executive" }, "o1", "read"), /organization_scope_denied/);
  assert.throws(() => authorize({ organizationId: "o1", role: "volunteer" }, "o1", "approve"), /role_scope_denied/);
});

test("beneficiary records require consent and a vault reference", () => {
  assert.throws(() => validateRecord("beneficiary", { externalRef: "b1", alias: "A", consentId: "c", protectedDataRef: "plain text", sourceVersion: "v1" }), /vault_reference/);
  const result = validateRecord("beneficiary", { externalRef: "b1", alias: "A", consentId: "c", protectedDataRef: "vault://beneficiaries/b1", sourceVersion: "v1" });
  assert.equal(result.state, "intake"); assert.equal(result.dataHash.length, 64);
});

test("consequential transitions require independent approval", () => {
  assert.throws(() => transitionRecord("grant", "submitted", "awarded"), /approved_decision_required/);
  assert.throws(() => transitionRecord("grant", "submitted", "awarded", { approvalId: "a", requesterId: "u", approverId: "u" }), /independent_approval/);
  assert.equal(transitionRecord("grant", "submitted", "awarded", { approvalId: "a", requesterId: "u", approverId: "v" }), "awarded");
  assert.throws(() => decideApproval("u", "u", "approved"), /independent_approval/);
});

test("offline envelopes are ordered and payload-bound", () => {
  const payload = { kind: "outcome", value: 3 };
  const result = validateOfflineEnvelope({ deviceId: "d", eventId: "e", recordedAt: "2026-07-19T10:00:00Z", schemaVersion: 1, sequence: 0, payload });
  assert.equal(result.payloadHash, hash(payload));
  assert.throws(() => validateOfflineEnvelope({ deviceId: "d", eventId: "e", recordedAt: "bad", schemaVersion: 1, sequence: 0, payload }), /invalid_offline/);
});

test("integrations are typed and reconciliation is deterministic", () => {
  assert.equal(integrationDelivery("accounting", "journal.upsert", { amount: 10 }, "i").connector, "accounting");
  assert.throws(() => integrationDelivery("generic", "upsert", {}, "i"), /unsupported_connector/);
  assert.deepEqual(reconcile({ amount: 10, currency: "USD" }, { amount: 11, currency: "USD" }).differences, ["amount"]);
});
