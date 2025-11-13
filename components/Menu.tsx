

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
        Star: { icon: <Star size={14} />, label: 'Star' },
        Plowhorse: { icon: <Grip size={14} />, label: 'Plowhorse' },
        Puzzle: { icon: <Puzzle size={14} />, label: 'Puzzle' },
        Dog: { icon: <ThumbsDown size={14} />, label: 'Dog' },
    };
    const { icon, label } = config[classification];
    const colorClasses = {
        Star: 'bg-green-100 text-green-700',
        Plowhorse: 'bg-blue-100 text-blue-700',
        Puzzle: 'bg-yellow-100 text-yellow-700',
        Dog: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${colorClasses[classification]}`}>
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
                    <button onClick={() => handleOpenModal()} className="ican-btn ican-btn-primary p-2 md:px-4 md:py-2">
                        <PlusCircle size={20} className="md:mr-2" />
                        <span className="hidden md:inline">Add Menu Item</span>
                    </button>
                </div>
                <table className="w-full text-left responsive-table">
                    <thead className="ican-table-header">
                        <tr>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Menu Item</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Classification</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Sales Count</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Sale Price</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Cost</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Profit</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Food Cost %</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menuPerformance.map(item => {
                            const classification = getClassification(item.profit, item.salesCount);
                            const isEditing = editingItemId === item.id;
                            return (
                                <tr key={item.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-input)] group">
                                    <td data-label="Menu Item" className="p-4 font-medium whitespace-nowrap">{item.name}</td>
                                    <td data-label="Classification" className="p-4"><ClassificationBadge classification={classification} /></td>
                                    <td data-label="Sales Count" className="p-4">
                                        {isEditing ? (
                                            <div className="flex items-center space-x-2 w-full">
                                                <input
                                                    type="number"
                                                    value={editedSales}
                                                    onChange={(e) => setEditedSales(parseInt(e.target.value) || 0)}
                                                    className="ican-input w-full py-1"
                                                    autoFocus
                                                    min="0"
                                                />
                                                <button onClick={() => handleSaveSales(item.id)} className="text-green-500 hover:text-green-600"><Save size={18} /></button>
                                                <button onClick={handleCancelSalesEdit} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><XCircle size={18} /></button>
                                            </div>
                                        ) : (
                                             <div className="flex items-center space-x-2 text-[var(--color-text-muted)]">
                                                <span>{item.salesCount}</span>
                                                <button onClick={() => handleEditSales(item)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100" aria-label="Edit sales count">
                                                    <Edit size={16} />
                                                </button>
                                             </div>
                                        )}
                                    </td>
                                    <td data-label="Sale Price" className="p-4 text-[var(--color-text-primary)] font-semibold whitespace-nowrap">{formatCurrency(item.salePrice)}</td>
                                    <td data-label="Cost" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{formatCurrency(item.costPerServing)}</td>
                                    <td data-label="Profit" className="p-4">
                                        <span className={`font-bold ${item.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                                            {formatCurrency(item.profit)}
                                        </span>
                                    </td>
                                    <td data-label="Food Cost %" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{item.foodCostPercentage.toFixed(1)}%</td>
                                    <td data-label="Actions" className="p-4">
                                        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-3">
                                            <button onClick={() => handleOpenModal(item)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"><Edit size={20} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={20} /></button>
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
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-muted)]">Menu Item Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`ican-input mt-1 ${errors.name ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                        <label htmlFor="recipeId" className="block text-sm font-medium text-[var(--color-text-muted)]">Recipe</label>
                        <select name="recipeId" id="recipeId" value={formData.recipeId} onChange={handleChange} className={`ican-select mt-1 ${errors.recipeId ? 'border-[var(--color-danger)]' : ''}`}>
                            <option value="" disabled>Select a recipe</option>
                            {recipes.map(rec => <option key={rec.id} value={rec.id}>{rec.name}</option>)}
                        </select>
                        {errors.recipeId && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.recipeId}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="salePrice" className="block text-sm font-medium text-[var(--color-text-muted)]">Sale Price</label>
                            <input type="number" name="salePrice" id="salePrice" value={formData.salePrice} onChange={handleChange} className={`ican-input mt-1 ${errors.salePrice ? 'border-[var(--color-danger)]' : ''}`} min="0" step="0.01" />
                            {errors.salePrice && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.salePrice}</p>}
                        </div>
                         <div>
                            <label htmlFor="salesCount" className="block text-sm font-medium text-[var(--color-text-muted)]">Sales Count</label>
                            <input type="number" name="salesCount" id="salesCount" value={formData.salesCount} onChange={handleChange} className={`ican-input mt-1 ${errors.salesCount ? 'border-[var(--color-danger)]' : ''}`} min="0" />
                            {errors.salesCount && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.salesCount}</p>}
                        </div>
                    </div>
                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                        <button onClick={handleCloseModal} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button onClick={handleSubmit} className="ican-btn ican-btn-primary w-full md:w-auto">Save Item</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Menu;