import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { AlertTriangle, PlusCircle, Save, XCircle, Trash2, Edit2, DollarSign, Truck, ShoppingCart, Info, Weight } from 'lucide-react';
import { InventoryItem } from '../types';
import ActionsDropdown from './common/ActionsDropdown';
import ImportModal from './common/ImportModal';
import { convertToCSV, downloadCSV } from '../utils/csvHelper';
import { useNotification } from '../hooks/useNotificationContext';


const ITEM_CATEGORIES: InventoryItem['category'][] = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Bakery', 'Beverages', 'Seafood'];
const DEFAULT_UNITS = ['kg', 'g', 'L', 'ml', 'unit', 'dozen'];

const StockLevelIndicator: React.FC<{ item: InventoryItem }> = ({ item }) => {
    const { quantity, lowStockThreshold } = item;
    const safeThreshold = lowStockThreshold * 2;
    const percentage = Math.min((quantity / safeThreshold) * 100, 100);

    let colorClass = 'bg-[var(--color-success)]';
    let statusText = 'In Stock';
    if (quantity <= lowStockThreshold) {
        colorClass = 'bg-[var(--color-danger)]';
        statusText = 'Low Stock';
    } else if (quantity <= lowStockThreshold * 1.5) {
        colorClass = 'bg-[var(--color-warning)]';
        statusText = 'Nearing Low';
    }

    return (
        <div className="w-full md:w-32" title={`${statusText}: ${quantity} / ${lowStockThreshold}`}>
            <div className="w-full bg-[var(--color-input)] rounded-full h-2.5">
                <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};


const Inventory: React.FC = () => {
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkUpdateInventoryItems, bulkDeleteInventoryItems, ingredientUnits, bulkAddInventoryItems } = useData();
    const { formatCurrency, currency } = useCurrency();
    const { addNotification } = useNotification();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState<'cost' | 'price' | 'unit' | 'reorder' | null>(null);
    const [bulkValue, setBulkValue] = useState<string | number>('');
    const [bulkError, setBulkError] = useState('');
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [deletionResult, setDeletionResult] = useState<{ deletedCount: number; failedItems: string[] } | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const allUnits = useMemo(() => {
        const customUnits = ingredientUnits.map(u => u.name);
        return [...new Set([...DEFAULT_UNITS, ...customUnits])];
    }, [ingredientUnits]);

    const handleOpenAddModal = () => {
        setItemToEdit(null);
        setIsAddModalOpen(true);
    };

    const handleOpenEditModal = (item: InventoryItem) => {
        setItemToEdit(JSON.parse(JSON.stringify(item))); // Deep copy
        setIsEditModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setItemToEdit(null);
        setErrors({});
    }
    
    const handleDelete = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
          deleteInventoryItem(itemId);
          addNotification('Item deleted.', 'info');
        }
    };

    const handleSelect = (itemId: string) => {
        setSelectedItems(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(itemId)) newSelection.delete(itemId);
            else newSelection.add(itemId);
            return newSelection;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedItems(new Set(inventory.map(i => i.id)));
        else setSelectedItems(new Set());
    };

    const handleConfirmBulkDelete = async () => {
        const result = await bulkDeleteInventoryItems(Array.from(selectedItems));
        setDeletionResult(result);
        if (result.deletedCount > 0) {
            addNotification(`${result.deletedCount} items deleted successfully.`, 'success');
        }
        if (result.failedItems.length > 0) {
            addNotification(`${result.failedItems.length} items could not be deleted as they are in use.`, 'error', true);
        }
        setSelectedItems(new Set());
        setIsConfirmDeleteOpen(false);
    };

    const openBulkModal = (action: 'cost' | 'price' | 'unit' | 'reorder') => {
        setBulkActionType(action);
        if (action === 'unit') {
            setBulkValue(allUnits[0] || '');
        } else {
            setBulkValue(0);
        }
        setBulkError('');
        setIsBulkModalOpen(true);
    };

    const closeBulkModal = () => {
        setIsBulkModalOpen(false);
        setBulkActionType(null);
        setBulkValue('');
        setBulkError('');
    };

    const handleBulkUpdate = async () => {
        let update: Partial<InventoryItem> = {};
        let isValid = true;
        setBulkError('');

        switch (bulkActionType) {
            case 'cost':
            case 'price':
                const numericValueCP = Number(bulkValue);
                if (isNaN(numericValueCP) || numericValueCP <= 0) {
                    setBulkError('Value must be a positive number.');
                    isValid = false;
                } else {
                    update = bulkActionType === 'cost' ? { unitCost: numericValueCP } : { unitPrice: numericValueCP };
                }
                break;
            case 'unit':
                if (!bulkValue) {
                    setBulkError('Please select a unit.');
                    isValid = false;
                } else {
                    update = { unit: String(bulkValue) };
                }
                break;
            case 'reorder':
                const numericValueR = Number(bulkValue);
                if (isNaN(numericValueR) || numericValueR < 0) {
                    setBulkError('Value must be a non-negative number.');
                    isValid = false;
                } else {
                    update = { lowStockThreshold: numericValueR };
                }
                break;
        }


        if (isValid) {
            await bulkUpdateInventoryItems(Array.from(selectedItems), update);
            addNotification(`${selectedItems.size} items updated.`, 'success');
            setSelectedItems(new Set());
            closeBulkModal();
        }
    };

    const isAllSelected = inventory.length > 0 && selectedItems.size === inventory.length;

    const handleExport = () => {
        const headers = ['name', 'category', 'quantity', 'unit', 'unitCost', 'unitPrice', 'lowStockThreshold', 'yieldPercentage'];
        const dataToExport = inventory.map(item => {
            return {
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                unitCost: item.unitCost,
                unitPrice: item.unitPrice,
                lowStockThreshold: item.lowStockThreshold,
                yieldPercentage: item.yieldPercentage || 100
            };
        });
        const csvString = convertToCSV(dataToExport, headers);
        downloadCSV(csvString, 'inventory.csv');
    };

    const parseInventoryFile = async (fileContent: string): Promise<{ data: Omit<InventoryItem, 'id' | 'businessId'>[]; errors: string[] }> => {
        const lines = fileContent.trim().split('\n');
        const headers = lines[0].trim().split(',').map(h => h.replace(/"/g, '').trim());
        const requiredHeaders = ['name', 'category', 'quantity', 'unit', 'unitCost', 'unitPrice', 'lowStockThreshold'];
        const errors: string[] = [];
        
        requiredHeaders.forEach(h => {
            if (!headers.includes(h)) errors.push(`Missing required header: ${h}`);
        });

        const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const item: any = {};
            headers.forEach((header, i) => item[header] = values[i]);
            
            const category = item.category as InventoryItem['category'];
            if (!ITEM_CATEGORIES.includes(category)) {
                errors.push(`Row ${index + 2}: Invalid category "${item.category}".`);
            }

            return {
                name: item.name,
                category: ITEM_CATEGORIES.includes(category) ? category : 'Pantry',
                quantity: parseFloat(item.quantity) || 0,
                unit: item.unit,
                unitCost: parseFloat(item.unitCost) || 0,
                unitPrice: parseFloat(item.unitPrice) || 0,
                lowStockThreshold: parseFloat(item.lowStockThreshold) || 0,
                yieldPercentage: parseFloat(item.yieldPercentage) || 100,
            };
        }).filter(item => item.name);
        
        if (data.length === 0 && errors.length > 0) return { data: [], errors };
        
        return { data, errors };
    };

    const handleImport = (data: Omit<InventoryItem, 'id' | 'businessId'>[]) => {
        return Promise.resolve(bulkAddInventoryItems(data));
    };

    return (
        <>
            <Card>
                <div className="flex flex-col md:flex-row gap-4 md:gap-2 justify-between items-start md:items-center mb-4">
                    <h2 className="text-xl font-bold">Inventory List</h2>
                    <div className="flex items-center space-x-2">
                        <ActionsDropdown onExport={handleExport} onImport={() => setIsImportModalOpen(true)} />
                        <button 
                            onClick={handleOpenAddModal}
                            className="ican-btn ican-btn-primary p-2 md:px-4 md:py-2">
                            <PlusCircle size={20} className="md:mr-2" />
                            <span className="hidden md:inline">Add Item</span>
                        </button>
                    </div>
                </div>

                {selectedItems.size > 0 && (
                    <div className="bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 p-3 rounded-lg mb-4 flex items-center justify-between flex-wrap gap-2" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <p className="font-semibold text-sm text-[var(--color-primary)]">{selectedItems.size} items selected</p>
                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                            <button onClick={() => openBulkModal('cost')} className="text-sm flex items-center bg-[var(--color-sidebar)] border border-[var(--color-border)] px-3 py-1.5 rounded-md hover:bg-[var(--color-border)] text-[var(--color-text-secondary)]"><DollarSign size={14} className="mr-1.5" /> Update Cost</button>
                            <button onClick={() => openBulkModal('price')} className="text-sm flex items-center bg-[var(--color-sidebar)] border border-[var(--color-border)] px-3 py-1.5 rounded-md hover:bg-[var(--color-border)] text-[var(--color-text-secondary)]"><DollarSign size={14} className="mr-1.5" /> Update Price</button>
                            <button onClick={() => openBulkModal('unit')} className="text-sm flex items-center bg-[var(--color-sidebar)] border border-[var(--color-border)] px-3 py-1.5 rounded-md hover:bg-[var(--color-border)] text-[var(--color-text-secondary)]"><Weight size={14} className="mr-1.5" /> Update Unit</button>
                            <button onClick={() => openBulkModal('reorder')} className="text-sm flex items-center bg-[var(--color-sidebar)] border border-[var(--color-border)] px-3 py-1.5 rounded-md hover:bg-[var(--color-border)] text-[var(--color-text-secondary)]"><AlertTriangle size={14} className="mr-1.5" /> Update Reorder</button>
                            <button onClick={() => setIsConfirmDeleteOpen(true)} className="text-sm flex items-center bg-[var(--color-danger)] text-white px-3 py-1.5 rounded-md hover:bg-opacity-80"><Trash2 size={14} className="mr-1.5" /> Delete</button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                <table className="w-full text-left responsive-table">
                    <thead className="ican-table-header">
                        <tr>
                            <th className="p-4 w-4">
                                <input type="checkbox" onChange={handleSelectAll} checked={isAllSelected} aria-label="Select all items" className="rounded border-gray-400 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                            </th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Name</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Category</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Stock</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Yield</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Unit Cost</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Status</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.length > 0 ? inventory.map(item => {
                            return (
                                <tr key={item.id} className={`border-b border-[var(--color-border)] last:border-b-0 transition-colors hover:bg-[var(--color-input)] ${selectedItems.has(item.id) ? 'bg-[var(--color-primary-light)]' : ''}`}>
                                    <td className="p-4 checkbox-cell">
                                        <input type="checkbox" onChange={() => handleSelect(item.id)} checked={selectedItems.has(item.id)} aria-label={`Select ${item.name}`} className="rounded border-gray-400 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                                    </td>
                                    <td data-label="Name" className="p-4 font-medium text-[var(--color-text-primary)] whitespace-nowrap">{item.name}</td>
                                    <td data-label="Category" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{item.category}</td>
                                    <td data-label="Stock" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{item.quantity} {item.unit}</td>
                                    <td data-label="Yield" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{item.yieldPercentage || 100}%</td>
                                    <td data-label="Unit Cost" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{formatCurrency(item.unitCost)}</td>
                                    <td data-label="Status" className="p-4">
                                        <StockLevelIndicator item={item} />
                                    </td>
                                    <td data-label="Actions" className="p-4">
                                        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-3">
                                            <button onClick={() => handleOpenEditModal(item)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]" title="Edit item"><Edit2 size={20} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]" title="Delete item"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={8} className="text-center py-10">
                                     <div className="flex flex-col items-center text-[var(--color-text-muted)]">
                                        <ShoppingCart size={40} className="mb-2 text-[var(--color-border)]"/>
                                        <p className="font-semibold">No inventory items yet</p>
                                        <p className="text-sm">Add your first item to get started.</p>
                                        <button onClick={handleOpenAddModal} className="mt-4 ican-btn ican-btn-primary">Add Item</button>
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
                onClose={() => setIsImportModalOpen(false)}
                title="Import Inventory Items"
                templateUrl="data:text/csv;charset=utf-8,name,category,quantity,unit,unitCost,unitPrice,lowStockThreshold,yieldPercentage%0AExample%20Item,Produce,10,kg,5,8,2,95"
                templateFilename="inventory_template.csv"
                parseFile={parseInventoryFile}
                onImport={handleImport}
                renderPreview={(item: any, index: number) => (
                    <div key={index} className="p-2 text-sm flex justify-between">
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">{item.name}</p>
                            <p className="text-[var(--color-text-muted)]">{item.quantity} {item.unit}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-medium">{formatCurrency(item.unitCost)}</p>
                             <p className="text-xs text-[var(--color-text-muted)]">Unit Cost</p>
                        </div>
                    </div>
                )}
            />
             <ItemFormModal 
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={handleCloseModal}
                item={itemToEdit}
                onSave={async (itemData, isEditing) => {
                    if (isEditing) {
                        await updateInventoryItem(itemData as InventoryItem);
                        addNotification('Inventory item updated!', 'success');
                    } else {
                        await addInventoryItem(itemData as Omit<InventoryItem, 'id' | 'businessId'>);
                        addNotification('Inventory item added!', 'success');
                    }
                    handleCloseModal();
                }}
                allUnits={allUnits}
             />
            <Modal isOpen={isBulkModalOpen} onClose={closeBulkModal} title={`Bulk Update ${selectedItems.size} Items`}>
                <div className="space-y-4">
                    {bulkActionType === 'cost' && (
                        <div>
                            <label htmlFor="bulkCost" className="block text-sm font-medium text-[var(--color-text-muted)]">New Unit Cost ({currency})</label>
                            <input type="number" id="bulkCost" value={bulkValue} onChange={e => setBulkValue(e.target.value)} className={`ican-input mt-1 ${bulkError ? 'border-[var(--color-danger)]' : ''}`} min="0" step="0.01" autoFocus />
                        </div>
                    )}
                    {bulkActionType === 'price' && (
                        <div>
                            <label htmlFor="bulkPrice" className="block text-sm font-medium text-[var(--color-text-muted)]">New Unit Price ({currency})</label>
                            <input type="number" id="bulkPrice" value={bulkValue} onChange={e => setBulkValue(e.target.value)} className={`ican-input mt-1 ${bulkError ? 'border-[var(--color-danger)]' : ''}`} min="0" step="0.01" autoFocus />
                        </div>
                    )}
                    {bulkActionType === 'unit' && (
                         <div>
                            <label htmlFor="bulkUnit" className="block text-sm font-medium text-[var(--color-text-muted)]">New Unit</label>
                            <select id="bulkUnit" value={String(bulkValue)} onChange={e => setBulkValue(e.target.value)} className={`ican-select mt-1 ${bulkError ? 'border-[var(--color-danger)]' : ''}`}>
                                {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>
                    )}
                    {bulkActionType === 'reorder' && (
                         <div>
                            <label htmlFor="bulkReorder" className="block text-sm font-medium text-[var(--color-text-muted)]">New Reorder Level</label>
                            <input type="number" id="bulkReorder" value={bulkValue} onChange={e => setBulkValue(e.target.value)} className={`ican-input mt-1 ${bulkError ? 'border-[var(--color-danger)]' : ''}`} min="0" step="1" autoFocus />
                        </div>
                    )}

                    {bulkError && <p className="text-[var(--color-danger)] text-xs mt-1">{bulkError}</p>}
                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                        <button onClick={closeBulkModal} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button onClick={handleBulkUpdate} className="ican-btn ican-btn-primary w-full md:w-auto">Update Items</button>
                    </div>
                </div>
            </Modal>
             <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title="Confirm Bulk Deletion"
                message={`Are you sure you want to delete ${selectedItems.size} selected items? This action cannot be undone for items not used in recipes.`}
            />
            <Modal isOpen={!!deletionResult} onClose={() => setDeletionResult(null)} title="Deletion Report">
                {deletionResult && (
                    <div>
                        {deletionResult.deletedCount > 0 && (
                            <p className="text-[var(--color-success)] mb-2">{deletionResult.deletedCount} items were successfully deleted.</p>
                        )}
                        {deletionResult.failedItems.length > 0 && (
                            <div>
                                <p className="text-[var(--color-danger)]">Could not delete {deletionResult.failedItems.length} items because they are used in recipes:</p>
                                <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] mt-1">
                                    {deletionResult.failedItems.map(name => <li key={name}>{name}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setDeletionResult(null)} className="ican-btn ican-btn-primary">
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

// Form Modal Component for Add/Edit
interface ItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    onSave: (item: Omit<InventoryItem, 'id' | 'businessId'> | InventoryItem, isEditing: boolean) => void;
    allUnits: string[];
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({ isOpen, onClose, item, onSave, allUnits }) => {
    const { currency } = useCurrency();
    const [formData, setFormData] = useState<Omit<InventoryItem, 'id' | 'businessId'>>({
        name: '', category: 'Produce', quantity: 0, unit: 'kg', unitCost: 0, unitPrice: 0, lowStockThreshold: 0, yieldPercentage: 100
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const isEditing = !!item;

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setFormData(item);
            } else {
                setFormData({ name: '', category: 'Produce', quantity: 0, unit: 'kg', unitCost: 0, unitPrice: 0, lowStockThreshold: 0, yieldPercentage: 100 });
            }
            setErrors({});
        }
    }, [isOpen, item]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['quantity', 'unitCost', 'unitPrice', 'lowStockThreshold', 'yieldPercentage'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumberField ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = 'Item name is required.';
        if (formData.unitCost <= 0) newErrors.unitCost = 'Unit cost must be a positive number.';
        if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative.';
        if (formData.lowStockThreshold < 0) newErrors.lowStockThreshold = 'Low stock threshold cannot be negative.';
        if ((formData.yieldPercentage || 0) <= 0 || (formData.yieldPercentage || 0) > 100) newErrors.yieldPercentage = 'Yield must be between 1 and 100.';

        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        
        onSave(isEditing ? { ...item, ...formData } as InventoryItem : formData, isEditing);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}>
             <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-muted)]">Item Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`ican-input mt-1 ${errors.name ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-muted)]">Category</label>
                        <select name="category" id="category" value={formData.category} onChange={handleChange} className="ican-select mt-1">
                            {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-[var(--color-text-muted)]">Quantity</label>
                            <input type="number" min="0" name="quantity" id="quantity" value={formData.quantity} onChange={handleChange} className={`ican-input mt-1 ${errors.quantity ? 'border-[var(--color-danger)]' : ''}`} />
                            {errors.quantity && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.quantity}</p>}
                        </div>
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-[var(--color-text-muted)]">Unit</label>
                            <select name="unit" id="unit" value={formData.unit} onChange={handleChange} className="ican-select mt-1">
                                {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="unitCost" className="block text-sm font-medium text-[var(--color-text-muted)]">Unit Cost ({currency})</label>
                            <input type="number" min="0" step="0.01" name="unitCost" id="unitCost" value={formData.unitCost} onChange={handleChange} className={`ican-input mt-1 ${errors.unitCost ? 'border-[var(--color-danger)]' : ''}`} />
                            {errors.unitCost && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.unitCost}</p>}
                        </div>
                        <div>
                            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-[var(--color-text-muted)]">Low Stock Threshold</label>
                            <input type="number" min="0" name="lowStockThreshold" id="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className={`ican-input mt-1 ${errors.lowStockThreshold ? 'border-[var(--color-danger)]' : ''}`} />
                            {errors.lowStockThreshold && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.lowStockThreshold}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-1">
                        <div>
                            <label htmlFor="yieldPercentage" className="flex items-center text-sm font-medium text-[var(--color-text-muted)]">
                                Yield %
                                <span className="group relative ml-1.5">
                                    <Info size={14} className="cursor-help" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        The usable percentage of the item after trimming, peeling, or de-boning. E.g., Onions might have a 90% yield. This affects the true cost.
                                    </span>
                                </span>
                            </label>
                            <input type="number" min="1" max="100" name="yieldPercentage" id="yieldPercentage" value={formData.yieldPercentage || 100} onChange={handleChange} className={`ican-input mt-1 ${errors.yieldPercentage ? 'border-[var(--color-danger)]' : ''}`} />
                            {errors.yieldPercentage && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.yieldPercentage}</p>}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                        <button onClick={onClose} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button onClick={handleSubmit} className="ican-btn ican-btn-primary w-full md:w-auto">{isEditing ? 'Save Changes' : 'Add Item'}</button>
                    </div>
                </div>
        </Modal>
    );
};

export default Inventory;