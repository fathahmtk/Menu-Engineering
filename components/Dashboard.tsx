
import React from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { BookCheck, PieChart, Utensils, PlusCircle, Upload, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuthContext';
import { View } from '../App';


const WelcomeCard: React.FC<{ setCurrentView?: (view: View) => void }> = ({ setCurrentView }) => {
    const { user } = useAuth();

    const handleNavigation = (view: View) => {
        if (setCurrentView) {
            setCurrentView(view);
        }
    };

    return (
        <Card className="col-span-1 lg:col-span-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h2 className="text-2xl font-bold">Welcome back, {user?.email?.split('@')[0] || 'Admin'}!</h2>
                    <p className="text-white/80 mt-1">Here's your business performance overview.</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <button onClick={() => handleNavigation('recipes')} className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg text-sm inline-flex items-center transition-colors">
                        <PlusCircle size={16} className="mr-2"/>
                        Add Recipe
                    </button>
                     <button onClick={() => handleNavigation('pricelist')} className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg text-sm inline-flex items-center transition-colors">
                        <Upload size={16} className="mr-2"/>
                        Upload Pricelist
                    </button>
                </div>
            </div>
        </Card>
    );
};


const Dashboard: React.FC<{setCurrentView?: (view: View) => void}> = ({ setCurrentView }) => {
    const { menuItems, recipes, getRecipeById, calculateRecipeCostBreakdown } = useData();
    const { formatCurrency } = useCurrency();
    const { settings } = useAppSettings();

    const menuProfitabilityData = menuItems.map(item => {
        const recipe = getRecipeById(item.recipeId);
        const { costPerServing } = calculateRecipeCostBreakdown(recipe);
        const profit = item.salePrice - costPerServing;
        return {
            name: item.name,
            profit,
            revenue: item.salePrice,
            cost: costPerServing
        };
    }).sort((a,b) => b.profit - a.profit).slice(0, 5);

    const totalMenuProfitability = menuItems.reduce((acc, item) => {
        const recipe = getRecipeById(item.recipeId);
        const { costPerServing } = calculateRecipeCostBreakdown(recipe);
        return acc + (item.salePrice - costPerServing);
    }, 0);

    const COLORS = ['#06b6d4', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <WelcomeCard setCurrentView={setCurrentView} />
            
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
             <Card className="col-span-1">
                <div className="flex items-center">
                    <div className="p-3 bg-green-500/10 rounded-full">
                        <Utensils className="text-green-400" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-[var(--color-text-muted)]">Menu Items</p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{menuItems.length}</p>
                    </div>
                </div>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
                <h3 className="text-xl font-bold mb-4 text-[var(--color-text-primary)]">Top 5 Most Profitable Menu Items</h3>
                {menuProfitabilityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={menuProfitabilityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--color-text-muted)' }} tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip
                              formatter={(value: number, name: string) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', color: 'var(--color-text-primary)', boxShadow: 'var(--shadow-md)' }}
                              labelStyle={{ color: 'var(--color-text-primary)', fontWeight: '600' }}
                              cursor={{ fill: 'rgba(127, 127, 127, 0.1)' }}
                            />
                            <Legend wrapperStyle={{ color: 'var(--color-text-muted)' }} />
                            <Bar dataKey="profit" name="Profit" stackId="a" fill="var(--color-primary)">
                                {menuProfitabilityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                             <Bar dataKey="cost" name="Cost" stackId="a" fill="var(--color-border)" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[350px] flex flex-col items-center justify-center text-center text-[var(--color-text-muted)]">
                        <Utensils size={48} className="mb-4 text-[var(--color-border)]"/>
                        <p className="font-semibold">No menu data available</p>
                        <p className="text-sm">Add menu items to see profitability insights.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Dashboard;
