
import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Eye, CheckCircle, XCircle, Trash2, Plus, Package } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '../types';

// Helper component for status badges
const StatusBadge: React.FC<{ status: PurchaseOrder['status'] }> = ({ status }) => {
    const config = {
        Pending: 'bg-yellow-100 text-yellow-700',
        Completed: 'bg-green-100 text-green-700',
        Cancelled: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config[status]}`}>{status}</span>;
};

// FIX: Define a local type for the form state to avoid TS inference issues.
type NewPOItem = {
    itemId: string | null;
    quantity: number;
    cost: number;
};

const Purchasing: React.FC = () => {
    const { purchaseOrders, suppliers, inventory, getSupplierById, addPurchaseOrder, updatePurchaseOrderStatus } = useData();
    const { formatCurrency } = useCurrency();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [confirmationAction, setConfirmationAction] = useState<{ id: string, status: PurchaseOrder['status'] } | null>(null);

    // Form state for new PO
    const [newPoData, setNewPoData] = useState<{ supplierId: string; items: NewPOItem[] }>({
        supplierId: suppliers[0]?.id || '',
        items: [{ itemId: null, quantity: 1, cost: 0 }]
    });

    const handleOpenFormModal = () => {
        setNewPoData({
            supplierId: suppliers.length > 0 ? suppliers[0].id : '',
            items: [{ itemId: inventory.length > 0 ? inventory[0].id : null, quantity: 1, cost: inventory.length > 0 ? inventory[0].unitCost : 0 }]
        });
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleViewDetails = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleItemChange = (index: number, field: keyof NewPOItem, value: string) => {
        const newItems = [...newPoData.items];
        const isNumber = field === 'quantity' || field === 'cost';
        (newItems[index] as any)[field] = isNumber ? parseFloat(value) || 0 : value;

        // Auto-update cost when item is selected
        if (field === 'itemId') {
            const selectedItem = inventory.find(i => i.id === value);
            if (selectedItem) newItems[index].cost = selectedItem.unitCost;
        }

        setNewPoData({ ...newPoData, items: newItems });
    };

    const handleAddItem = () => {
        const firstItem = inventory.length > 0 ? inventory[0] : null;
        setNewPoData({
            ...newPoData,
            items: [...newPoData.items, { itemId: firstItem?.id || null, quantity: 1, cost: firstItem?.unitCost || 0 }]
        });
    };

    const handleRemoveItem = (index: number) => {
        setNewPoData({ ...newPoData, items: newPoData.items.filter((_, i) => i !== index) });
    };

    const handleSubmitNewPO = () => {
        // Validation
        if (!newPoData.supplierId || newPoData.items.some(i => !i.itemId || i.quantity <= 0 || i.cost < 0)) {
            alert('Please fill all fields correctly. Item quantities must be positive.');
            return;
        }

        const finalItems: PurchaseOrderItem[] = newPoData.items
            .filter((item): item is NewPOItem & { itemId: string } => item.itemId !== null)
            .map(item => ({
                itemId: item.itemId,
                quantity: item.quantity,
                cost: item.cost,
            }));
        
        addPurchaseOrder({ supplierId: newPoData.supplierId, items: finalItems });
        handleCloseFormModal();
    };

    const newPoTotal = useMemo(() => {
        return newPoData.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    }, [newPoData.items]);
    
    const handleStatusChange = (id: string, status: PurchaseOrder['status']) => {
        setConfirmationAction({ id, status });
        setIsConfirmModalOpen(true);
    };
    
    const confirmStatusChange = () => {
        if (confirmationAction) {
            updatePurchaseOrderStatus(confirmationAction.id, confirmationAction.status);
        }
        setIsConfirmModalOpen(false);
        setConfirmationAction(null);
    };


    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Purchase Orders</h2>
                    <button onClick={handleOpenFormModal} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        <PlusCircle size={20} className="mr-2" />
                        Create PO
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-black/10">
                            <tr>
                                <th className="p-4 font-semibold">PO #</th>
                                <th className="p-4 font-semibold">Supplier</th>
                                <th className="p-4 font-semibold">Order Date</th>
                                <th className="p-4 font-semibold">Total</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseOrders.map(order => (
                                <tr key={order.id} className="border-b border-black/5 last:border-b-0 hover:bg-white/20">
                                    <td className="p-4 font-medium text-primary">#{order.id.slice(-6).toUpperCase()}</td>
                                    <td className="p-4">{getSupplierById(order.supplierId)?.name || 'N/A'}</td>
                                    <td className="p-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="p-4">{formatCurrency(order.totalCost)}</td>
                                    <td className="p-4"><StatusBadge status={order.status} /></td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => handleViewDetails(order)} className="text-gray-500 hover:text-gray-800" title="View Details"><Eye size={20} /></button>
                                            {order.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(order.id, 'Completed')} className="text-green-500 hover:text-green-700" title="Mark as Completed"><CheckCircle size={20} /></button>
                                                    <button onClick={() => handleStatusChange(order.id, 'Cancelled')} className="text-red-500 hover:text-red-700" title="Cancel Order"><XCircle size={20} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {purchaseOrders.length === 0 && (
                        <div className="text-center py-10 text-text-secondary">
                            <Package size={40} className="mx-auto mb-2 text-gray-300"/>
                            <p>No purchase orders found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* PO Creation Modal */}
            <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title="Create New Purchase Order">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Supplier</label>
                        <select
                            value={newPoData.supplierId}
                            onChange={(e) => setNewPoData({ ...newPoData, supplierId: e.target.value })}
                            className="w-full mt-1 border rounded-md p-2 bg-white"
                        >
                            {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-2">Items</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {newPoData.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-[1fr,80px,100px,auto] gap-2 items-center">
                                    <select
                                        value={item.itemId || ''}
                                        onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                                        className="w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="" disabled>Select item</option>
                                        {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                                    </select>
                                    <input type="number" value={item.quantity} min="1" onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full border rounded-md p-2" />
                                    <input type="number" value={item.cost} min="0" step="0.01" onChange={(e) => handleItemChange(index, 'cost', e.target.value)} className="w-full border rounded-md p-2" />
                                    <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAddItem} className="text-sm text-primary mt-2 flex items-center"><Plus size={16} className="mr-1"/> Add Item</button>
                    </div>
                    <div className="text-right font-bold text-lg pt-4 border-t">
                        Total: {formatCurrency(newPoTotal)}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCloseFormModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSubmitNewPO} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">Create Order</button>
                    </div>
                </div>
            </Modal>

            {/* PO Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Details for PO #${selectedOrder?.id.slice(-6).toUpperCase()}`}>
                {selectedOrder && (
                    <div className="space-y-4">
                        <p><strong>Supplier:</strong> {getSupplierById(selectedOrder.supplierId)?.name}</p>
                        <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> <StatusBadge status={selectedOrder.status} /></p>
                        {selectedOrder.completionDate && <p><strong>Completion Date:</strong> {new Date(selectedOrder.completionDate).toLocaleDateString()}</p>}
                        <h4 className="font-semibold pt-2 border-t">Items</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {selectedOrder.items.map(item => {
                                const invItem = inventory.find(i => i.id === item.itemId);
                                return <li key={item.itemId}>{item.quantity} x {invItem?.name || 'N/A'} @ {formatCurrency(item.cost)} each</li>
                            })}
                        </ul>
                         <div className="text-right font-bold text-lg pt-2 border-t">
                            Total: {formatCurrency(selectedOrder.totalCost)}
                        </div>
                         <div className="flex justify-end pt-4">
                            <button onClick={() => setIsDetailsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmStatusChange}
                title="Confirm Action"
                message={`Are you sure you want to mark this order as ${confirmationAction?.status}? ${confirmationAction?.status === 'Completed' ? 'This will update your inventory stock levels.' : ''}`}
                confirmText="Yes, Confirm"
                confirmButtonClass={confirmationAction?.status === 'Completed' ? 'bg-green-600 hover:bg-green-700' : confirmationAction?.status === 'Cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-indigo-700' }
            />
        </>
    );
};

export default Purchasing;
