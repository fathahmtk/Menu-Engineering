import { GoogleGenAI, Type } from "@google/genai";

export interface AI_RecipeSuggestion {
    recipeName: string;
    description: string;
    ingredients: string[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            recipeName: {
                type: Type.STRING,
                description: "A creative and appealing name for the recipe.",
            },
            description: {
                type: Type.STRING,
                description: "A short, enticing description of the dish, suitable for a menu.",
            },
            ingredients: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                },
                description: "A list of key ingredient names required for this recipe.",
            },
        },
        required: ["recipeName", "description", "ingredients"],
    },
};

export const generateRecipeSuggestions = async (
    availableIngredients: string[],
    cuisine: string,
    numSuggestions: number = 3
): Promise<AI_RecipeSuggestion[]> => {
    try {
        const prompt = `You are a creative executive chef specializing in menu development for a food production company. Your task is to generate innovative and profitable recipe ideas.

        Based on the following available ingredients:
        - ${availableIngredients.join('\n- ')}
        
        And the desired cuisine/theme: "${cuisine}"

        Please generate ${numSuggestions} unique recipe ideas. For each idea, provide a catchy name, a short, appealing description, and a list of the main ingredients needed. Ensure your response is in a valid JSON format.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
            },
        });

        const jsonText = response.text.trim();
        const suggestions = JSON.parse(jsonText) as AI_RecipeSuggestion[];
        return suggestions;

    } catch (error) {
        console.error("Error generating recipe suggestions:", error);
        throw new Error("Failed to generate AI recipe suggestions. Please try again.");
    }
};
