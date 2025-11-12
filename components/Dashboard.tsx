import React from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { DollarSign, AlertTriangle, BookCheck, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
    const { inventory, menuItems, recipes, getRecipeById, calculateRecipeCost } = useData();
    const { formatCurrency } = useCurrency();

    const totalInventoryValue = inventory.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.lowStockThreshold).length;

    const menuProfitabilityData = menuItems.map(item => {
        const recipe = getRecipeById(item.recipeId);
        if (!recipe) return { name: item.name, profit: 0, revenue: 0, cost: 0 };
        const recipeCost = calculateRecipeCost(recipe);
        const cost = recipe.servings > 0 ? recipeCost / recipe.servings : 0;
        const profit = item.salePrice - cost;
        return {
            name: item.name,
            profit,
            revenue: item.salePrice,
            cost: cost
        };
    }).sort((a,b) => b.profit - a.profit).slice(0, 5);

    const totalMenuProfitability = menuItems.reduce((acc, item) => {
        const recipe = getRecipeById(item.recipeId);
        if (!recipe) return acc;
        const costPerServing = recipe.servings > 0 ? calculateRecipeCost(recipe) / recipe.servings : 0;
        return acc + (item.salePrice - costPerServing);
    }, 0);

    const COLORS = ['#2dd4bf', '#64748b', '#94a3b8', '#cbd5e1', '#475569'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="col-span-1">
                <div className="flex items-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <DollarSign className="text-primary" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalInventoryValue)}</p>
                    </div>
                </div>
            </Card>
            <Card className="col-span-1">
                <div className="flex items-center">
                    <div className="p-3 bg-destructive/10 rounded-full">
                        <AlertTriangle className="text-destructive" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-muted-foreground">Low Stock Items</p>
                        <p className="text-2xl font-bold text-foreground">{lowStockItems}</p>
                    </div>
                </div>
            </Card>
            <Card className="col-span-1">
                <div className="flex items-center">
                    <div className="p-3 bg-sky-500/10 rounded-full">
                        <BookCheck className="text-sky-400" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-muted-foreground">Total Recipes</p>
                        <p className="text-2xl font-bold text-foreground">{recipes.length}</p>
                    </div>
                </div>
            </Card>
            <Card className="col-span-1">
                 <div className="flex items-center">
                    <div className="p-3 bg-amber-500/10 rounded-full">
                        <PieChart className="text-amber-400" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-muted-foreground">Avg. Menu Profit</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalMenuProfitability / menuItems.length || 0)}</p>
                    </div>
                </div>
            </Card>

            <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Top 5 Most Profitable Menu Items</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={menuProfitabilityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(215 20% 65%)' }} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: 'hsl(222 47% 14%)', border: '1px solid hsl(217 33% 17%)', borderRadius: '0.5rem' }}
                          labelStyle={{ color: 'hsl(210 40% 98%)' }}
                          cursor={{ fill: 'hsl(217 33% 17%)' }}
                        />
                        <Legend wrapperStyle={{ color: 'hsl(215 20% 65%)' }} />
                        <Bar dataKey="profit" name="Profit" fill="hsl(164 92% 54%)">
                            {menuProfitabilityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                         <Bar dataKey="revenue" name="Revenue" fill="hsl(215 28% 30%)" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default Dashboard;