# Completeness Review: NonProfitShield

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 139 project files (115 source files), 1 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished nonprofit operations application, not just an empty scaffold. Inspection found 115 source files across `client/`, `server/`, `attached_assets/`, `shared/` using Next.js, React, Express; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Implement enforceable organization/role permissions for staff, volunteers, partners, and field teams.
2. Add donor, grant, program, beneficiary, outcome, and consent records with auditable lifecycle transitions.
3. Integrate fundraising/accounting and communications systems with deduplication and reconciliation.
4. Add privacy retention controls, offline field capture, approval workflows, and nonprofit-specific acceptance tests.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.
- Regression risk is high because no recognizable project-owned automated tests cover the main path.
- No CI evidence prevents broken or insecure changes from reaching a release.

## Evidence inspected

- `server/index.ts:5`
- `client/src/components/GapFeaturePage.jsx:54`
- `server/db.ts`
- `server/extraRoutes.ts`
- `package.json`
- `Dockerfile`

## Recommended next action

Choose one real nonprofit operations journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

1. Implemented organization-scoped memberships and enforceable least-privilege roles for executives, program managers, finance, fundraisers, field staff, volunteers, partners, and auditors in `server/domain/nonprofitWorkflow.ts`, `server/routes/nonprofit.ts`, and `migrations/001_authoritative_nonprofit.sql`. Every supported operation binds an authenticated user to an active organization membership; cross-organization and unauthorized actions fail closed.
2. Added durable, versioned donor, grant, program, beneficiary, outcome, and consent records with deterministic input hashes, ownership, retention deadlines, guarded lifecycle state machines, independent approvals for consequential transitions, evidence-linked history, and append-only audits. Beneficiary payloads require active consent and `vault://` protected-data references, while outcomes require an active program and versioned measurement provenance.
3. Added typed fundraising, accounting, and communications adapters with durable jobs, organization-scoped idempotency, payload hashes, bounded retry/backoff, verified receipts, dead letters, signed/deduplicated webhooks, and persisted source-version reconciliation results. Unsupported connectors and unconfigured or failing providers remain explicit failures rather than simulated success.
4. Added consent withdrawal handling, bounded organization-scoped retention purge, privacy-safe request logging, out-of-band verification/reset secrets, independently approved actions, and device-sequenced offline field envelopes with payload-bound conflict detection. `RUNBOOK.md`, `.env.example`, an unprivileged external-database Docker image, and readiness-only startup document and enforce the safe operating path; automatic database initialization and production seeding were removed.
5. Added domain, authorization, lifecycle, offline, reconciliation, provider-success/failure, architecture, container-safety, and PostgreSQL constraint tests plus CI that applies migrations twice, runs the database integration test, type-checks, audits high-severity runtime dependencies, tests, and builds. On 2026-07-19, 11 local workflow/architecture tests passed; the migration runner applied cleanly and repeatably to a disposable PostgreSQL 15 database, and its database-backed tenant-idempotency/immutable-audit test also passed there. TypeScript validation, runtime dependency audit, and the production client/server build passed.

External launch gates remain honest: production still requires provisioned PostgreSQL, organization/membership administration, an approved beneficiary data vault, real fundraising/accounting/communications credentials and provider schemas, webhook acceptance, migration/restore rehearsal, offline conflict and intended-volume load exercises, reconciliation ownership, and legal approval of consent, retention, donor, and beneficiary-data policies. No provider delivery, legal compliance, beneficiary safety outcome, production recovery, or external-system reconciliation is claimed.

## Runtime and login acceptance (2026-07-20)

- `start.sh` validates Node, port, database, and session-secret prerequisites and then replaces itself with the project-owned server process. It never installs dependencies, migrates, seeds, or kills other processes.
- Non-production source startup uses the checked-in TypeScript entry point; production startup requires the prebuilt `dist/index.js` artifact. Database migration remains an explicit `npm run migrate` operation.
- `npm run create-admin` provides bounded one-time local identity provisioning. It requires explicit credentials, creates only a missing verified administrator, and refuses to rotate credentials or elevate an existing account implicitly.
- `/api/auth/me` exposes the same authenticated, sensitivity-filtered session representation as `/api/auth/user`, allowing login acceptance to verify that the returned cookie establishes a real server-side session.
- Optional OpenRouter configuration is resolved only when an AI operation is invoked; missing provider credentials no longer prevent health, login, or authoritative nonprofit workflows from starting, and provider calls still fail explicitly rather than returning simulated output.
