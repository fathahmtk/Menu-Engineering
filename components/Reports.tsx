
import React, { useMemo } from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Label } from 'recharts';
import { Utensils, Sprout, Beef, Drumstick, ShoppingCart, Percent } from 'lucide-react';

const COLORS = ['#3b82f6', '#16a34a', '#f97316', '#ef4444', '#8b5cf6', '#db2777', '#64748b', '#f59e0b'];

const CustomTooltip = ({ active, payload, formatCurrency }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="ican-card p-3 text-sm">
                <p className="font-bold text-base">{data.name}</p>
                {data.value && <p style={{ color: payload[0].color }}>Cost: {formatCurrency(data.value)}</p>}
                {data.profitability !== undefined && <p className="text-green-600">Profit: {formatCurrency(data.profitability)}</p>}
                {data.popularity !== undefined && <p className="text-blue-600">Sales: {data.popularity} units</p>}
                {data.revenue !== undefined && <p>Revenue: {formatCurrency(data.revenue)}</p>}
            </div>
        );
    }
    return null;
};

const Reports: React.FC = () => {
    const { recipes, pricedItems, menuItems, getPricedItemById, getRecipeById, calculateRecipeCostBreakdown } = useData();
    const { formatCurrency, currency } = useCurrency();

    const costByCategory = useMemo(() => {
        const categoryCosts: { [key: string]: number } = {};
        recipes.forEach(recipe => {
            recipe.ingredients.forEach(ing => {
                if (ing.type === 'item') {
                    const pricedItem = getPricedItemById(ing.itemId);
                    if (pricedItem) {
                        const tempRecipeForCosting = { ...recipe, ingredients: [ing], servings: 1 };
                        const { rawMaterialCost } = calculateRecipeCostBreakdown(tempRecipeForCosting);
                        const category = pricedItem.category;
                        categoryCosts[category] = (categoryCosts[category] || 0) + rawMaterialCost;
                    }
                }
            });
        });
        return Object.entries(categoryCosts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [recipes, getPricedItemById, calculateRecipeCostBreakdown]);

    const menuPerformanceData = useMemo(() => {
      return menuItems.map(item => {
          const recipe = getRecipeById(item.recipeId);
          const { costPerServing } = calculateRecipeCostBreakdown(recipe);
          return {
              name: item.name,
              profitability: item.salePrice - costPerServing,
              popularity: item.salesCount,
              revenue: item.salePrice * item.salesCount,
          };
      });
    }, [menuItems, getRecipeById, calculateRecipeCostBreakdown]);
    
    const maxRevenue = Math.max(...menuPerformanceData.map(d => d.revenue), 1);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-4 flex items-center"><ShoppingCart size={20} className="mr-2 text-[var(--color-primary)]" />Cost by Ingredient Category</h3>
                {costByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={costByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                    return (
                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="bold">
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    );
                                }}
                            >
                                {costByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency}/>} />
                            <Legend iconSize={10} wrapperStyle={{fontSize: '12px', color: 'var(--color-text-muted)'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                     <div className="h-[400px] flex flex-col items-center justify-center text-center text-[var(--color-text-muted)]">
                        <Sprout size={48} className="mb-4 text-[var(--color-border)]"/>
                        <p className="font-semibold">No ingredient data available</p>
                        <p className="text-sm">Add recipes with ingredients to see cost breakdowns.</p>
                    </div>
                )}
            </Card>

            <Card className="lg:col-span-1">
                 <h3 className="text-xl font-bold mb-4 flex items-center"><Percent size={20} className="mr-2 text-[var(--color-primary)]" /> Menu Performance Matrix</h3>
                 {menuPerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <XAxis type="number" dataKey="popularity" name="Popularity (Sales Count)" unit=" units" stroke="var(--color-text-muted)" fontSize={12}>
                                <Label value="Popularity (Sales Count)" offset={-15} position="insideBottom" fill="var(--color-text-secondary)" />
                            </XAxis>
                            <YAxis type="number" dataKey="profitability" name="Profitability" unit={currency} stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(val) => formatCurrency(val)}>
                                 <Label value="Profitability" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'var(--color-text-secondary)' }} />
                            </YAxis>
                             <ZAxis type="number" dataKey="revenue" range={[400, 2000]} name="Revenue" unit={currency} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip formatCurrency={formatCurrency}/>} />
                            <Legend wrapperStyle={{fontSize: '12px', color: 'var(--color-text-muted)'}}/>
                            <Scatter name="Menu Items" data={menuPerformanceData} fill="var(--color-primary)" opacity={0.7}>
                                {menuPerformanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-center text-[var(--color-text-muted)]">
                        <Utensils size={48} className="mb-4 text-[var(--color-border)]"/>
                        <p className="font-semibold">No menu data available</p>
                        <p className="text-sm">Add items to your menu to see performance analysis.</p>
                    </div>
                 )}
            </Card>
        </div>
    );
};

export default Reports;
