import OpenAI from "openai";

// OpenRouter is optional at startup. Resolve it only for an explicitly invoked
// legacy AI operation so health, authentication, and authoritative workflows
// remain available without silently fabricating provider output.
function openAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is required for this AI operation");
  return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
}

export interface DamageAssessment {
  damageType: string;
  severity: "minor" | "moderate" | "major" | "total";
  affectedComponents: string[];
  repairComplexity: "simple" | "moderate" | "complex";
  estimatedCost: {
    parts: number;
    labor: number;
    total: number;
  };
  confidence: number;
  description: string;
  recommendations: string[];
}

export async function analyzeDamageImages(base64Images: string[]): Promise<DamageAssessment> {
  try {
    const messages: any[] = [
      {
        role: "system",
        content: `You are an expert insurance damage assessor. Analyze the provided images and provide a detailed damage assessment. 
        
        Respond with JSON in this exact format:
        {
          "damageType": "string describing the type of damage",
          "severity": "minor" | "moderate" | "major" | "total",
          "affectedComponents": ["array", "of", "damaged", "components"],
          "repairComplexity": "simple" | "moderate" | "complex",
          "estimatedCost": {
            "parts": number,
            "labor": number,
            "total": number
          },
          "confidence": number between 0 and 1,
          "description": "detailed description of the damage",
          "recommendations": ["array", "of", "repair", "recommendations"]
        }
        
        Base your cost estimates on current market rates. Be thorough but conservative in your estimates.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze these damage images and provide a comprehensive assessment for insurance purposes."
          },
          ...base64Images.map(image => ({
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${image}`
            }
          }))
        ]
      }
    ];

    const response = await openAIClient().chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and sanitize the response
    return {
      damageType: result.damageType || "Unknown damage",
      severity: ["minor", "moderate", "major", "total"].includes(result.severity) 
        ? result.severity 
        : "moderate",
      affectedComponents: Array.isArray(result.affectedComponents) 
        ? result.affectedComponents 
        : ["Unknown components"],
      repairComplexity: ["simple", "moderate", "complex"].includes(result.repairComplexity)
        ? result.repairComplexity
        : "moderate",
      estimatedCost: {
        parts: Math.max(0, Number(result.estimatedCost?.parts) || 0),
        labor: Math.max(0, Number(result.estimatedCost?.labor) || 0),
        total: Math.max(0, Number(result.estimatedCost?.total) || 0),
      },
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.5)),
      description: result.description || "Unable to analyze damage",
      recommendations: Array.isArray(result.recommendations) 
        ? result.recommendations 
        : ["Seek professional assessment"],
    };
  } catch (error) {
    console.error("Error analyzing damage images:", error);
    throw new Error("Failed to analyze damage images: " + (error as Error).message);
  }
}

export async function generateClaimSummary(claim: any): Promise<string> {
  try {
    const response = await openAIClient().chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are an insurance claim summarizer. Create a concise, professional summary of the claim details."
        },
        {
          role: "user",
          content: `Please create a summary for this insurance claim:
          Title: ${claim.title}
          Description: ${claim.description}
          Estimated Amount: $${claim.estimatedAmount}
          Status: ${claim.status}
          
          Make it suitable for member communication.`
        }
      ],
      max_tokens: 200,
    });

    return response.choices[0].message.content || "Claim summary unavailable";
  } catch (error) {
    console.error("Error generating claim summary:", error);
    return "Unable to generate claim summary";
  }
}

export async function claimsChatbot(question: string, context?: any): Promise<string> {
  try {
    const response = await openAIClient().chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are a helpful insurance claims assistant for a nonprofit insurance platform. Answer general questions about claim status, the claims process, required documents, and timelines. Always note that you cannot access the live claims database in this conversation, and direct the user to file a ticket for case-specific status. Be concise and friendly."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nOptional context (may include policy/claim metadata):\n${JSON.stringify(context || {}, null, 2)}`
        }
      ],
      max_tokens: 500,
    });
    return response.choices[0].message.content || "Unable to answer right now.";
  } catch (error) {
    console.error("Claims chatbot error:", error);
    throw new Error("Failed to answer claims question: " + (error as Error).message);
  }
}

export async function assessRisk(intake: any): Promise<any> {
  try {
    const response = await openAIClient().chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are an insurance risk analyst for a nonprofit insurance program. Score the applicant's risk and propose a premium band. Return strict JSON: { riskScore (0-100), riskLevel (low/medium/high), drivers, suggestedPremiumBand, recommendedCoverages, notes }. Output ONLY valid JSON."
        },
        {
          role: "user",
          content: `Risk intake:\n${JSON.stringify(intake, null, 2)}`
        }
      ],
      max_tokens: 800,
    });
    const text = response.choices[0].message.content || "{}";
    try { return JSON.parse(text); } catch { return { rawAnalysis: text }; }
  } catch (error) {
    console.error("Risk assessor error:", error);
    throw new Error("Failed to assess risk: " + (error as Error).message);
  }
}

export async function recommendCoverage(profile: any, available: any[]): Promise<any> {
  try {
    const response = await openAIClient().chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are an insurance coverage advisor. Given a nonprofit organization's profile and available coverage products, recommend the best mix and explain the reasoning. Return strict JSON: { recommendedCoverages: [{ id, name, reason, priority }], gaps, costEstimateBand, notes }. Output ONLY valid JSON."
        },
        {
          role: "user",
          content: `Profile:\n${JSON.stringify(profile, null, 2)}\n\nAvailable Coverages:\n${JSON.stringify(available, null, 2)}`
        }
      ],
      max_tokens: 900,
    });
    const text = response.choices[0].message.content || "{}";
    try { return JSON.parse(text); } catch { return { rawAnalysis: text }; }
  } catch (error) {
    console.error("Coverage recommender error:", error);
    throw new Error("Failed to recommend coverage: " + (error as Error).message);
  }
}
