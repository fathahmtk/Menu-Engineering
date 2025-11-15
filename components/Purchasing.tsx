

import React, { useState, useCallback, useEffect } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PricedItem } from '../types';
import { Tags, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useNotification } from '../hooks/useNotificationContext';
import ImportModal from './common/ImportModal';
import ActionsDropdown from './common/ActionsDropdown';
import { convertToCSV, downloadCSV } from '../utils/csvHelper';

const ITEM_CATEGORIES: PricedItem['category'][] = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Bakery', 'Beverages', 'Seafood'];

const PricedItemFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<PricedItem, 'id' | 'businessId'> | PricedItem) => void;
    item: Omit<PricedItem, 'id' | 'businessId'> | PricedItem | null;
}> = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState<Omit<PricedItem, 'id' | 'businessId'>>({ name: '', category: 'Pantry', unit: '', unitCost: 0 });
    const [errors, setErrors] = useState<{ [key:string]: string }>({});

    useEffect(() => {
        if (item) {
            setFormData(item);
        } else {
            setFormData({ name: '', category: 'Pantry', unit: '', unitCost: 0 });
        }
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'unitCost' ? parseFloat(value) : value }));
    };

    const validate = () => {
        const newErrors: {[key:string]: string} = {};
        if (!formData.name.trim()) newErrors.name = 'Item name is required.';
        if (!formData.unit.trim()) newErrors.unit = 'Unit is required.';
        if (isNaN(formData.unitCost) || formData.unitCost < 0) {
            newErrors.unitCost = 'Unit cost must be a valid non-negative number.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave(formData);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Priced Item' : 'Add New Item'}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Item Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={`ican-input mt-1 ${errors.name ? 'border-[var(--color-danger)]' : ''}`} />
                     {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="ican-select mt-1">
                            {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Unit</label>
                        <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g., kg, L, unit" className={`ican-input mt-1 ${errors.unit ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.unit && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.unit}</p>}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Unit Cost</label>
                    <input type="number" name="unitCost" value={formData.unitCost} onChange={handleChange} min="0" step="0.01" className={`ican-input mt-1 ${errors.unitCost ? 'border-[var(--color-danger)]' : ''}`} />
                    {errors.unitCost && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.unitCost}</p>}
                </div>
                <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                    <button onClick={onClose} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                    <button onClick={handleSubmit} className="ican-btn ican-btn-primary w-full md:w-auto">Save Item</button>
                </div>
            </div>
        </Modal>
    );
};

const PriceList: React.FC = () => {
    const { pricedItems, uploadPriceList, addPricedItem, updatePricedItem, deletePricedItem } = useData();
    const { formatCurrency } = useCurrency();
    const { addNotification } = useNotification();
    
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PricedItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<PricedItem | null>(null);

    const parsePriceListFile = async (fileContent: string): Promise<{ data: Omit<PricedItem, 'id' | 'businessId'>[]; errors: string[] }> => {
        const lines = fileContent.trim().split('\n');
        const headers = lines[0].trim().split(',').map(h => h.replace(/"/g, '').trim());
        const requiredHeaders = ['name', 'category', 'unit', 'unitCost'];
        const errors: string[] = [];
        
        requiredHeaders.forEach(h => {
            if (!headers.includes(h)) errors.push(`Missing required header: ${h}`);
        });

        if (errors.length > 0) return { data: [], errors };

        const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const item: any = {};
            headers.forEach((header, i) => item[header] = values[i]);
            
            const category = item.category as PricedItem['category'];
            if (!ITEM_CATEGORIES.includes(category)) {
                errors.push(`Row ${index + 2}: Invalid category "${item.category}".`);
            }
            const unitCost = parseFloat(item.unitCost);
            if (isNaN(unitCost) || unitCost < 0) {
                 errors.push(`Row ${index + 2}: Invalid unitCost "${item.unitCost}". Must be a non-negative number.`);
            }

            return {
                name: item.name,
                category: ITEM_CATEGORIES.includes(category) ? category : 'Pantry',
                unit: item.unit,
                unitCost: unitCost,
            };
        }).filter(item => item.name && !isNaN(item.unitCost));
        
        return { data, errors };
    };

    const handleImport = (data: Omit<PricedItem, 'id' | 'businessId'>[]) => {
        if (!window.confirm(`This will replace your current price list of ${pricedItems.length} items with ${data.length} new items. Are you sure?`)) {
          return Promise.resolve({ successCount: 0, duplicateCount: 0 });
        }
        return uploadPriceList(data).then(result => {
             addNotification(`${result.successCount} items have been imported successfully.`, 'success');
             return result;
        });
    };

    const handleExport = () => {
        const headers = ['name', 'category', 'unit', 'unitCost'];
        const dataToExport = pricedItems.map(item => ({
            name: item.name,
            category: item.category,
            unit: item.unit,
            unitCost: item.unitCost
        }));
        const csvString = convertToCSV(dataToExport, headers);
        downloadCSV(csvString, 'price_list.csv');
        addNotification('Price list exported successfully!', 'success');
    };

    const handleSaveItem = (itemData: Omit<PricedItem, 'id' | 'businessId'> | PricedItem) => {
        if ('id' in itemData) {
            updatePricedItem(itemData);
            addNotification('Item updated successfully!', 'success');
        } else {
            addPricedItem(itemData);
            addNotification('Item added successfully!', 'success');
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        const result = await deletePricedItem(itemToDelete.id);
        if (result.success) {
            addNotification('Item deleted successfully.', 'success');
        } else {
            addNotification(result.message || 'Error deleting item.', 'error', true);
        }
        setItemToDelete(null);
    };

    const openFormModal = (item: PricedItem | null = null) => {
        setEditingItem(item);
        setFormModalOpen(true);
    };

    const openConfirmModal = (item: PricedItem) => {
        setItemToDelete(item);
        setConfirmModalOpen(true);
    };

    return (
        <>
            <Card>
                <div className="flex flex-col md:flex-row gap-4 md:gap-2 justify-between items-start md:items-center mb-6">
                    <h2 className="text-xl font-bold">Price List Management</h2>
                    <div className="flex items-center space-x-2">
                        <ActionsDropdown onExport={handleExport} onImport={() => setImportModalOpen(true)} />
                        <button onClick={() => openFormModal()} className="ican-btn ican-btn-primary p-2 md:px-4 md:py-2">
                            <PlusCircle size={20} className="md:mr-2" />
                            <span className="hidden md:inline">Add Item</span>
                        </button>
                    </div>
                </div>
                 <div className="overflow-x-auto max-h-[calc(100vh-250px)]">
                    <table className="w-full text-left responsive-table">
                        <thead className="ican-table-header sticky top-0">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Unit</th>
                                <th className="p-4 text-right">Unit Cost</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                         <tbody>
                        {pricedItems.length > 0 ? pricedItems.map(item => (
                            <tr key={item.id} className="border-b border-[var(--color-border)] last:border-b-0 transition-colors hover:bg-[var(--color-input)]">
                                <td data-label="Name" className="p-4 font-medium">{item.name}</td>
                                <td data-label="Category" className="p-4 text-[var(--color-text-muted)]">{item.category}</td>
                                <td data-label="Unit" className="p-4 text-[var(--color-text-muted)]">{item.unit}</td>
                                <td data-label="Unit Cost" className="p-4 text-right font-mono">{formatCurrency(item.unitCost)}</td>
                                <td data-label="Actions" className="p-4">
                                    <div className="flex justify-end items-center space-x-2">
                                        <button onClick={() => openFormModal(item)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"><Edit size={18} /></button>
                                        <button onClick={() => openConfirmModal(item)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10">
                                     <div className="flex flex-col items-center text-[var(--color-text-muted)]">
                                        <Tags size={40} className="mb-2 text-[var(--color-border)]"/>
                                        <p className="font-semibold">Your price list is empty.</p>
                                        <p className="text-sm">Add an item manually or bulk import a CSV file.</p>
                                     </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                 </div>
            </Card>
            
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setImportModalOpen(false)}
                title="Bulk Import Price List"
                templateUrl="data:text/csv;charset=utf-8,name,category,unit,unitCost%0AExample%20Chicken,Meat,kg,18.50"
                templateFilename="price_list_template.csv"
                parseFile={parsePriceListFile}
                onImport={handleImport}
                renderPreview={(item: any, index) => (
                    <div key={index} className="p-2 text-sm flex justify-between">
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">{item.name}</p>
                            <p className="text-[var(--color-text-muted)]">{item.category} - {item.unit}</p>
                        </div>
                        <p className="font-mono text-[var(--color-text-primary)]">{formatCurrency(item.unitCost)}</p>
                    </div>
                )}
            />

            <PricedItemFormModal
                isOpen={isFormModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSave={handleSaveItem}
                item={editingItem}
            />
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Priced Item"
                message={`Are you sure you want to delete "${itemToDelete?.name}"? This cannot be undone.`}
            />
        </>
    );
};

export default PriceList;