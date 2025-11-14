

import React, { useMemo } from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const Reports: React.FC = () => {
    const { inventory, recipes, calculateRecipeCostBreakdown } = useData();
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

    const inventoryPieData = Object.keys(categoryCosts).map(key => ({
        name: key,
        value: parseFloat(categoryCosts[key].toFixed(2)),
    }));

    // Data for Most Expensive Recipes
    const recipeCostBarData = useMemo(() => recipes.map(recipe => {
        const { costPerServing } = calculateRecipeCostBreakdown(recipe);
        return {
            name: recipe.name,
            cost: parseFloat(costPerServing.toFixed(2)),
        };
    }).sort((a, b) => b.cost - a.cost).slice(0, 10), [recipes, calculateRecipeCostBreakdown]);
    
    // Data for Top Inventory Items by Value
    const topInventoryValueData = useMemo(() => inventory.map(item => ({
        name: item.name,
        value: item.quantity * item.unitCost,
    })).sort((a, b) => b.value - a.value).slice(0, 10), [inventory]);
    

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
            <Card>
                <h3 className="text-lg font-semibold mb-4">Inventory Value by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={inventoryPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                        >
                            {inventoryPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                <h3 className="text-lg font-semibold mb-4">Top 10 Most Expensive Recipes</h3>
                <ResponsiveContainer width="100%" height={300}>
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
            </Card>
             <Card className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Top 10 Inventory Items by Value</h3>
                <ResponsiveContainer width="100%" height={300}>
                     <BarChart data={topInventoryValueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--color-text-muted)' }} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
                        <Bar dataKey="value" name="Total Value">
                             {topInventoryValueData.map((entry, index) => (
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