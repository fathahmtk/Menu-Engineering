import React from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const Reports: React.FC = () => {
    const { inventory, menuItems, getRecipeById, calculateRecipeCost } = useData();
    const { formatCurrency } = useCurrency();

    // Data for Inventory Cost by Category
    const categoryCosts = inventory.reduce((acc, item) => {
        const value = item.quantity * item.unitCost;
        if (!acc[item.category]) {
            acc[item.category] = 0;
        }
        acc[item.category] += value;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(categoryCosts).map(key => ({
        name: key,
        value: parseFloat(categoryCosts[key].toFixed(2)),
    }));

    // Data for Menu Item Profitability
    const barData = menuItems.map(item => {
        const recipe = getRecipeById(item.recipeId);
        const totalCost = calculateRecipeCost(recipe);
        const costPerServing = (recipe && recipe.servings > 0) ? totalCost / recipe.servings : 0;
        const profit = item.salePrice - costPerServing;
        return {
            name: item.name,
            profit: parseFloat(profit.toFixed(2)),
        };
    }).sort((a, b) => b.profit - a.profit);
    

    const COLORS = ['#2dd4bf', '#64748b', '#94a3b8', '#cbd5e1', '#475569', '#38bdf8', '#fbbf24'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <h3 className="text-lg font-semibold mb-4">Inventory Value by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                            labelStyle={{ fill: 'hsl(210 40% 98%)', fontSize: 12 }}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ backgroundColor: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 17%)', borderRadius: '0.5rem' }}
                            labelStyle={{ color: 'hsl(210 40% 98%)' }}
                        />
                        <Legend wrapperStyle={{ color: 'hsl(215 20% 65%)', fontSize: '14px' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                <h3 className="text-lg font-semibold mb-4">Menu Item Profitability</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" tick={{ fill: 'hsl(215 20% 65%)' }} tickFormatter={(value) => formatCurrency(value)} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}/>
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ backgroundColor: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 17%)', borderRadius: '0.5rem' }}
                            labelStyle={{ color: 'hsl(210 40% 98%)' }}
                            cursor={{ fill: 'hsl(217 33% 17%)' }}
                        />
                        <Legend wrapperStyle={{ color: 'hsl(215 20% 65%)' }} />
                        <Bar dataKey="profit" name="Profit per Serving">
                             {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default Reports;