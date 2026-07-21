BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
 id VARCHAR PRIMARY KEY, email VARCHAR UNIQUE, first_name VARCHAR, last_name VARCHAR, profile_image_url VARCHAR,
 password VARCHAR, role VARCHAR NOT NULL DEFAULT 'member', email_verified BOOLEAN NOT NULL DEFAULT FALSE,
 email_verification_token VARCHAR, password_reset_token VARCHAR, password_reset_expires TIMESTAMP,
 created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sessions (sid VARCHAR PRIMARY KEY, sess JSON NOT NULL, expire TIMESTAMP NOT NULL);
CREATE INDEX IF NOT EXISTS nonprofit_session_expiry_idx ON sessions(expire);

CREATE TABLE IF NOT EXISTS nonprofit_organizations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
 default_retention_days INTEGER NOT NULL DEFAULT 365 CHECK(default_retention_days BETWEEN 1 AND 3650), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS nonprofit_memberships (
 organization_id UUID NOT NULL REFERENCES nonprofit_organizations(id), user_id VARCHAR NOT NULL REFERENCES users(id),
 role TEXT NOT NULL CHECK(role IN ('executive','program_manager','finance','fundraiser','field_staff','volunteer','partner','auditor')),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','revoked')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(organization_id,user_id)
);
CREATE INDEX IF NOT EXISTS nonprofit_membership_user_idx ON nonprofit_memberships(user_id,organization_id);

CREATE TABLE IF NOT EXISTS nonprofit_records (
 id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES nonprofit_organizations(id),
 kind TEXT NOT NULL CHECK(kind IN ('donor','grant','program','beneficiary','outcome','consent')), external_ref TEXT NOT NULL,
 state TEXT NOT NULL, owner_id VARCHAR NOT NULL, data JSONB NOT NULL, data_hash CHAR(64) NOT NULL,
 consent_record_id UUID REFERENCES nonprofit_records(id) ON DELETE SET NULL, version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(organization_id,kind,external_ref)
);
CREATE INDEX IF NOT EXISTS nonprofit_records_scope_idx ON nonprofit_records(organization_id,kind,state);
CREATE INDEX IF NOT EXISTS nonprofit_records_retention_idx ON nonprofit_records(organization_id,expires_at);

CREATE TABLE IF NOT EXISTS nonprofit_approvals (
 id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES nonprofit_organizations(id), resource_kind TEXT NOT NULL,
 resource_id UUID NOT NULL, requested_transition TEXT NOT NULL, requested_by VARCHAR NOT NULL, reason TEXT NOT NULL,
 decision TEXT NOT NULL DEFAULT 'pending' CHECK(decision IN ('pending','approved','rejected')), decided_by VARCHAR,
 decision_note TEXT, requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), decided_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS nonprofit_record_history (
 id BIGSERIAL PRIMARY KEY, organization_id UUID NOT NULL, record_id UUID NOT NULL REFERENCES nonprofit_records(id),
 from_state TEXT, to_state TEXT NOT NULL, actor_id VARCHAR NOT NULL, approval_id UUID REFERENCES nonprofit_approvals(id),
 evidence_hash CHAR(64) NOT NULL, occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nonprofit_integration_jobs (
 id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES nonprofit_organizations(id),
 connector TEXT NOT NULL CHECK(connector IN ('fundraising','accounting','communications')), operation TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, payload_hash CHAR(64) NOT NULL, payload JSONB NOT NULL, approval_id UUID REFERENCES nonprofit_approvals(id),
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','leased','retrying','confirmed','dead_letter')),
 attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 5, next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 last_error TEXT, receipt JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(organization_id,connector,idempotency_key)
);
CREATE TABLE IF NOT EXISTS nonprofit_reconciliations (
 id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES nonprofit_organizations(id), connector TEXT NOT NULL,
 source_version TEXT NOT NULL, expected JSONB NOT NULL, observed JSONB NOT NULL, matched BOOLEAN NOT NULL,
 differences JSONB NOT NULL, result_hash CHAR(64) NOT NULL, reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS nonprofit_webhook_receipts (
 id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES nonprofit_organizations(id), connector TEXT NOT NULL,
 provider_event_id TEXT NOT NULL, payload_hash CHAR(64) NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(organization_id,connector,provider_event_id)
);
CREATE TABLE IF NOT EXISTS nonprofit_offline_events (
 id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES nonprofit_organizations(id), actor_id VARCHAR NOT NULL,
 device_id TEXT NOT NULL, event_id TEXT NOT NULL, schema_version INTEGER NOT NULL CHECK(schema_version>0),
 sequence BIGINT NOT NULL CHECK(sequence>=0), recorded_at TIMESTAMPTZ NOT NULL, payload JSONB NOT NULL, payload_hash CHAR(64) NOT NULL,
 sync_status TEXT NOT NULL DEFAULT 'accepted' CHECK(sync_status IN ('accepted','applied','rejected')),
 received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(organization_id,device_id,event_id), UNIQUE(organization_id,device_id,sequence)
);

CREATE TABLE IF NOT EXISTS nonprofit_audit (
 id BIGSERIAL PRIMARY KEY, organization_id UUID NOT NULL, actor_id VARCHAR NOT NULL, actor_role TEXT NOT NULL,
 action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, before_hash CHAR(64), after_hash CHAR(64),
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb, occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION nonprofit_audit_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'nonprofit_audit is append-only'; END; $$;
DROP TRIGGER IF EXISTS nonprofit_audit_no_update ON nonprofit_audit;
CREATE TRIGGER nonprofit_audit_no_update BEFORE UPDATE OR DELETE ON nonprofit_audit FOR EACH ROW EXECUTE FUNCTION nonprofit_audit_immutable();
COMMIT;
