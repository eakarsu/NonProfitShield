import { z } from "zod";

export const damageAssessmentSchema = z.object({
  damageType: z.string().trim().min(1).max(500),
  severity: z.enum(["minor", "moderate", "major", "total"]),
  affectedComponents: z.array(z.string().trim().min(1).max(500)).min(1).max(50),
  repairComplexity: z.enum(["simple", "moderate", "complex"]),
  estimatedCost: z.object({
    parts: z.number().finite().min(0).max(99999999.99),
    labor: z.number().finite().min(0).max(99999999.99),
    total: z.number().finite().min(0).max(99999999.99),
  }),
  confidence: z.number().finite().min(0).max(1),
  description: z.string().trim().min(1).max(15000),
  recommendations: z.array(z.string().trim().min(1).max(3000)).min(1).max(50),
});

export type DamageAssessment = z.infer<typeof damageAssessmentSchema> & {
  providerReceipt?: {
    provider: "OpenRouter";
    model: string;
    responseId: string;
    generatedAt: string;
    elapsedMs: number;
    inputTokens?: number;
    outputTokens?: number;
    submittedInputs?: { title: string; description: string; incidentDate: string };
  };
};

export function readableAssessmentValue(value: unknown, depth = 0): string {
  if (depth > 10) return "Additional detail omitted.";
  if (value === null || value === undefined) return "Not provided";
  if (typeof value === "string") {
    const trimmed = value.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, "$1");
    if (/^(?:\[|\{)/.test(trimmed)) {
      try { return readableAssessmentValue(JSON.parse(trimmed), depth + 1); } catch { /* Ordinary prose remains text. */ }
    }
    return value.replace(/```(?:json)?[ \t]*\r?\n?([\s\S]*?)\r?\n?```/gi, (fence, content) => {
      try { return readableAssessmentValue(JSON.parse(content.trim()), depth + 1); } catch { return fence; }
    }).replace(/^#{1,6}\s+/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1");
  }
  if (Array.isArray(value)) return value.map((item) => `• ${readableAssessmentValue(item, depth + 1)}`).join("\n");
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase())}: ${readableAssessmentValue(item, depth + 1)}`).join("\n");
  return typeof value === "boolean" ? value ? "Yes" : "No" : String(value);
}

// Report actions export the assessment's human-readable content, never its JSON.
export function damageAssessmentText(assessment: DamageAssessment, currentClaim?: { title: string; description: string; incidentDate: string | Date }): string {
  const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  return [
    "Damage assessment",
    ...(currentClaim && assessmentContextChanged(assessment, currentClaim) === true ? ["Claim details changed after analysis. This assessment describes the original submitted inputs below.", ""] : []),
    `Damage type: ${readableAssessmentValue(assessment.damageType)}`,
    `Severity: ${assessment.severity}`,
    `Repair complexity: ${assessment.repairComplexity}`,
    `Model-reported confidence: ${Math.round(assessment.confidence * 100)}%`,
    "", "Estimated costs",
    `Parts: ${money(assessment.estimatedCost.parts)}`,
    `Labor: ${money(assessment.estimatedCost.labor)}`,
    `Total: ${money(assessment.estimatedCost.total)}`,
    "", "Affected components",
    ...assessment.affectedComponents.map((value) => `• ${readableAssessmentValue(value)}`),
    "", "Description", readableAssessmentValue(assessment.description),
    "", "Recommendations",
    ...assessment.recommendations.map((value) => `• ${readableAssessmentValue(value)}`),
    ...(assessment.providerReceipt ? ["", `Provider: OpenRouter · ${assessment.providerReceipt.model}`, `Response: ${assessment.providerReceipt.responseId}`, `Generated: ${assessment.providerReceipt.generatedAt}`] : []),
    ...(assessment.providerReceipt?.submittedInputs ? ["", "Original submitted inputs", `Claim title: ${assessment.providerReceipt.submittedInputs.title}`, `Incident date: ${assessment.providerReceipt.submittedInputs.incidentDate}`, "Claim description:", assessment.providerReceipt.submittedInputs.description] : ["", "Original claim details were not retained for this older assessment."]),
    "", "Initial AI estimate. Coverage, approval, and final repair costs remain subject to the native claim review process.",
  ].join("\n");
}

export function assessmentContextChanged(assessment: DamageAssessment, claim: { title: string; description: string; incidentDate: string | Date }): boolean | null {
  const inputs = assessment.providerReceipt?.submittedInputs;
  if (!inputs) return null;
  const date = claim.incidentDate instanceof Date ? claim.incidentDate.toISOString().slice(0, 10) : String(claim.incidentDate).slice(0, 10);
  return inputs.title !== claim.title || inputs.description !== claim.description || inputs.incidentDate !== date;
}
