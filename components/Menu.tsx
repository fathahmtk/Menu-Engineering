import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Edit, Trash2, Star, Puzzle, ThumbsDown, Grip, Save, XCircle, Utensils, Info, ChevronDown } from 'lucide-react';
import { MenuItem, Recipe, RecipeCostBreakdown } from '../types';
import { useNotification } from '../hooks/useNotificationContext';

type Classification = 'Star' | 'Plowhorse' | 'Puzzle' | 'Dog';

const CLASSIFICATION_INFO: Record<Classification, { icon: React.ReactNode; label: string; description: string; className: string }> = {
    Star: { icon: <Star size={14} />, label: 'Star', description: 'High Profit, High Popularity. Promote these items and maintain their quality.', className: 'bg-green-100 text-green-700' },
    Plowhorse: { icon: <Grip size={14} />, label: 'Plowhorse', description: 'Low Profit, High Popularity. Consider slightly increasing the price or reducing costs.', className: 'bg-blue-100 text-blue-700' },
    Puzzle: { icon: <Puzzle size={14} />, label: 'Puzzle', description: 'High Profit, Low Popularity. Consider promoting this item more or repositioning it on the menu.', className: 'bg-yellow-100 text-yellow-700' },
    Dog: { icon: <ThumbsDown size={14} />, label: 'Dog', description: 'Low Profit, Low Popularity. Consider removing this item from the menu.', className: 'bg-red-100 text-red-700' },
};

const ClassificationBadge: React.FC<{ classification: Classification }> = ({ classification }) => {
    const { icon, label, description, className } = CLASSIFICATION_INFO[classification];

    return (
        <div className="relative group flex items-center cursor-help">
            <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${className}`}>
                {icon}
                <span className="ml-1">{label}</span>
            </span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 text-xs text-white bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="font-bold mb-1">{label} Insight:</p>
                {description}
                <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
            </div>
        </div>
    );
};

const CostBreakdownRow: React.FC<{ breakdown: RecipeCostBreakdown, formatCurrency: (val: number) => string }> = ({ breakdown, formatCurrency }) => {
    return (
        <div className="p-4 bg-[var(--color-input)] grid grid-cols-2 md:grid-cols-5 gap-4 rounded-lg">
            <h4 className="col-span-full font-semibold text-md text-[var(--color-text-primary)] mb-2">True Cost Breakdown</h4>
             <div className="text-center">
                <p className="text-xs text-[var(--color-text-muted)]">Raw Materials</p>
                <p className="font-bold text-sm text-[var(--color-text-primary)]">{formatCurrency(breakdown.rawMaterialCost)}</p>
            </div>
             <div className="text-center">
                <p className="text-xs text-[var(--color-text-muted)]">Direct Labour</p>
                <p className="font-bold text-sm text-[var(--color-text-primary)]">{formatCurrency(breakdown.labourCost)}</p>
            </div>
             <div className="text-center">
                <p className="text-xs text-[var(--color-text-muted)]">Overheads</p>
                <p className="font-bold text-sm text-[var(--color-text-primary)]">{formatCurrency(breakdown.variableOverheadCost + breakdown.fixedOverheadCost)}</p>
            </div>
             <div className="text-center">
                <p className="text-xs text-[var(--color-text-muted)]">Packaging</p>
                <p className="font-bold text-sm text-[var(--color-text-primary)]">{formatCurrency(breakdown.packagingCost)}</p>
            </div>
             <div className="text-center bg-[var(--color-background)] p-2 rounded">
                <p className="text-xs text-[var(--color-primary)]">Total Cost/Serving</p>
                <p className="font-bold text-lg text-[var(--color-primary)]">{formatCurrency(breakdown.costPerServing)}</p>
            </div>
        </div>
    );
};


const Menu: React.FC = () => {
    const { menuItems, recipes, addMenuItem, updateMenuItem, deleteMenuItem, calculateRecipeCostBreakdown } = useData();
    const { formatCurrency } = useCurrency();
    const { addNotification } = useNotification();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<Omit<MenuItem, 'id' | 'businessId'>>({ name: '', recipeId: '', salePrice: 0, salesCount: 0 });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedSales, setEditedSales] = useState<number>(0);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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
            const breakdown = calculateRecipeCostBreakdown(recipe);
            const profit = item.salePrice - breakdown.costPerServing;
            const foodCostPercentage = item.salePrice > 0 ? (breakdown.costPerServing / item.salePrice) * 100 : 0;
            return { ...item, recipe, costPerServing: breakdown.costPerServing, profit, foodCostPercentage, breakdown };
        });
    }, [menuItems, recipes, calculateRecipeCostBreakdown]);

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

    const handleToggleRow = (itemId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
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

    const handleSubmit = async () => {
        if (!validate()) return;
        if (currentItem) {
            await updateMenuItem({ ...formData, id: currentItem.id, businessId: currentItem.businessId });
            addNotification('Menu item updated!', 'success');
        } else {
            await addMenuItem(formData);
            addNotification('Menu item added!', 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to remove this item from the menu?')) {
            deleteMenuItem(id);
            addNotification('Menu item removed.', 'info');
        }
    };
    
    const handleEditSales = (item: MenuItem) => {
        setEditingItemId(item.id);
        setEditedSales(item.salesCount);
    };

    const handleCancelSalesEdit = () => {
        setEditingItemId(null);
    };

    const handleSaveSales = async (itemId: string) => {
        if (editedSales < 0) {
            alert("Sales count cannot be negative.");
            return;
        }
        const itemToUpdate = menuItems.find(i => i.id === itemId);
        if (itemToUpdate) {
            await updateMenuItem({ ...itemToUpdate, salesCount: editedSales });
            addNotification('Sales count updated!', 'success');
        }
        setEditingItemId(null);
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-4 xl:col-span-3">
                <Card>
                    <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center mb-4">
                        <h2 className="text-xl font-bold">Menu Engineering</h2>
                        <button onClick={() => handleOpenModal()} className="ican-btn ican-btn-primary p-2 md:px-4 md:py-2">
                            <PlusCircle size={20} className="md:mr-2" />
                            <span className="hidden md:inline">Add Menu Item</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left responsive-table">
                        <thead className="ican-table-header">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Menu Item</th>
                                <th className="p-4 whitespace-nowrap">Classification</th>
                                <th className="p-4 whitespace-nowrap">Sales Count</th>
                                <th className="p-4 whitespace-nowrap">Sale Price</th>
                                <th className="p-4 whitespace-nowrap">Cost</th>
                                <th className="p-4 whitespace-nowrap">Profit</th>
                                <th className="p-4 whitespace-nowrap">Food Cost %</th>
                                <th className="p-4 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menuPerformance.length > 0 ? menuPerformance.map(item => {
                                const classification = getClassification(item.profit, item.salesCount);
                                const isEditing = editingItemId === item.id;
                                const isExpanded = expandedRows.has(item.id);
                                return (
                                    <React.Fragment key={item.id}>
                                        <tr className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-input)] group cursor-pointer" onClick={() => handleToggleRow(item.id)}>
                                            <td data-label="Menu Item" className="p-4 font-medium whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span>{item.name}</span>
                                                    <ChevronDown size={16} className={`ml-2 text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </td>
                                            <td data-label="Classification" className="p-4"><ClassificationBadge classification={classification} /></td>
                                            <td data-label="Sales Count" className="p-4" onClick={e => e.stopPropagation()}>
                                                {isEditing ? (
                                                    <div className="flex items-center space-x-2 w-full md:w-32">
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
                                            <td data-label="Actions" className="p-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-3">
                                                    <button onClick={() => handleOpenModal(item)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"><Edit size={20} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={20} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="border-b border-[var(--color-border)] last:border-b-0">
                                                <td colSpan={8} className="p-4 !bg-[var(--color-background)]">
                                                    <CostBreakdownRow breakdown={item.breakdown} formatCurrency={formatCurrency} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-10">
                                         <div className="flex flex-col items-center text-[var(--color-text-muted)]">
                                            <Utensils size={40} className="mb-2 text-[var(--color-border)]"/>
                                            <p className="font-semibold">No menu items yet</p>
                                            <p className="text-sm">Add your first menu item to get started.</p>
                                            <button onClick={() => handleOpenModal()} className="mt-4 ican-btn ican-btn-primary">Add Menu Item</button>
                                         </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-4 xl:col-span-1">
                <Card>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Info size={16} className="mr-2 text-[var(--color-primary)]"/>
                        Menu Benchmarks
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mb-4">
                        These averages are used to classify your menu items. Items are compared against these values for profitability and popularity.
                    </p>
                    <div className="space-y-3">
                        <div className="bg-[var(--color-input)] p-3 rounded-lg">
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Average Profit</p>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">{formatCurrency(averageProfit)}</p>
                        </div>
                        <div className="bg-[var(--color-input)] p-3 rounded-lg">
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Average Sales Count</p>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">{averageSales.toFixed(1)}</p>
                        </div>
                    </div>
                </Card>
            </div>


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
        </div>
    );
};

export default Menu;