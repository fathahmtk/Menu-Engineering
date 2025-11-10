
import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from '../types';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Basic fuzzy matching
const findMatchingInventoryItem = (ingredientName: string, inventory: InventoryItem[]): string | null => {
  if (!ingredientName || inventory.length === 0) return null;
  
  const lowerIngredientName = ingredientName.toLowerCase();
  let bestMatch: { id: string; score: number } | null = null;

  for (const item of inventory) {
    const lowerItemName = item.name.toLowerCase();
    
    // Simple score: prioritize exact matches, then "contains"
    let score = 0;
    if (lowerItemName === lowerIngredientName) {
      score = 100;
    } else if (lowerItemName.includes(lowerIngredientName) || lowerIngredientName.includes(lowerItemName)) {
      score = 50;
    }
    
    if (score > (bestMatch?.score || 0)) {
      bestMatch = { id: item.id, score };
    }
  }

  return bestMatch ? bestMatch.id : null;
};

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING, description: 'A creative and descriptive name for the dish.' },
    category: { type: Type.STRING, description: 'A suitable category for the recipe (e.g., Main Course, Appetizer, Dessert).' },
    servings: { type: Type.INTEGER, description: 'The number of people this recipe serves.' },
    ingredients: {
      type: Type.ARRAY,
      description: 'A list of ingredients required for the recipe.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Name of the ingredient (e.g., "Chicken Breast", "Olive Oil").' },
          quantity: { type: Type.NUMBER, description: 'The numerical amount of the ingredient.' },
          unit: {
            type: Type.STRING,
            description: 'The unit of measurement. Must be one of: kg, g, L, ml, unit, dozen.',
            enum: ['kg', 'g', 'L', 'ml', 'unit', 'dozen'],
          },
        },
        required: ['name', 'quantity', 'unit'],
      },
    },
    instructions: {
      type: Type.ARRAY,
      description: 'Step-by-step instructions to prepare the dish.',
      items: { type: Type.STRING },
    },
  },
  required: ['recipeName', 'category', 'servings', 'ingredients', 'instructions'],
};

export interface GeneratedIngredient {
  name: string;
  quantity: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'unit' | 'dozen';
  itemId: string | null; // Matched inventory item ID
}

export interface GeneratedRecipe {
  name: string;
  category: string;
  servings: number;
  ingredients: GeneratedIngredient[];
  instructions: string[];
  unmatchedIngredients: string[];
}

export const generateRecipeFromPrompt = async (prompt: string, inventory: InventoryItem[]): Promise<GeneratedRecipe | null> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: recipeSchema,
            systemInstruction: "You are an expert chef's assistant. Your task is to generate a detailed, accurate, and delicious recipe based on the user's request. Ensure all quantities and units are sensible for the specified number of servings. The unit must be one of the allowed values."
        }
    });

    const parsedJson = JSON.parse(response.text);

    const unmatchedIngredients: string[] = [];
    const matchedIngredients: GeneratedIngredient[] = parsedJson.ingredients.map((ing: any) => {
      const matchedId = findMatchingInventoryItem(ing.name, inventory);
      if (!matchedId) {
        unmatchedIngredients.push(ing.name);
      }
      return {
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        itemId: matchedId,
      };
    });

    return {
      name: parsedJson.recipeName,
      category: parsedJson.category,
      servings: parsedJson.servings,
      ingredients: matchedIngredients,
      instructions: parsedJson.instructions,
      unmatchedIngredients,
    };

  } catch (error) {
    console.error("Error generating recipe with Gemini API:", error);
    return null;
  }
};
