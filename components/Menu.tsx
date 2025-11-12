import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Edit, Trash2, Star, Puzzle, ThumbsDown, Grip, Save, XCircle } from 'lucide-react';
import { MenuItem } from '../types';

type Classification = 'Star' | 'Plowhorse' | 'Puzzle' | 'Dog';

const ClassificationBadge: React.FC<{ classification: Classification }> = ({ classification }) => {
    const config = {
        Star: { icon: <Star size={14} />, color: 'emerald', label: 'Star' },
        Plowhorse: { icon: <Grip size={14} />, color: 'sky', label: 'Plowhorse' },
        Puzzle: { icon: <Puzzle size={14} />, color: 'amber', label: 'Puzzle' },
        Dog: { icon: <ThumbsDown size={14} />, color: 'rose', label: 'Dog' },
    };
    const { icon, color, label } = config[classification];
    const colors = {
        emerald: 'bg-emerald-100 text-emerald-800',
        sky: 'bg-sky-100 text-sky-800',
        amber: 'bg-amber-100 text-amber-800',
        rose: 'bg-rose-100 text-rose-800',
    }

    return (
        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${colors[color]}`}>
            {icon}
            <span className="ml-1">{label}</span>
        </span>
    );
};


const Menu: React.FC = () => {
    const { menuItems, recipes, addMenuItem, updateMenuItem, deleteMenuItem, calculateRecipeCost } = useData();
    const { formatCurrency } = useCurrency();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<Omit<MenuItem, 'id' | 'businessId'>>({ name: '', recipeId: '', salePrice: 0, salesCount: 0 });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedSales, setEditedSales] = useState<number>(0);

    useEffect(() => {
        const initialRecipeId = recipes.length > 0 ? recipes[0].id : '';
        if (currentItem) {
            setFormData({
                name: currentItem.name,
                recipeId: currentItem.recipeId,
                salePrice: currentItem.salePrice,
                salesCount: currentItem.salesCount,
            });
        } else {
            setFormData({ name: '', recipeId: initialRecipeId, salePrice: 0, salesCount: 0 });
        }
    }, [currentItem, recipes]);

    const menuPerformance = useMemo(() => {
        return menuItems.map(item => {
            const recipe = recipes.find(r => r.id === item.recipeId);
            if (!recipe) return { ...item, costPerServing: 0, profit: 0, foodCostPercentage: 0 };

            const totalCost = calculateRecipeCost(recipe);
            const costPerServing = recipe.servings > 0 ? totalCost / recipe.servings : 0;
            const profit = item.salePrice - costPerServing;
            const foodCostPercentage = item.salePrice > 0 ? (costPerServing / item.salePrice) * 100 : 0;
            return { ...item, costPerServing, profit, foodCostPercentage };
        });
    }, [menuItems, recipes, calculateRecipeCost]);

    const { averageProfit, averageSales } = useMemo(() => {
        if (menuPerformance.length === 0) return { averageProfit: 0, averageSales: 0 };
        const totalProfit = menuPerformance.reduce((sum, item) => sum + item.profit, 0);
        const totalSales = menuPerformance.reduce((sum, item) => sum + item.salesCount, 0);
        return {
            averageProfit: totalProfit / menuPerformance.length,
            averageSales: totalSales / menuPerformance.length,
        };
    }, [menuPerformance]);

    const getClassification = (itemProfit: number, itemSales: number): Classification => {
        const isProfitable = itemProfit >= averageProfit;
        const isPopular = itemSales >= averageSales;

        if (isProfitable && isPopular) return 'Star';
        if (!isProfitable && isPopular) return 'Plowhorse';
        if (isProfitable && !isPopular) return 'Puzzle';
        return 'Dog';
    };


    const handleOpenModal = (item: MenuItem | null = null) => {
        setCurrentItem(item);
        setIsModalOpen(true);
        setErrors({});
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['salePrice', 'salesCount'].includes(name);
        setFormData({ ...formData, [name]: isNumberField ? parseFloat(value) : value });
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = 'Menu item name is required.';
        if (!formData.recipeId) newErrors.recipeId = 'Please select a recipe.';
        if (formData.salePrice <= 0) newErrors.salePrice = 'Sale price must be a positive number.';
        if (formData.salesCount < 0) newErrors.salesCount = 'Sales count cannot be negative.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        if (currentItem) {
            updateMenuItem({ ...formData, id: currentItem.id, businessId: currentItem.businessId });
        } else {
            addMenuItem(formData);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to remove this item from the menu?')) {
            deleteMenuItem(id);
        }
    };
    
    const handleEditSales = (item: MenuItem) => {
        setEditingItemId(item.id);
        setEditedSales(item.salesCount);
    };

    const handleCancelSalesEdit = () => {
        setEditingItemId(null);
    };

    const handleSaveSales = (itemId: string) => {
        if (editedSales < 0) {
            alert("Sales count cannot be negative.");
            return;
        }
        const itemToUpdate = menuItems.find(i => i.id === itemId);
        if (itemToUpdate) {
            updateMenuItem({ ...itemToUpdate, salesCount: editedSales });
        }
        setEditingItemId(null);
    };


    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Menu Engineering</h2>
                    <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <PlusCircle size={20} className="mr-2" />
                        Add Menu Item
                    </button>
                </div>
                <table className="w-full text-left responsive-table">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Menu Item</th>
                            <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Classification</th>
                            <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Sales Count</th>
                            <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Sale Price</th>
                            <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Cost</th>
                            <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Profit</th>
                            <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Food Cost %</th>
                            <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menuPerformance.map(item => {
                            const classification = getClassification(item.profit, item.salesCount);
                            const isEditing = editingItemId === item.id;
                            return (
                                <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-accent group">
                                    <td data-label="Menu Item" className="p-4 font-medium whitespace-nowrap">{item.name}</td>
                                    <td data-label="Classification" className="p-4"><ClassificationBadge classification={classification} /></td>
                                    <td data-label="Sales Count" className="p-4">
                                        {isEditing ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={editedSales}
                                                    onChange={(e) => setEditedSales(parseInt(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 sm:text-sm"
                                                    autoFocus
                                                    min="0"
                                                />
                                                <button onClick={() => handleSaveSales(item.id)} className="text-green-600 hover:text-green-800"><Save size={18} /></button>
                                                <button onClick={handleCancelSalesEdit} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
                                            </div>
                                        ) : (
                                             <div className="flex items-center space-x-2 text-muted-foreground">
                                                <span>{item.salesCount}</span>
                                                <button onClick={() => handleEditSales(item)} className="text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100" aria-label="Edit sales count">
                                                    <Edit size={16} />
                                                </button>
                                             </div>
                                        )}
                                    </td>
                                    <td data-label="Sale Price" className="p-4 text-foreground font-semibold whitespace-nowrap">{formatCurrency(item.salePrice)}</td>
                                    <td data-label="Cost" className="p-4 text-muted-foreground whitespace-nowrap">{formatCurrency(item.costPerServing)}</td>
                                    <td data-label="Profit" className="p-4">
                                        <span className={`font-bold ${item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(item.profit)}
                                        </span>
                                    </td>
                                    <td data-label="Food Cost %" className="p-4 text-muted-foreground whitespace-nowrap">{item.foodCostPercentage.toFixed(1)}%</td>
                                    <td data-label="Actions" className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => handleOpenModal(item)} className="text-primary hover:text-primary/80"><Edit size={20} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive/80"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>

             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem ? 'Edit Menu Item' : 'Add New Menu Item'}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground">Menu Item Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm ${errors.name ? 'border-destructive' : 'border-input'}`} />
                        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                        <label htmlFor="recipeId" className="block text-sm font-medium text-foreground">Recipe</label>
                        <select name="recipeId" id="recipeId" value={formData.recipeId} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm ${errors.recipeId ? 'border-destructive' : 'border-input'}`}>
                            <option value="" disabled>Select a recipe</option>
                            {recipes.map(rec => <option key={rec.id} value={rec.id}>{rec.name}</option>)}
                        </select>
                        {errors.recipeId && <p className="text-destructive text-xs mt-1">{errors.recipeId}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="salePrice" className="block text-sm font-medium text-foreground">Sale Price</label>
                            <input type="number" name="salePrice" id="salePrice" value={formData.salePrice} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm ${errors.salePrice ? 'border-destructive' : 'border-input'}`} min="0" step="0.01" />
                            {errors.salePrice && <p className="text-destructive text-xs mt-1">{errors.salePrice}</p>}
                        </div>
                         <div>
                            <label htmlFor="salesCount" className="block text-sm font-medium text-foreground">Sales Count</label>
                            <input type="number" name="salesCount" id="salesCount" value={formData.salesCount} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm ${errors.salesCount ? 'border-destructive' : 'border-input'}`} min="0" />
                            {errors.salesCount && <p className="text-destructive text-xs mt-1">{errors.salesCount}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCloseModal} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save Item</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Menu;