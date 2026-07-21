// Extra Routes — Custom Feature Suggestions (batch 11)
// Implements: Claims Chatbot, Risk + Premium Prediction, Compliance Monitoring,
// Batch Claims OCR, Provider Directory / Telemedicine, Nonprofit Wellness.

import type { Express, RequestHandler } from "express";
import OpenAI from "openai";

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";

async function ask(systemPrompt: string, userPrompt: string, maxTokens = 1200): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    const e: any = new Error("OPENROUTER_API_KEY not configured");
    e.status = 503;
    throw e;
  }
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const r = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
  });
  return r.choices?.[0]?.message?.content || "";
}

function safe(res: any, err: any) {
  res.status(err?.status || 500).json({ message: err?.message || "AI failed" });
}

export function registerExtraRoutes(app: Express, isAuth: RequestHandler) {
  // 1) Claims Chatbot — FAQ + status via chat.
  app.post("/api/extras/claims-chat", isAuth, async (req: any, res) => {
    try {
      const { message, claimId, history = [] } = req.body || {};
      if (!message) return res.status(400).json({ message: "message required" });
      const sys = "You are a non-profit insurance claims chatbot. Answer FAQs (deductible, status, required documents) and reference claim ID if provided. Be empathetic and concise.";
      const context = history.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join("\n");
      const out = await ask(sys, `Claim: ${claimId || "n/a"}\nRecent:\n${context}\nUser: ${message}`, 800);
      res.json({ reply: out, claimId: claimId || null });
    } catch (e) { safe(res, e); }
  });

  // 2) Risk Assessment & Premium Prediction.
  app.post("/api/extras/risk-premium", isAuth, async (req: any, res) => {
    try {
      const { orgProfile, claimHistory = [], coverageLines = [] } = req.body || {};
      if (!orgProfile) return res.status(400).json({ message: "orgProfile required" });
      const sys = "You are an actuarial assistant for nonprofit insurance. Estimate risk score (0-100), suggest premium ranges per coverage line, and list top three risk drivers. Output JSON.";
      const user = `Org: ${JSON.stringify(orgProfile).slice(0, 3000)}\nClaim history: ${JSON.stringify(claimHistory).slice(0, 3000)}\nLines: ${JSON.stringify(coverageLines).slice(0, 1500)}`;
      const out = await ask(sys, user, 1200);
      res.json({ raw: out });
    } catch (e) { safe(res, e); }
  });

  // 3) Compliance Monitoring — flag lapses + regulatory deltas.
  app.post("/api/extras/compliance-watch", isAuth, async (req: any, res) => {
    try {
      const { policies = [], state, recentRegulationNotes = "" } = req.body || {};
      const sys = "You are a compliance monitor. Identify policies near expiry, regulatory changes by state, and required disclosures. Output JSON: { lapsingPolicies, regulatoryChanges, recommendedActions }.";
      const user = `State: ${state || "n/a"}\nPolicies: ${JSON.stringify(policies).slice(0, 4000)}\nRegulatoryNotes: ${recentRegulationNotes.slice(0, 2000)}`;
      const out = await ask(sys, user, 1200);
      res.json({ raw: out });
    } catch (e) { safe(res, e); }
  });

  // 4) Batch Claims Processing Agent — ingest extracted fields, validate, queue.
  app.post("/api/extras/batch-claims", isAuth, async (req: any, res) => {
    try {
      const { claims = [] } = req.body || {};
      if (!claims.length) return res.status(400).json({ message: "claims[] required" });
      const sys = "You are a claims-intake validator. For each claim, validate required fields (policyId, dateOfLoss, claimantName, description, amount), produce nextStep (auto-approve|adjuster|return-to-claimant), and return JSON array.";
      const out = await ask(sys, `Claims:\n${JSON.stringify(claims).slice(0, 6000)}`, 1500);
      res.json({ raw: out, count: claims.length });
    } catch (e) { safe(res, e); }
  });

  // 5) Provider Directory & Telemedicine — registry + booking stub.
  // TODO: configure credentials — TELEHEALTH_API_KEY, TELEHEALTH_BASE_URL.
  const providers = new Map<string, any>();
  app.post("/api/extras/providers", isAuth, async (req: any, res) => {
    const { id, name, specialty, region, telehealthEndpoint } = req.body || {};
    if (!id || !name) return res.status(400).json({ message: "id and name required" });
    providers.set(id, { id, name, specialty, region, telehealthEndpoint, registeredAt: new Date().toISOString() });
    res.json({ provider: providers.get(id) });
  });
  app.get("/api/extras/providers", isAuth, async (_req: any, res) => {
    res.json({ providers: Array.from(providers.values()) });
  });
  app.post("/api/extras/telemed-book", isAuth, async (req: any, res) => {
    const { providerId, patientId, scheduledFor } = req.body || {};
    if (!providerId || !patientId) return res.status(400).json({ message: "providerId and patientId required" });
    const p = providers.get(providerId);
    if (!p) return res.status(404).json({ message: "provider not found" });
    if (!process.env.TELEHEALTH_API_KEY) {
      return res.status(503).json({ message: "TELEHEALTH_API_KEY not configured. TODO: configure credentials." });
    }
    res.json({ booking: { providerId, patientId, scheduledFor, status: "confirmed" } });
  });

  // 6) Nonprofit Wellness Program — preventive care plan with discount calc.
  app.post("/api/extras/wellness-plan", isAuth, async (req: any, res) => {
    try {
      const { orgSize, riskProfile = {}, baseDiscount = 0.05 } = req.body || {};
      if (!orgSize) return res.status(400).json({ message: "orgSize required" });
      const sys = "You are a workplace wellness designer. Recommend a quarterly wellness program (preventive care, screenings, mental-health resources) scaled to org size, and suggest premium discount tiers. Output JSON.";
      const out = await ask(sys, `Org size: ${orgSize}\nRiskProfile: ${JSON.stringify(riskProfile).slice(0, 2000)}\nBaseDiscount: ${baseDiscount}`, 1300);
      res.json({ raw: out, defaultDiscount: baseDiscount });
    } catch (e) { safe(res, e); }
  });
}
