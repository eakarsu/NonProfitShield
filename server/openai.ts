import OpenAI from "openai";

// Using OpenRouter API for AI model access
const openai = new OpenAI({ 
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

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

    const response = await openai.chat.completions.create({
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
    const response = await openai.chat.completions.create({
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
