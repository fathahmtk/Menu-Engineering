

import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Eye, CheckCircle, XCircle, Trash2, Plus, Package } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '../types';
import { useNotification } from '../hooks/useNotificationContext';

const StatusBadge: React.FC<{ status: PurchaseOrder['status'] }> = ({ status }) => {
    const config = {
        Pending: 'bg-yellow-100 text-yellow-700',
        Completed: 'bg-green-100 text-green-700',
        Cancelled: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config[status]}`}>{status}</span>;
};

type NewPOItem = {
    itemId: string | null;
    quantity: number;
    cost: number;
};

const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
};

const Purchasing: React.FC = () => {
    const { purchaseOrders, suppliers, inventory, getSupplierById, addPurchaseOrder, updatePurchaseOrderStatus } = useData();
    const { formatCurrency } = useCurrency();
    const { addNotification } = useNotification();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [confirmationAction, setConfirmationAction] = useState<{ id: string, status: PurchaseOrder['status'] } | null>(null);

    const [newPoData, setNewPoData] = useState<{ supplierId: string; items: NewPOItem[], dueDate: string }>({
        supplierId: suppliers[0]?.id || '',
        items: [{ itemId: null, quantity: 1, cost: 0 }],
        dueDate: getDefaultDueDate(),
    });

    const handleOpenFormModal = () => {
        setNewPoData({
            supplierId: suppliers.length > 0 ? suppliers[0].id : '',
            items: [{ itemId: inventory.length > 0 ? inventory[0].id : null, quantity: 1, cost: inventory.length > 0 ? inventory[0].unitCost : 0 }],
            dueDate: getDefaultDueDate()
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

    const handleSubmitNewPO = async () => {
        if (!newPoData.supplierId || !newPoData.dueDate || newPoData.items.some(i => !i.itemId || i.quantity <= 0 || i.cost < 0)) {
            alert('Please fill all fields correctly. Due date is required and item quantities must be positive.');
            return;
        }

        const finalItems: PurchaseOrderItem[] = newPoData.items
            .filter((item): item is NewPOItem & { itemId: string } => item.itemId !== null)
            .map(item => ({
                itemId: item.itemId,
                quantity: item.quantity,
                cost: item.cost,
            }));
        
        await addPurchaseOrder({ supplierId: newPoData.supplierId, items: finalItems, dueDate: newPoData.dueDate });
        addNotification('Purchase Order created successfully!', 'success');
        handleCloseFormModal();
    };

    const newPoTotal = useMemo(() => {
        return newPoData.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    }, [newPoData.items]);
    
    const handleStatusChange = (id: string, status: PurchaseOrder['status']) => {
        setConfirmationAction({ id, status });
        setIsConfirmModalOpen(true);
    };
    
    const confirmStatusChange = async () => {
        if (confirmationAction) {
            await updatePurchaseOrderStatus(confirmationAction.id, confirmationAction.status);
            addNotification(`Order status updated to ${confirmationAction.status}.`, 'success');
        }
        setIsConfirmModalOpen(false);
        setConfirmationAction(null);
    };


    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Purchase Orders</h2>
                    <button onClick={handleOpenFormModal} className="ican-btn ican-btn-primary p-2 md:px-4 md:py-2">
                        <PlusCircle size={20} className="md:mr-2" />
                        <span className="hidden md:inline">Create PO</span>
                    </button>
                </div>
                <div className="overflow-x-auto md:overflow-visible">
                    <table className="w-full text-left responsive-table">
                        <thead className="ican-table-header">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">PO #</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Supplier</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Order Date</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Due Date</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Total</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Status</th>
                                <th className="p-4 font-semibold text-sm text-[var(--color-text-muted)] whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseOrders.map(order => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isOverdue = order.status === 'Pending' && order.dueDate && new Date(order.dueDate) < today;

                                return (
                                <tr key={order.id} className={`border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-input)] ${isOverdue ? 'bg-red-500/10' : ''}`}>
                                    <td data-label="PO #" className="p-4 font-medium text-[var(--color-primary)] whitespace-nowrap">#{order.id.slice(-6).toUpperCase()}</td>
                                    <td data-label="Supplier" className="p-4 text-[var(--color-text-primary)] whitespace-nowrap">{getSupplierById(order.supplierId)?.name || 'N/A'}</td>
                                    <td data-label="Order Date" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td data-label="Due Date" className={`p-4 text-[var(--color-text-muted)] whitespace-nowrap ${isOverdue ? 'font-bold text-[var(--color-danger)]' : ''}`}>
                                        {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td data-label="Total" className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">{formatCurrency(order.totalCost)}</td>
                                    <td data-label="Status" className="p-4"><StatusBadge status={order.status} /></td>
                                    <td data-label="Actions" className="p-4">
                                        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-3">
                                            <button onClick={() => handleViewDetails(order)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" title="View Details"><Eye size={20} /></button>
                                            {order.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(order.id, 'Completed')} className="text-green-500 hover:opacity-80" title="Mark as Completed"><CheckCircle size={20} /></button>
                                                    <button onClick={() => handleStatusChange(order.id, 'Cancelled')} className="text-[var(--color-danger)] hover:opacity-80" title="Cancel Order"><XCircle size={20} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {purchaseOrders.length === 0 && (
                        <div className="text-center py-10 text-[var(--color-text-muted)]">
                            <Package size={40} className="mx-auto mb-2 text-[var(--color-border)]"/>
                            <p>No purchase orders found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            </Card>

            <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title="Create New Purchase Order">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)]">Supplier</label>
                            <select
                                value={newPoData.supplierId}
                                onChange={(e) => setNewPoData({ ...newPoData, supplierId: e.target.value })}
                                className="ican-select mt-1"
                            >
                                {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-[var(--color-text-muted)]">Due Date</label>
                            <input
                                type="date"
                                id="dueDate"
                                value={newPoData.dueDate}
                                onChange={(e) => setNewPoData({ ...newPoData, dueDate: e.target.value })}
                                className="ican-input mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium mb-2 text-[var(--color-text-muted)]">Items</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {newPoData.items.map((item, index) => (
                                <div key={index} className="flex flex-col md:grid md:grid-cols-[1fr,80px,100px,auto] gap-2 md:items-center border border-transparent md:border-0 rounded-md p-2 md:p-0">
                                    <select
                                        value={item.itemId || ''}
                                        onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                                        className="ican-select"
                                    >
                                        <option value="" disabled>Select item</option>
                                        {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                                    </select>
                                    <input type="number" placeholder="Qty" value={item.quantity} min="1" onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="ican-input" />
                                    <input type="number" placeholder="Cost" value={item.cost} min="0" step="0.01" onChange={(e) => handleItemChange(index, 'cost', e.target.value)} className="ican-input" />
                                    <button onClick={() => handleRemoveItem(index)} className="text-[var(--color-danger)]/80 hover:text-[var(--color-danger)] md:justify-self-center"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAddItem} className="text-sm text-[var(--color-primary)] mt-2 flex items-center font-semibold"><Plus size={16} className="mr-1"/> Add Item</button>
                    </div>
                    <div className="text-right font-bold text-lg pt-4 border-t border-[var(--color-border)]">
                        Total: {formatCurrency(newPoTotal)}
                    </div>
                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                        <button onClick={handleCloseFormModal} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button onClick={handleSubmitNewPO} className="ican-btn ican-btn-primary w-full md:w-auto">Create Order</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Details for PO #${selectedOrder?.id.slice(-6).toUpperCase()}`}>
                {selectedOrder && (
                    <div className="space-y-4">
                        <p><strong>Supplier:</strong> {getSupplierById(selectedOrder.supplierId)?.name}</p>
                        <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                        {selectedOrder.dueDate && <p><strong>Due Date:</strong> {new Date(selectedOrder.dueDate).toLocaleDateString()}</p>}
                        <p><strong>Status:</strong> <StatusBadge status={selectedOrder.status} /></p>
                        {selectedOrder.completionDate && <p><strong>Completion Date:</strong> {new Date(selectedOrder.completionDate).toLocaleDateString()}</p>}
                        <h4 className="font-semibold pt-2 border-t border-[var(--color-border)]">Items</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {selectedOrder.items.map(item => {
                                const invItem = inventory.find(i => i.id === item.itemId);
                                return <li key={item.itemId}>{item.quantity} x {invItem?.name || 'N/A'} @ {formatCurrency(item.cost)} each</li>
                            })}
                        </ul>
                         <div className="text-right font-bold text-lg pt-2 border-t border-[var(--color-border)]">
                            Total: {formatCurrency(selectedOrder.totalCost)}
                        </div>
                         <div className="flex justify-end pt-4">
                            <button onClick={() => setIsDetailsModalOpen(false)} className="ican-btn ican-btn-secondary">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmStatusChange}
                title="Confirm Action"
                message={`Are you sure you want to mark this order as ${confirmationAction?.status}? ${confirmationAction?.status === 'Completed' ? 'This will update your inventory stock levels.' : ''}`}
                confirmText="Yes, Confirm"
                confirmButtonClass={confirmationAction?.status === 'Completed' ? 'ican-btn bg-[var(--color-success)] text-white hover:opacity-90' : confirmationAction?.status === 'Cancelled' ? 'ican-btn ican-btn-danger' : 'ican-btn ican-btn-primary' }
            />
        </>
    );
};

export default Purchasing;