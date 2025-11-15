// The top-level import is removed to prevent module-level errors.
// The SDK will be imported dynamically when it's first needed.
// import { GoogleGenAI } from "@google/genai";

// Use 'any' type because a top-level type-only import is disallowed by the guidelines.
let ai: any = null;
let initializationError: string | null = null;

// The client is now initialized asynchronously when first needed.
async function getAiClient() {
    // If we've already tried and failed, don't try again.
    if (initializationError) {
        return { ai: null, error: initializationError };
    }
    // If we've already succeeded, return the instance.
    if (ai) {
        return { ai, error: null };
    }

    try {
        // Dynamically import the library. This is the key change to prevent module load errors.
        const { GoogleGenAI } = await import('@google/genai');
        const apiKey = process.env.API_KEY;

        if (apiKey) {
            ai = new GoogleGenAI({ apiKey });
            return { ai, error: null };
        } else {
            initializationError = "API_KEY environment variable not found. AI features will be disabled.";
            console.warn(initializationError);
            return { ai: null, error: initializationError };
        }
    } catch (error) {
        initializationError = "Failed to initialize GoogleGenAI. This could be a network issue or an invalid SDK import. AI features will be disabled.";
        console.error(initializationError, error);
        ai = null;
        return { ai: null, error: initializationError };
    }
}


const SYSTEM_INSTRUCTION = `You are a professional Food & Beverage (F&B) business analyst and consultant. Your role is to analyze the provided business data and answer questions in a clear, concise, and insightful way.
- Always use the provided business data context for your answers. Do not invent information.
- If a question cannot be answered with the given data, state that clearly.
- Format your answers for readability using markdown (e.g., lists, bold text).
- Provide actionable insights where possible. For example, if asked about the most expensive ingredient, also mention which recipes it's used in.
- Keep your tone professional, helpful, and data-driven.
- All currency values should be formatted with the business's currency symbol or code.
`;

export async function generateEnhancedContext(prompt: string, businessDataSummary: string): Promise<string> {
  // Await the client initialization.
  const { ai, error } = await getAiClient();

  if (!ai) {
    return `Error: AI Service is not available. ${error || 'Please ensure the API_KEY is configured correctly.'}`;
  }
  
  try {
    const fullPrompt = `
      **Business Data Context:**
      ${businessDataSummary}

      ---

      **User's Question:**
      ${prompt}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Sorry, I encountered an error trying to process your request. This might be due to a configuration issue or a network problem. Please check the developer console for more details.";
  }
}