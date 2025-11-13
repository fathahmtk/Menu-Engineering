

import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { AlertTriangle, PlusCircle, Edit, Save, XCircle, Trash2, Edit2, DollarSign, Truck, ShoppingCart } from 'lucide-react';
import { InventoryItem } from '../types';
import ActionsDropdown from './common/ActionsDropdown';
import ImportModal from './common/ImportModal';
import { convertToCSV, downloadCSV } from '../utils/csvHelper';
import { useNotification } from '../hooks/useNotificationContext';


const ITEM_CATEGORIES: InventoryItem['category'][] = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Bakery', 'Beverages', 'Seafood'];
const DEFAULT_UNITS = ['kg', 'g', 'L', 'ml', 'unit', 'dozen'];


const Inventory: React.FC = () => {
    const { inventory, getSupplierById, suppliers, addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkUpdateInventoryItems, bulkDeleteInventoryItems, ingredientUnits, bulkAddInventoryItems } = useData();
    const { formatCurrency, currency } = useCurrency();
    const { addNotification } = useNotification();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id' | 'businessId'>>({
        name: '',
        category: 'Produce',
        quantity: 0,
        unit: 'kg',
        unitCost: 0,
        unitPrice: 0,
        supplierId: suppliers[0]?.id || '',
        lowStockThreshold: 0,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedCost, setEditedCost] = useState<number>(0);
    const [editedPrice, setEditedPrice] = useState<number>(0);

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState<'cost' | 'price' | 'supplier' | null>(null);
    const [bulkValue, setBulkValue] = useState<string | number>('');
    const [bulkError, setBulkError] = useState('');
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [deletionResult, setDeletionResult] = useState<{ deletedCount: number; failedItems: string[] } | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const allUnits = useMemo(() => {
        const customUnits = ingredientUnits.map(u => u.name);
        return [...new Set([...DEFAULT_UNITS, ...customUnits])];
    }, [ingredientUnits]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['quantity', 'unitCost', 'unitPrice', 'lowStockThreshold'].includes(name);
        setNewItem({
            ...newItem,
            [name]: isNumberField ? parseFloat(value) || 0 : value,
        });
    };

    const handleAddItem = async () => {
        const newErrors: { [key: string]: string } = {};
        if (!newItem.name.trim()) newErrors.name = 'Item name is required.';
        if (newItem.unitCost <= 0) newErrors.unitCost = 'Unit cost must be a positive number.';
        if (newItem.unitPrice <= 0) newErrors.unitPrice = 'Unit price must be a positive number.';
        if (newItem.quantity < 0) newErrors.quantity = 'Quantity cannot be negative.';
        if (newItem.lowStockThreshold < 0) newErrors.lowStockThreshold = 'Low stock threshold cannot be negative.';
        if (!newItem.supplierId) newErrors.supplierId = 'Please select a supplier.';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        await addInventoryItem(newItem);
        addNotification('Inventory item added successfully!', 'success');
        handleCloseModal();
    };
    
    const handleOpenModal = () => {
      setErrors({});
      setNewItem({ name: '', category: 'Produce', quantity: 0, unit: 'kg', unitCost: 0, unitPrice: 0, supplierId: suppliers[0]?.id || '', lowStockThreshold: 0 });
      setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setErrors({});
    }
    
    const handleEdit = (item: InventoryItem) => {
        setEditingItemId(item.id);
        setEditedCost(item.unitCost);
        setEditedPrice(item.unitPrice);
    };

    const handleCancel = () => setEditingItemId(null);

    const handleSave = async (itemId: string) => {
        if (editedCost <= 0) { alert("Unit cost must be a positive number."); return; }
        if (editedPrice <= 0) { alert("Unit price must be a positive number."); return; }
        const itemToUpdate = inventory.find(i => i.id === itemId);
        if (itemToUpdate) {
            await updateInventoryItem({ ...itemToUpdate, unitCost: editedCost, unitPrice: editedPrice });
            addNotification('Item updated successfully!', 'success');
        }
        setEditingItemId(null);
    };

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
            addNotification(`${result.failedItems.length} items could not be deleted as they are in use.`, 'error');
        }
        setSelectedItems(new Set());
        setIsConfirmDeleteOpen(false);
    };

    const openBulkModal = (action: 'cost' | 'price' | 'supplier') => {
        setBulkActionType(action);
        setBulkValue(action === 'supplier' ? (suppliers[0]?.id || '') : 0);
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
        let update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice' | 'supplierId'>> = {};
        let isValid = true;
        setBulkError('');

        if (bulkActionType === 'cost' || bulkActionType === 'price') {
            const numericValue = Number(bulkValue);
            if (isNaN(numericValue) || numericValue <= 0) {
                setBulkError('Value must be a positive number.');
                isValid = false;
            } else {
                update = bulkActionType === 'cost' ? { unitCost: numericValue } : { unitPrice: numericValue };
            }
        } else if (bulkActionType === 'supplier') {
            if (!bulkValue) {
                setBulkError('Please select a supplier.');
                isValid = false;
            } else {
                update = { supplierId: String(bulkValue) };
            }
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
        const headers = ['name', 'category', 'quantity', 'unit', 'unitCost', 'unitPrice', 'supplierName', 'lowStockThreshold'];
        const dataToExport = inventory.map(item => {
            const supplier = getSupplierById(item.supplierId);
            return {
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                unitCost: item.unitCost,
                unitPrice: item.unitPrice,
                supplierName: supplier ? supplier.name : 'N/A',
                lowStockThreshold: item.lowStockThreshold,
            };
        });
        const csvString = convertToCSV(dataToExport, headers);
        downloadCSV(csvString, 'inventory.csv');
    };

    const parseInventoryFile = async (fileContent: string): Promise<{ data: Omit<InventoryItem, 'id' | 'businessId'>[]; errors: string[] }> => {
        const lines = fileContent.trim().split('\n');
        const headers = lines[0].trim().split(',').map(h => h.replace(/"/g, '').trim());
        const requiredHeaders = ['name', 'category', 'quantity', 'unit', 'unitCost', 'unitPrice', 'supplierName', 'lowStockThreshold'];
        const errors: string[] = [];
        
        requiredHeaders.forEach(h => {
            if (!headers.includes(h)) errors.push(`Missing required header: ${h}`);
        });

        const supplierNameMap = new Map(suppliers.map(s => [s.name.toLowerCase(), s.id]));

        const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const item: any = {};
            headers.forEach((header, i) => item[header] = values[i]);
            
            const supplierId = supplierNameMap.get(String(item.supplierName || '').toLowerCase());
            if (!supplierId) errors.push(`Row ${index + 2}: Supplier "${item.supplierName}" not found. Please add it first.`);

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
                supplierId: supplierId || '',
                lowStockThreshold: parseFloat(item.lowStockThreshold) || 0,
            };
        }).filter(item => item.name && item.supplierId);
        
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
                            onClick={handleOpenModal}
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
                            <button onClick={() => openBulkModal('supplier')} className="text-sm flex items-center bg-[var(--color-sidebar)] border border-[var(--color-border)] px-3 py-1.5 rounded-md hover:bg-[var(--color-border)] text-[var(--color-text-secondary)]"><Truck size={14} className="mr-1.5" /> Update Supplier</button>
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
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Unit Cost</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Unit Price</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Supplier</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Status</th>
                            <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.length > 0 ? inventory.map(item => {
                            const supplier = getSupplierById(item.supplierId);
                            const isLowStock = item.quantity <= item.lowStockThreshold;
                            const isEditing = editingItemId === item.id;

                            return (
                                <tr key={item.id} className={`border-b border-[var(--color-border)] last:border-b-0 transition-colors hover:bg-[var(--color-input)] ${selectedItems.has(item.id) ? 'bg-[var(--color-primary-light)]' : ''}`}>
                                    <td className="p-4 checkbox-cell">
                                        <input type="checkbox" onChange={() => handleSelect(item.id)} checked={selectedItems.has(item.id)} aria-label={`Select ${item.name}`} className="rounded border-gray-400 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                                    </td>
                                    <td data-label="Name" className="p-4 font-medium text-[var(--color-text-primary)] whitespace-nowrap">{item.name}</td>
                                    <td data-label="Category" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{item.category}</td>
                                    <td data-label="Stock" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{item.quantity} {item.unit}</td>
                                    <td data-label="Unit Cost" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">
                                        {isEditing ? (
                                            <input type="number" value={editedCost} onChange={(e) => setEditedCost(parseFloat(e.target.value) || 0)} className="ican-input w-full md:w-24 py-1" autoFocus step="0.01" min="0.01" />
                                        ) : ( formatCurrency(item.unitCost) )}
                                    </td>
                                    <td data-label="Unit Price" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">
                                        {isEditing ? (
                                            <input type="number" value={editedPrice} onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)} className="ican-input w-full md:w-24 py-1" step="0.01" min="0.01" />
                                        ) : ( formatCurrency(item.unitPrice) )}
                                    </td>
                                    <td data-label="Supplier" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{supplier?.name || 'N/A'}</td>
                                    <td data-label="Status" className="p-4">
                                        {isLowStock ? (
                                            <span className="flex items-center text-[var(--color-danger)] bg-red-100 px-2 py-1 rounded-full text-xs font-semibold">
                                                <AlertTriangle size={14} className="mr-1" />Low Stock
                                            </span>
                                        ) : (
                                            <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold">In Stock</span>
                                        )}
                                    </td>
                                    <td data-label="Actions" className="p-4">
                                        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-3">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={() => handleSave(item.id)} className="text-green-500 hover:text-green-600" aria-label="Save cost"><Save size={20} /></button>
                                                    <button onClick={handleCancel} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Cancel edit"><XCircle size={20} /></button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleEdit(item)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]" aria-label="Edit item cost"><Edit size={20} /></button>
                                            )}
                                            <button onClick={() => handleDelete(item.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]" aria-label="Delete item"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={9} className="text-center py-10">
                                     <div className="flex flex-col items-center text-[var(--color-text-muted)]">
                                        <ShoppingCart size={40} className="mb-2 text-[var(--color-border)]"/>
                                        <p className="font-semibold">No inventory items yet</p>
                                        <p className="text-sm">Add your first item to get started.</p>
                                        <button onClick={handleOpenModal} className="mt-4 ican-btn ican-btn-primary">Add Item</button>
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
                templateUrl="data:text/csv;charset=utf-8,name,category,quantity,unit,unitCost,unitPrice,supplierName,lowStockThreshold%0AExample%20Item,Produce,10,kg,5,8,Example%20Supplier,2"
                templateFilename="inventory_template.csv"
                parseFile={parseInventoryFile}
                onImport={handleImport}
                renderPreview={(item: any, index: number) => (
                    <div key={index} className="p-2 text-sm flex justify-between">
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">{item.name}</p>
                            <p className="text-[var(--color-text-muted)]">{item.quantity} {item.unit} from {item.supplierName}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-medium">{formatCurrency(item.unitCost)}</p>
                             <p className="text-xs text-[var(--color-text-muted)]">Unit Cost</p>
                        </div>
                    </div>
                )}
            />
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Inventory Item">
                <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-muted)]">Item Name</label>
                        <input type="text" name="name" id="name" value={newItem.name} onChange={handleInputChange} className={`ican-input mt-1 ${errors.name ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-muted)]">Category</label>
                            <select name="category" id="category" value={newItem.category} onChange={handleInputChange} className="ican-select mt-1">
                                {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="supplierId" className="block text-sm font-medium text-[var(--color-text-muted)]">Supplier</label>
                            <select name="supplierId" id="supplierId" value={newItem.supplierId} onChange={handleInputChange} className={`ican-select mt-1 ${errors.supplierId ? 'border-[var(--color-danger)]' : ''}`}>
                                <option value="" disabled>Select a supplier</option>
                                {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                            </select>
                            {errors.supplierId && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.supplierId}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-[var(--color-text-muted)]">Quantity</label>
                            <input type="number" min="0" name="quantity" id="quantity" value={newItem.quantity} onChange={handleInputChange} className={`ican-input mt-1 ${errors.quantity ? 'border-[var(--color-danger)]' : ''}`} />
                            {errors.quantity && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.quantity}</p>}
                        </div>
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-[var(--color-text-muted)]">Unit</label>
                            <select name="unit" id="unit" value={newItem.unit} onChange={handleInputChange} className="ican-select mt-1">
                                {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="unitCost" className="block text-sm font-medium text-[var(--color-text-muted)]">Unit Cost ({currency})</label>
                            <input type="number" min="0" step="0.01" name="unitCost" id="unitCost" value={newItem.unitCost} onChange={handleInputChange} className={`ican-input mt-1 ${errors.unitCost ? 'border-[var(--color-danger)]' : ''}`} />
                            {errors.unitCost && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.unitCost}</p>}
                        </div>
                        <div>
                            <label htmlFor="unitPrice" className="block text-sm font-medium text-[var(--color-text-muted)]">Unit Price ({currency})</label>
                            <input type="number" min="0" step="0.01" name="unitPrice" id="unitPrice" value={newItem.unitPrice} onChange={handleInputChange} className={`ican-input mt-1 ${errors.unitPrice ? 'border-[var(--color-danger)]' : ''}`} />
                            {errors.unitPrice && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.unitPrice}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-1">
                        <div>
                            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-[var(--color-text-muted)]">Low Stock Threshold</label>
                            <input type="number" min="0" name="lowStockThreshold" id="lowStockThreshold" value={newItem.lowStockThreshold} onChange={handleInputChange} className={`ican-input mt-1 ${errors.lowStockThreshold ? 'border-[var(--color-danger)]' : ''}`} />
                            {errors.lowStockThreshold && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.lowStockThreshold}</p>}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                        <button onClick={handleCloseModal} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button onClick={handleAddItem} className="ican-btn ican-btn-primary w-full md:w-auto">Add Item</button>
                    </div>
                </div>
            </Modal>
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
                    {bulkActionType === 'supplier' && (
                         <div>
                            <label htmlFor="bulkSupplier" className="block text-sm font-medium text-[var(--color-text-muted)]">New Supplier</label>
                            <select id="bulkSupplier" value={bulkValue} onChange={e => setBulkValue(e.target.value)} className={`ican-select mt-1 ${bulkError ? 'border-[var(--color-danger)]' : ''}`}>
                                {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                            </select>
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

export default Inventory;