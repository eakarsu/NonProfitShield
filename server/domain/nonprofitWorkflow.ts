import crypto from "node:crypto";

export const resourceKinds = ["donor", "grant", "program", "beneficiary", "outcome", "consent"] as const;
export type ResourceKind = (typeof resourceKinds)[number];

const permissions: Record<string, Set<string>> = {
  executive: new Set(["read", "create", "transition", "approve", "integrate", "offline", "configure", "purge"]),
  program_manager: new Set(["read", "create", "transition", "approve", "offline"]),
  finance: new Set(["read", "create", "transition", "approve", "integrate"]),
  fundraiser: new Set(["read", "create", "transition", "integrate"]),
  field_staff: new Set(["read", "create", "transition", "offline"]),
  volunteer: new Set(["read", "offline"]),
  partner: new Set(["read", "offline"]),
  auditor: new Set(["read"]),
};

export const transitions: Record<ResourceKind, Record<string, string[]>> = {
  donor: { prospect: ["active", "inactive"], active: ["inactive", "erasure_pending"], inactive: ["active", "erasure_pending"], erasure_pending: [] },
  grant: { prospect: ["submitted", "closed"], submitted: ["awarded", "rejected"], awarded: ["closed"], rejected: ["closed"], closed: [] },
  program: { draft: ["approval_pending", "closed"], approval_pending: ["active", "rejected"], active: ["paused", "closed"], paused: ["active", "closed"], rejected: [], closed: [] },
  beneficiary: { intake: ["consented", "withdrawn"], consented: ["enrolled", "withdrawn"], enrolled: ["exited", "withdrawn"], exited: [], withdrawn: [] },
  outcome: { draft: ["review_pending"], review_pending: ["approved", "rejected"], approved: [], rejected: ["draft"] },
  consent: { granted: ["withdrawn", "expired"], withdrawn: [], expired: [] },
};

const initialStates: Record<ResourceKind, string> = {
  donor: "prospect", grant: "prospect", program: "draft", beneficiary: "intake", outcome: "draft", consent: "granted",
};

const requiredFields: Record<ResourceKind, string[]> = {
  donor: ["externalRef", "displayName", "sourceVersion"],
  grant: ["externalRef", "title", "funder", "amount", "currency", "sourceVersion"],
  program: ["externalRef", "name", "ownerId", "startDate", "sourceVersion"],
  beneficiary: ["externalRef", "alias", "consentId", "protectedDataRef", "sourceVersion"],
  outcome: ["externalRef", "programId", "metric", "value", "unit", "observedAt", "sourceVersion"],
  consent: ["externalRef", "subjectRef", "purpose", "retentionDays", "sourceVersion"],
};

export class DomainError extends Error {}

const canonical = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((out, key) => {
        out[key] = canonical((value as Record<string, unknown>)[key]); return out;
      }, {})
    : value;

export const hash = (value: unknown): string => crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");

export function authorize(identity: { organizationId: string; role: string; status?: string }, organizationId: string, action: string): void {
  if (!identity || identity.organizationId !== organizationId) throw new DomainError("organization_scope_denied");
  if (identity.status && identity.status !== "active") throw new DomainError("membership_inactive");
  if (!permissions[identity.role]?.has(action)) throw new DomainError("role_scope_denied");
}

export function validateRecord(kind: string, input: Record<string, unknown>): { kind: ResourceKind; state: string; data: Record<string, unknown>; dataHash: string; retentionDays: number } {
  if (!resourceKinds.includes(kind as ResourceKind)) throw new DomainError("unsupported_resource_kind");
  const typedKind = kind as ResourceKind;
  const missing = requiredFields[typedKind].filter((field) => input[field] === undefined || input[field] === null || input[field] === "");
  if (missing.length) throw new DomainError(`missing_fields:${missing.join(",")}`);
  if (typedKind === "grant" && (!Number.isFinite(Number(input.amount)) || Number(input.amount) < 0)) throw new DomainError("invalid_grant_amount");
  if (typedKind === "outcome" && (!Number.isFinite(Number(input.value)) || Number.isNaN(Date.parse(String(input.observedAt))))) throw new DomainError("invalid_outcome_measurement");
  if (typedKind === "beneficiary" && !String(input.protectedDataRef).startsWith("vault://")) throw new DomainError("beneficiary_vault_reference_required");
  const retentionDays = Number(input.retentionDays ?? 365);
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) throw new DomainError("invalid_retention_days");
  const data = { ...input };
  return { kind: typedKind, state: initialStates[typedKind], data, dataHash: hash(data), retentionDays };
}

export function transitionRecord(kind: ResourceKind, current: string, target: string, context: { approvalId?: string; requesterId?: string; approverId?: string } = {}): string {
  if (!transitions[kind]?.[current]?.includes(target)) throw new DomainError("invalid_lifecycle_transition");
  const approvalRequired = target === "awarded" || target === "active" || target === "approved";
  if (approvalRequired && !context.approvalId) throw new DomainError("approved_decision_required");
  if (approvalRequired && context.requesterId && context.requesterId === context.approverId) throw new DomainError("independent_approval_required");
  return target;
}

export function decideApproval(requesterId: string, approverId: string, decision: string): string {
  if (requesterId === approverId) throw new DomainError("independent_approval_required");
  if (!['approved', 'rejected'].includes(decision)) throw new DomainError("invalid_approval_decision");
  return decision;
}

export function validateOfflineEnvelope(input: Record<string, unknown>): Record<string, unknown> & { payloadHash: string } {
  for (const field of ["deviceId", "eventId", "recordedAt", "schemaVersion", "sequence", "payload"]) if (input[field] === undefined || input[field] === "") throw new DomainError(`missing_${field}`);
  if (!Number.isInteger(input.sequence) || Number(input.sequence) < 0 || !Number.isInteger(input.schemaVersion) || Number(input.schemaVersion) < 1 || Number.isNaN(Date.parse(String(input.recordedAt)))) throw new DomainError("invalid_offline_envelope");
  const payloadHash = hash(input.payload);
  if (input.payloadHash && input.payloadHash !== payloadHash) throw new DomainError("offline_payload_hash_mismatch");
  return { ...input, payloadHash };
}

export const connectors = ["fundraising", "accounting", "communications"] as const;
export function integrationDelivery(connector: string, operation: string, payload: unknown, idempotencyKey: string): { connector: string; operation: string; payloadHash: string; idempotencyKey: string } {
  if (!connectors.includes(connector as (typeof connectors)[number])) throw new DomainError("unsupported_connector");
  if (!operation || !idempotencyKey) throw new DomainError("integration_identity_required");
  return { connector, operation, payloadHash: hash(payload), idempotencyKey };
}

export function reconcile(expected: Record<string, unknown>, observed: Record<string, unknown>): { matched: boolean; differences: string[]; resultHash: string } {
  const keys = [...new Set([...Object.keys(expected), ...Object.keys(observed)])].sort();
  const differences = keys.filter((key) => JSON.stringify(canonical(expected[key])) !== JSON.stringify(canonical(observed[key])));
  return { matched: differences.length === 0, differences, resultHash: hash({ expected, observed }) };
}
