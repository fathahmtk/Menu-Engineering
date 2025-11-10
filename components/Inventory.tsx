
import React, { useState } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { AlertTriangle, PlusCircle, Edit, Save, XCircle, Trash2, Edit2, DollarSign, Truck } from 'lucide-react';
import { InventoryItem } from '../types';

const ITEM_CATEGORIES: InventoryItem['category'][] = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Bakery', 'Beverages', 'Seafood'];
const ITEM_UNITS: InventoryItem['unit'][] = ['kg', 'g', 'L', 'ml', 'unit', 'dozen'];

const Inventory: React.FC = () => {
    const { inventory, getSupplierById, suppliers, addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkUpdateInventoryItems, bulkDeleteInventoryItems } = useData();
    const { formatCurrency, currency } = useCurrency();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
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

    // State for inline editing
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedCost, setEditedCost] = useState<number>(0);
    const [editedPrice, setEditedPrice] = useState<number>(0);

    // State for bulk actions
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState<'cost' | 'price' | 'supplier' | null>(null);
    const [bulkValue, setBulkValue] = useState<string | number>('');
    const [bulkError, setBulkError] = useState('');
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [deletionResult, setDeletionResult] = useState<{ deletedCount: number; failedItems: string[] } | null>(null);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['quantity', 'unitCost', 'unitPrice', 'lowStockThreshold'].includes(name);
        setNewItem({
            ...newItem,
            [name]: isNumberField ? parseFloat(value) || 0 : value,
        });
    };

    const handleAddItem = () => {
        const newErrors: { [key: string]: string } = {};
        if (!newItem.name.trim()) newErrors.name = 'Item name is required.';
        if (newItem.unitCost <= 0) newErrors.unitCost = 'Unit cost must be a positive number.';
        if (newItem.unitPrice <= 0) newErrors.unitPrice = 'Unit price must be a positive number.';
        if (newItem.quantity < 0) newErrors.quantity = 'Quantity cannot be negative.';
        if (newItem.lowStockThreshold < 0) newErrors.lowStockThreshold = 'Low stock threshold cannot be negative.';
        if (!newItem.supplierId) newErrors.supplierId = 'Please select a supplier.';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        addInventoryItem(newItem);
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

    const handleSave = (itemId: string) => {
        if (editedCost <= 0) { alert("Unit cost must be a positive number."); return; }
        if (editedPrice <= 0) { alert("Unit price must be a positive number."); return; }
        const itemToUpdate = inventory.find(i => i.id === itemId);
        if (itemToUpdate) updateInventoryItem({ ...itemToUpdate, unitCost: editedCost, unitPrice: editedPrice });
        setEditingItemId(null);
    };

    const handleDelete = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) deleteInventoryItem(itemId);
    };

    // Bulk action handlers
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

    const handleConfirmBulkDelete = () => {
        const result = bulkDeleteInventoryItems(Array.from(selectedItems));
        setDeletionResult(result);
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

    const handleBulkUpdate = () => {
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
            bulkUpdateInventoryItems(Array.from(selectedItems), update);
            setSelectedItems(new Set());
            closeBulkModal();
        }
    };

    const isAllSelected = inventory.length > 0 && selectedItems.size === inventory.length;

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Inventory List</h2>
                    <button 
                        onClick={handleOpenModal}
                        className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        <PlusCircle size={20} className="mr-2" />
                        Add Item
                    </button>
                </div>

                {selectedItems.size > 0 && (
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg mb-4 flex items-center justify-between flex-wrap gap-2">
                        <p className="text-primary font-semibold text-sm">{selectedItems.size} items selected</p>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => openBulkModal('cost')} className="text-sm flex items-center bg-white/50 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-white/80"><DollarSign size={14} className="mr-1.5" /> Update Cost</button>
                            <button onClick={() => openBulkModal('price')} className="text-sm flex items-center bg-white/50 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-white/80"><DollarSign size={14} className="mr-1.5" /> Update Price</button>
                            <button onClick={() => openBulkModal('supplier')} className="text-sm flex items-center bg-white/50 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-white/80"><Truck size={14} className="mr-1.5" /> Update Supplier</button>
                            <button onClick={() => setIsConfirmDeleteOpen(true)} className="text-sm flex items-center bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600"><Trash2 size={14} className="mr-1.5" /> Delete</button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-black/10">
                            <tr>
                                <th className="p-4 w-4">
                                    <input type="checkbox" onChange={handleSelectAll} checked={isAllSelected} aria-label="Select all items" />
                                </th>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold">Stock</th>
                                <th className="p-4 font-semibold">Unit Cost</th>
                                <th className="p-4 font-semibold">Unit Price</th>
                                <th className="p-4 font-semibold">Supplier</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => {
                                const supplier = getSupplierById(item.supplierId);
                                const isLowStock = item.quantity <= item.lowStockThreshold;
                                const isEditing = editingItemId === item.id;

                                return (
                                    <tr key={item.id} className={`border-b border-black/5 last:border-b-0 transition-colors hover:bg-white/20 ${selectedItems.has(item.id) ? 'bg-primary/10' : ''}`}>
                                        <td className="p-4">
                                            <input type="checkbox" onChange={() => handleSelect(item.id)} checked={selectedItems.has(item.id)} aria-label={`Select ${item.name}`} />
                                        </td>
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4 text-text-secondary">{item.category}</td>
                                        <td className="p-4 text-text-secondary">{item.quantity} {item.unit}</td>
                                        <td className="p-4 text-text-secondary">
                                            {isEditing ? (
                                                <input type="number" value={editedCost} onChange={(e) => setEditedCost(parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" autoFocus step="0.01" min="0.01" />
                                            ) : ( formatCurrency(item.unitCost) )}
                                        </td>
                                        <td className="p-4 text-text-secondary">
                                            {isEditing ? (
                                                <input type="number" value={editedPrice} onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" step="0.01" min="0.01" />
                                            ) : ( formatCurrency(item.unitPrice) )}
                                        </td>
                                        <td className="p-4 text-text-secondary">{supplier?.name || 'N/A'}</td>
                                        <td className="p-4">
                                            {isLowStock ? (
                                                <span className="flex items-center text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-semibold">
                                                    <AlertTriangle size={14} className="mr-1" />Low Stock
                                                </span>
                                            ) : (
                                                <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold">In Stock</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => handleSave(item.id)} className="text-green-600 hover:text-green-800" aria-label="Save cost"><Save size={20} /></button>
                                                        <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800" aria-label="Cancel edit"><XCircle size={20} /></button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => handleEdit(item)} className="text-primary hover:text-indigo-700" aria-label="Edit item cost"><Edit size={20} /></button>
                                                )}
                                                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700" aria-label="Delete item"><Trash2 size={20} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Inventory Item">
                <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
                        <input type="text" name="name" id="name" value={newItem.name} onChange={handleInputChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                            <select name="category" id="category" value={newItem.category} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Supplier</label>
                            <select name="supplierId" id="supplierId" value={newItem.supplierId} onChange={handleInputChange} className={`mt-1 block w-full px-3 py-2 border bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.supplierId ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="" disabled>Select a supplier</option>
                                {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                            </select>
                            {errors.supplierId && <p className="text-red-500 text-xs mt-1">{errors.supplierId}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input type="number" min="0" name="quantity" id="quantity" value={newItem.quantity} onChange={handleInputChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                        </div>
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                            <select name="unit" id="unit" value={newItem.unit} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                {ITEM_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">Unit Cost ({currency})</label>
                            <input type="number" min="0" step="0.01" name="unitCost" id="unitCost" value={newItem.unitCost} onChange={handleInputChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.unitCost ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.unitCost && <p className="text-red-500 text-xs mt-1">{errors.unitCost}</p>}
                        </div>
                        <div>
                            <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Unit Price ({currency})</label>
                            <input type="number" min="0" step="0.01" name="unitPrice" id="unitPrice" value={newItem.unitPrice} onChange={handleInputChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.unitPrice ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.unitPrice && <p className="text-red-500 text-xs mt-1">{errors.unitPrice}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-1">
                        <div>
                            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                            <input type="number" min="0" name="lowStockThreshold" id="lowStockThreshold" value={newItem.lowStockThreshold} onChange={handleInputChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.lowStockThreshold ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.lowStockThreshold && <p className="text-red-500 text-xs mt-1">{errors.lowStockThreshold}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleAddItem} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">Add Item</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isBulkModalOpen} onClose={closeBulkModal} title={`Bulk Update ${selectedItems.size} Items`}>
                <div className="space-y-4">
                    {bulkActionType === 'cost' && (
                        <div>
                            <label htmlFor="bulkCost" className="block text-sm font-medium text-gray-700">New Unit Cost ({currency})</label>
                            <input type="number" id="bulkCost" value={bulkValue} onChange={e => setBulkValue(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${bulkError ? 'border-red-500' : 'border-gray-300'}`} min="0" step="0.01" autoFocus />
                        </div>
                    )}
                    {bulkActionType === 'price' && (
                        <div>
                            <label htmlFor="bulkPrice" className="block text-sm font-medium text-gray-700">New Unit Price ({currency})</label>
                            <input type="number" id="bulkPrice" value={bulkValue} onChange={e => setBulkValue(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${bulkError ? 'border-red-500' : 'border-gray-300'}`} min="0" step="0.01" autoFocus />
                        </div>
                    )}
                    {bulkActionType === 'supplier' && (
                         <div>
                            <label htmlFor="bulkSupplier" className="block text-sm font-medium text-gray-700">New Supplier</label>
                            <select id="bulkSupplier" value={bulkValue} onChange={e => setBulkValue(e.target.value)} className={`mt-1 block w-full px-3 py-2 border bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${bulkError ? 'border-red-500' : 'border-gray-300'}`}>
                                {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                            </select>
                        </div>
                    )}
                    {bulkError && <p className="text-red-500 text-xs mt-1">{bulkError}</p>}
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={closeBulkModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleBulkUpdate} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">Update Items</button>
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
                            <p className="text-green-600 mb-2">{deletionResult.deletedCount} items were successfully deleted.</p>
                        )}
                        {deletionResult.failedItems.length > 0 && (
                            <div>
                                <p className="text-red-600">Could not delete {deletionResult.failedItems.length} items because they are used in recipes:</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                    {deletionResult.failedItems.map(name => <li key={name}>{name}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setDeletionResult(null)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">
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
