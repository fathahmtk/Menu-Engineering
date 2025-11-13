import { Recipe, Business } from '../types';

interface IngredientDetail {
    name: string;
    quantity: number;
    unit: string;
    cost: number;
}

interface CostingSheetData {
    recipe: Recipe;
    ingredientsWithDetails: IngredientDetail[];
    business: Business | undefined;
    formatCurrency: (value: number) => string;
    calculateRecipeCost: (recipe: Recipe) => number;
}

const escapeHTML = (str: string | number) => {
    const s = String(str);
    return s.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

export const generateCostingSheetSVG = ({
    recipe,
    ingredientsWithDetails,
    business,
    formatCurrency,
    calculateRecipeCost
}: CostingSheetData): string => {
    const totalCost = calculateRecipeCost(recipe);
    const costPerServing = recipe.servings > 0 ? totalCost / recipe.servings : 0;
    const suggestedPrice = costPerServing > 0 ? costPerServing / 0.3 : 0; // 30% food cost

    const logoSvg = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

    const ingredientRows = ingredientsWithDetails.map(ing => `
        <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 8px 12px; text-align: left;">${escapeHTML(ing.name)}</td>
            <td style="padding: 8px 12px; text-align: left;">${ing.quantity}</td>
            <td style="padding: 8px 12px; text-align: left;">${escapeHTML(ing.unit)}</td>
            <td style="padding: 8px 12px; text-align: right;">${formatCurrency(ing.cost)}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Poppins', sans-serif; color: #F9FAFB; padding: 40px; width: 720px; display: flex; flex-direction: column; height: 100%;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F97316; padding-bottom: 20px;">
                <div style="display: flex; align-items: center;">
                    ${logoSvg}
                    <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 0 12px;">iCAN Costing Sheet</h1>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 16px; font-weight: 600;">${escapeHTML(business?.name || '')}</p>
                    <p style="margin: 0; font-size: 12px; color: #9CA3AF;">${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
                <h2 style="font-size: 32px; font-weight: 700; margin: 0; color: #F97316;">${escapeHTML(recipe.name)}</h2>
                <p style="font-size: 16px; color: #9CA3AF; margin: 4px 0 0 0;">Category: ${escapeHTML(recipe.category)}</p>
            </div>
            
            <div style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div style="background-color: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
                    <p style="font-size: 14px; color: #9CA3AF; margin: 0 0 4px 0;">Total Recipe Cost</p>
                    <p style="font-size: 24px; font-weight: 700; color: #F97316; margin: 0;">${formatCurrency(totalCost)}</p>
                </div>
                <div style="background-color: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
                    <p style="font-size: 14px; color: #9CA3AF; margin: 0 0 4px 0;">Servings</p>
                    <p style="font-size: 24px; font-weight: 700; margin: 0;">${recipe.servings}</p>
                </div>
                 <div style="background-color: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
                    <p style="font-size: 14px; color: #9CA3AF; margin: 0 0 4px 0;">Cost per Serving</p>
                    <p style="font-size: 24px; font-weight: 700; margin: 0;">${formatCurrency(costPerServing)}</p>
                </div>
            </div>
             <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                 <div style="background-color: rgba(249, 115, 22, 0.1); padding: 16px; border-radius: 8px; border: 1px solid #F97316; text-align: center;">
                    <p style="font-size: 14px; color: #9CA3AF; margin: 0 0 4px 0;">Suggested Sale Price (30% Cost)</p>
                    <p style="font-size: 24px; font-weight: 700; color: #F97316; margin: 0;">${formatCurrency(suggestedPrice)}</p>
                </div>
                 <div style="background-color: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
                    <p style="font-size: 14px; color: #9CA3AF; margin: 0 0 4px 0;">Target Sale Price</p>
                    <p style="font-size: 24px; font-weight: 700; margin: 0;">${formatCurrency(recipe.targetSalePricePerServing || 0)}</p>
                </div>
            </div>

            <div style="margin-top: 30px;">
                <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">Ingredient Breakdown</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #374151;">
                            <th style="padding: 10px 12px; text-align: left; font-weight: 600; border-top-left-radius: 6px;">Ingredient</th>
                            <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Quantity</th>
                            <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Unit</th>
                            <th style="padding: 10px 12px; text-align: right; font-weight: 600; border-top-right-radius: 6px;">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ingredientRows}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #374151; text-align: center; font-size: 12px; color: #6B7280;">
                <p>Generated by iCAN F&B Intelligence Platform &copy; ${new Date().getFullYear()}</p>
            </div>
        </div>
    `;

    const svgString = `
        <svg width="800" height="1100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1F2937"/>
            <foreignObject width="100%" height="100%">
                ${htmlContent}
            </foreignObject>
        </svg>
    `;
    
    // Using btoa() for Base64 encoding
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
};
