import React from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { DollarSign, AlertTriangle, BookCheck, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAppSettings } from '../hooks/useAppSettings';


const Dashboard: React.FC = () => {
    const { inventory, menuItems, recipes, getRecipeById, calculateRecipeCost } = useData();
    const { formatCurrency } = useCurrency();
    const { settings } = useAppSettings();

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

    const COLORS = ['#06b6d4', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {settings.dashboard.inventoryValue &&
                <Card className="col-span-1">
                    <div className="flex items-center">
                        <div className="p-3 bg-[var(--color-primary-light)] rounded-full">
                            <DollarSign className="text-[var(--color-primary)]" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-[var(--color-text-muted)]">Total Inventory Value</p>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalInventoryValue)}</p>
                        </div>
                    </div>
                </Card>
            }
            {settings.dashboard.lowStockItems &&
                <Card className="col-span-1">
                    <div className="flex items-center">
                        <div className="p-3 bg-red-500/10 rounded-full">
                            <AlertTriangle className="text-[var(--color-danger)]" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-[var(--color-text-muted)]">Low Stock Items</p>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{lowStockItems}</p>
                        </div>
                    </div>
                </Card>
            }
            {settings.dashboard.totalRecipes &&
                <Card className="col-span-1">
                    <div className="flex items-center">
                        <div className="p-3 bg-sky-500/10 rounded-full">
                            <BookCheck className="text-sky-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-[var(--color-text-muted)]">Total Recipes</p>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{recipes.length}</p>
                        </div>
                    </div>
                </Card>
            }
            {settings.dashboard.avgMenuProfit &&
                <Card className="col-span-1">
                    <div className="flex items-center">
                        <div className="p-3 bg-amber-500/10 rounded-full">
                            <PieChart className="text-amber-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-[var(--color-text-muted)]">Avg. Menu Profit</p>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalMenuProfitability / menuItems.length || 0)}</p>
                        </div>
                    </div>
                </Card>
            }
            <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Top 5 Most Profitable Menu Items</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={menuProfitabilityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--color-text-muted)' }} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          formatter={(value: number, name: string) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                          contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', color: 'var(--color-text-primary)', boxShadow: 'var(--shadow-md)' }}
                          labelStyle={{ color: 'var(--color-text-primary)', fontWeight: '600' }}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Legend wrapperStyle={{ color: 'var(--color-text-muted)' }} />
                        <Bar dataKey="profit" name="Profit" fill="var(--color-primary)">
                            {menuProfitabilityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                         <Bar dataKey="revenue" name="Revenue" fill="var(--color-border)" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default Dashboard;