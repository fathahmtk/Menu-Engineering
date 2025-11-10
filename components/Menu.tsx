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
        Star: { icon: <Star size={14} />, color: 'green', label: 'Star' },
        Plowhorse: { icon: <Grip size={14} />, color: 'blue', label: 'Plowhorse' },
        Puzzle: { icon: <Puzzle size={14} />, color: 'orange', label: 'Puzzle' },
        Dog: { icon: <ThumbsDown size={14} />, color: 'red', label: 'Dog' },
    };
    const { icon, color, label } = config[classification];
    const colors = {
        green: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-700',
        orange: 'bg-orange-100 text-orange-700',
        red: 'bg-red-100 text-red-700',
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
    // FIX: Change type to MenuItem | null for clarity.
    const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
    // FIX: Change type to Omit<MenuItem, 'id' | 'businessId'> as businessId is handled by the context.
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
        // FIX: Add businessId to the updated menu item object to match the MenuItem type.
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
    
    // Inline editing handlers
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
                    <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        <PlusCircle size={20} className="mr-2" />
                        Add Menu Item
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-black/10">
                            <tr>
                                <th className="p-4 font-semibold">Menu Item</th>
                                <th className="p-4 font-semibold">Classification</th>
                                <th className="p-4 font-semibold">Sales Count</th>
                                <th className="p-4 font-semibold">Sale Price</th>
                                <th className="p-4 font-semibold">Cost</th>
                                <th className="p-4 font-semibold">Profit</th>
                                <th className="p-4 font-semibold">Food Cost %</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menuPerformance.map(item => {
                                const classification = getClassification(item.profit, item.salesCount);
                                const isEditing = editingItemId === item.id;
                                return (
                                    <tr key={item.id} className="border-b border-black/5 last:border-b-0 hover:bg-white/20 group">
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4"><ClassificationBadge classification={classification} /></td>
                                        <td className="p-4">
                                            {isEditing ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        value={editedSales}
                                                        onChange={(e) => setEditedSales(parseInt(e.target.value) || 0)}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                        autoFocus
                                                        min="0"
                                                    />
                                                    <button onClick={() => handleSaveSales(item.id)} className="text-green-600 hover:text-green-800"><Save size={18} /></button>
                                                    <button onClick={handleCancelSalesEdit} className="text-gray-600 hover:text-gray-800"><XCircle size={18} /></button>
                                                </div>
                                            ) : (
                                                 <div className="flex items-center space-x-2">
                                                    <span>{item.salesCount}</span>
                                                    <button onClick={() => handleEditSales(item)} className="text-primary hover:text-indigo-700 opacity-0 group-hover:opacity-100" aria-label="Edit sales count">
                                                        <Edit size={16} />
                                                    </button>
                                                 </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-text-secondary font-semibold">{formatCurrency(item.salePrice)}</td>
                                        <td className="p-4 text-text-secondary">{formatCurrency(item.costPerServing)}</td>
                                        <td className="p-4">
                                            <span className={`font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(item.profit)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-text-secondary">{item.foodCostPercentage.toFixed(1)}%</td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <button onClick={() => handleOpenModal(item)} className="text-primary hover:text-indigo-700"><Edit size={20} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem ? 'Edit Menu Item' : 'Add New Menu Item'}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Menu Item Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                        <label htmlFor="recipeId" className="block text-sm font-medium text-gray-700">Recipe</label>
                        <select name="recipeId" id="recipeId" value={formData.recipeId} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border bg-white rounded-md shadow-sm sm:text-sm ${errors.recipeId ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="" disabled>Select a recipe</option>
                            {recipes.map(rec => <option key={rec.id} value={rec.id}>{rec.name}</option>)}
                        </select>
                        {errors.recipeId && <p className="text-red-500 text-xs mt-1">{errors.recipeId}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">Sale Price</label>
                            <input type="number" name="salePrice" id="salePrice" value={formData.salePrice} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${errors.salePrice ? 'border-red-500' : 'border-gray-300'}`} min="0" step="0.01" />
                            {errors.salePrice && <p className="text-red-500 text-xs mt-1">{errors.salePrice}</p>}
                        </div>
                         <div>
                            <label htmlFor="salesCount" className="block text-sm font-medium text-gray-700">Sales Count</label>
                            <input type="number" name="salesCount" id="salesCount" value={formData.salesCount} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${errors.salesCount ? 'border-red-500' : 'border-gray-300'}`} min="0" />
                            {errors.salesCount && <p className="text-red-500 text-xs mt-1">{errors.salesCount}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">Save Item</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Menu;
