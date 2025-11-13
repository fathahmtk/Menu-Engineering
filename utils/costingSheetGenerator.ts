import { Recipe, Business, IngredientType } from '../types';

interface IngredientDetail {
    name: string;
    quantity: number;
    unit: string;
    cost: number;
    percentage: number;
    trimYield: number;
    prepYield: number;
    type: IngredientType;
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
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

    const ingredientRows = ingredientsWithDetails.map(ing => `
        <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 12px; text-align: left;">${escapeHTML(ing.name)}</td>
            <td style="padding: 8px 12px; text-align: left;">${ing.quantity} ${escapeHTML(ing.unit)}</td>
            <td style="padding: 8px 12px; text-align: right;">${ing.type === 'item' ? `${ing.trimYield}%` : 'N/A'}</td>
            <td style="padding: 8px 12px; text-align: right;">${ing.prepYield}%</td>
            <td style="padding: 8px 12px; text-align: right;">${formatCurrency(ing.cost)}</td>
            <td style="padding: 8px 12px; text-align: right;">${ing.percentage.toFixed(1)}%</td>
        </tr>
    `).join('');

    const htmlContent = `
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Poppins', sans-serif; color: #e2e8f0; padding: 40px; width: 720px; display: flex; flex-direction: column; height: 100%;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #06b6d4; padding-bottom: 20px;">
                <div style="display: flex; align-items: center;">
                    ${logoSvg}
                    <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 0 12px;">iCAN Costing Sheet</h1>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 16px; font-weight: 600;">${escapeHTML(business?.name || '')}</p>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
                <h2 style="font-size: 32px; font-weight: 700; margin: 0; color: #06b6d4;">${escapeHTML(recipe.name)}</h2>
                <p style="font-size: 16px; color: #94a3b8; margin: 4px 0 0 0;">Category: ${escapeHTML(recipe.category)}</p>
            </div>
            
            <div style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                    <p style="font-size: 14px; color: #94a3b8; margin: 0 0 4px 0;">Total Recipe Cost</p>
                    <p style="font-size: 24px; font-weight: 700; color: #06b6d4; margin: 0;">${formatCurrency(totalCost)}</p>
                </div>
                <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                    <p style="font-size: 14px; color: #94a3b8; margin: 0 0 4px 0;">Servings</p>
                    <p style="font-size: 24px; font-weight: 700; margin: 0;">${recipe.servings}</p>
                </div>
                 <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                    <p style="font-size: 14px; color: #94a3b8; margin: 0 0 4px 0;">Cost per Serving</p>
                    <p style="font-size: 24px; font-weight: 700; margin: 0;">${formatCurrency(costPerServing)}</p>
                </div>
            </div>
             <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                 <div style="background-color: rgba(6, 182, 212, 0.1); padding: 16px; border-radius: 8px; border: 1px solid #06b6d4; text-align: center;">
                    <p style="font-size: 14px; color: #94a3b8; margin: 0 0 4px 0;">Suggested Sale Price (30% Cost)</p>
                    <p style="font-size: 24px; font-weight: 700; color: #06b6d4; margin: 0;">${formatCurrency(suggestedPrice)}</p>
                </div>
                 <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                    <p style="font-size: 14px; color: #94a3b8; margin: 0 0 4px 0;">Target Sale Price</p>
                    <p style="font-size: 24px; font-weight: 700; margin: 0;">${formatCurrency(recipe.targetSalePricePerServing || 0)}</p>
                </div>
            </div>

            <div style="margin-top: 30px;">
                <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">Ingredient Breakdown</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #334155;">
                            <th style="padding: 10px 12px; text-align: left; font-weight: 600; border-top-left-radius: 6px;">Ingredient</th>
                            <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Quantity</th>
                            <th style="padding: 10px 12px; text-align: right; font-weight: 600;">Trim Yield %</th>
                            <th style="padding: 10px 12px; text-align: right; font-weight: 600;">Prep Yield %</th>
                            <th style="padding: 10px 12px; text-align: right; font-weight: 600;">True Cost</th>
                            <th style="padding: 10px 12px; text-align: right; font-weight: 600; border-top-right-radius: 6px;">Cost %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ingredientRows}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #64748b;">
                <p>Generated by iCAN F&B Intelligence Platform &copy; ${new Date().getFullYear()}</p>
            </div>
        </div>
    `;

    const svgString = `
        <svg width="800" height="1100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1e293b"/>
            <foreignObject width="100%" height="100%">
                ${htmlContent}
            </foreignObject>
        </svg>
    `;
    
    // Using btoa() for Base64 encoding
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
};