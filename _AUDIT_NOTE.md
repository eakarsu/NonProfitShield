# Audit Note - NonProfitShield

Source: `_AUDIT/reports/batch_11.md` (lines 136-172).

## Original Audit Recommendations

### Missing AI Counterparts (audit reported "0 AI endpoints" — there is one inline AI helper used in claims, but no /api/ai/* endpoints existed)
- Claims-prediction or fraud-detection AI.
- Coverage-recommendation engine.
- Automated claim status chatbot.

### Missing Non-AI Features
- Document management.
- Multi-policy holder support.
- Renewal/lapse tracking.
- Compliance audit trail.
- Third-party provider integration.

### Custom Feature Suggestions
1. Claims Chatbot.
2. Risk Assessment & Premium Prediction.
3. Compliance Monitoring.
4. Batch Claims Processing Agent.
5. Provider Directory & Telemedicine.
6. Nonprofit Wellness Program.

## Implementations Applied

Added 3 helper functions in `server/openai.ts` and 3 endpoints in `server/routes.ts` matching the existing OpenAI-via-OpenRouter pattern and `isLocalAuthenticated` middleware:
- `POST /api/ai/claims-chatbot`
- `POST /api/ai/risk-assessment`
- `POST /api/ai/coverage-recommendation`

All reuse the existing `openai` SDK client (already configured for OpenRouter base URL). Risk-assessment and coverage-recommendation return strict JSON. No new dependencies.

## Backlog (Prioritized)

### High
- Document management (policy PDFs, certificates).
- Renewal/lapse tracking automation.
- Compliance audit trail.

### Medium
- Multi-policy holder support.
- Fraud detection on claim patterns.
- Batch claims processing pipeline.

### Low / Product Decisions
- Provider directory + telemedicine integrations.
- Wellness program.

## Apply pass 3 (frontend)

LEFT-AS-IS. `client/src/pages/ai-tools.tsx` already calls all three pass-2 endpoints (`/api/ai/claims-chatbot`, `/api/ai/risk-assessment`, `/api/ai/coverage-recommendation`) via the shared `apiRequest` helper. Idempotent.
