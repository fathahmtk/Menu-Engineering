

import React, { useMemo } from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { BookOpen } from 'lucide-react';

const Reports: React.FC = () => {
    const { recipes, calculateRecipeCostBreakdown } = useData();
    const { formatCurrency } = useCurrency();

    // Data for Most Expensive Recipes
    const recipeCostBarData = useMemo(() => recipes.map(recipe => {
        const { costPerServing } = calculateRecipeCostBreakdown(recipe);
        return {
            name: recipe.name,
            cost: parseFloat(costPerServing.toFixed(2)),
        };
    }).sort((a, b) => b.cost - a.cost).slice(0, 10), [recipes, calculateRecipeCostBreakdown]);
    
    const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#db2777', '#64748b'];

    const ChartTooltip = (props: any) => {
        const { active, payload, label } = props;
        if (active && payload && payload.length) {
            return (
                <div className="ican-card p-3 text-sm">
                    <p className="font-bold text-base">{label}</p>
                    {payload.map((pld: any) => (
                        <p key={pld.dataKey} style={{ color: pld.color }}>
                            {pld.name}: {formatCurrency(pld.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">Top 10 Most Expensive Recipes</h3>
                {recipeCostBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={recipeCostBarData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}/>
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
                            <Bar dataKey="cost" name="Cost per Serving" fill="var(--color-primary)">
                                {recipeCostBarData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-center text-[var(--color-text-muted)]">
                        <BookOpen size={48} className="mb-4 text-[var(--color-border)]"/>
                        <p className="font-semibold">No recipe data available</p>
                        <p className="text-sm">Create recipes to see cost analysis reports.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Reports;