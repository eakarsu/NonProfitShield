// === Batch 11 Gaps & Frontend Mounts ===
// Gap features (AI counterparts + Non-AI features) for NonProfitShield.
// Lazy gap_features table (in-memory), OpenRouter via native fetch.

import express from 'express';
const router = express.Router();

const gapFeatures = new Map<string, Array<{ at: string; payload: any }>>();

async function llm(systemPrompt: string, userMsg: string, maxTokens = 1400): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { const e: any = new Error('OPENROUTER_API_KEY not configured'); e.status = 503; throw e; }
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'NonProfitShield Gap Features' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }], max_tokens: maxTokens }),
  });
  const data: any = await r.json();
  if (data?.error) throw new Error(data.error.message || 'LLM error');
  return data?.choices?.[0]?.message?.content || '';
}

function track(slug: string, payload: any) {
  const list = gapFeatures.get(slug) || [];
  list.push({ at: new Date().toISOString(), payload });
  gapFeatures.set(slug, list);
}

function safe(res: any, e: any) { return res.status((e && e.status) || 500).json({ error: (e && e.message) || 'request failed' }); }

// ---- AI Gap Counterparts ----

router.post('/gap-claims-prediction', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You predict insurance claim outcomes and detect fraud signals. Provide risk score 0-100, fraud flags, and recommended next action.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('claims-prediction', { keys: Object.keys(body) });
    res.json({ prediction: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-coverage-recommendation', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You recommend insurance coverage based on nonprofit organization profile (size, mission, geography, risk factors).";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('coverage-recommendation', { keys: Object.keys(body) });
    res.json({ recommendation: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-claim-status-chatbot', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You answer customer questions about claim status. Be empathetic, clear, and provide next steps.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('claim-status-chatbot', { keys: Object.keys(body) });
    res.json({ response: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-claim-risk-scorer', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You score submitted claims for risk on a 0-100 scale and flag features that drive the score.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('claim-risk-scorer', { keys: Object.keys(body) });
    res.json({ score: out });
  } catch (e: any) { safe(res, e); }
});

// ---- Non-AI Gap Features ----

router.post('/gap-policy-doc-management', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'policy-doc-management_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('policy-doc-management', record);
  res.json({ document: record, status: 'recorded' });
});

router.post('/gap-multi-policy-holder', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'multi-policy-holder_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('multi-policy-holder', record);
  res.json({ holder: record, status: 'recorded' });
});

router.post('/gap-renewal-tracking', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'renewal-tracking_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('renewal-tracking', record);
  res.json({ reminder: record, status: 'recorded' });
});

router.post('/gap-compliance-audit-trail', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'compliance-audit-trail_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('compliance-audit-trail', record);
  res.json({ log: record, status: 'recorded' });
});

router.post('/gap-provider-directory', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'provider-directory_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('provider-directory', record);
  res.json({ provider: record, status: 'recorded' });
});

router.post('/gap-broker-portal', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'broker-portal_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('broker-portal', record);
  res.json({ broker: record, status: 'recorded' });
});

router.get('/gap-features/_audit', (req, res) => {
  const rows: Array<{ feature: string; events: number }> = [];
  for (const [k, v] of gapFeatures.entries()) rows.push({ feature: k, events: v.length });
  res.json({ rows });
});

export default router;
