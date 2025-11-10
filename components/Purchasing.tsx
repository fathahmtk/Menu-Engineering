

import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Eye, CheckCircle, XCircle, Trash2, Plus, Package } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '../types';

const StatusBadge: React.FC<{ status: PurchaseOrder['status'] }> = ({ status }) => {
    const config = {
        Pending: 'bg-amber-100 text-amber-800',
        Completed: 'bg-emerald-100 text-emerald-800',
        Cancelled: 'bg-rose-100 text-rose-800',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config[status]}`}>{status}</span>;
};

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
                    <button onClick={handleOpenFormModal} className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <PlusCircle size={20} className="mr-2" />
                        Create PO
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">PO #</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Supplier</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Order Date</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Total</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Status</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseOrders.map(order => (
                                <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-accent">
                                    <td className="p-4 font-medium text-primary">#{order.id.slice(-6).toUpperCase()}</td>
                                    <td className="p-4 text-foreground">{getSupplierById(order.supplierId)?.name || 'N/A'}</td>
                                    <td className="p-4 text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="p-4 text-muted-foreground">{formatCurrency(order.totalCost)}</td>
                                    <td className="p-4"><StatusBadge status={order.status} /></td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => handleViewDetails(order)} className="text-muted-foreground hover:text-foreground" title="View Details"><Eye size={20} /></button>
                                            {order.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(order.id, 'Completed')} className="text-emerald-500 hover:text-emerald-700" title="Mark as Completed"><CheckCircle size={20} /></button>
                                                    <button onClick={() => handleStatusChange(order.id, 'Cancelled')} className="text-rose-500 hover:text-rose-700" title="Cancel Order"><XCircle size={20} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {purchaseOrders.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            <Package size={40} className="mx-auto mb-2 text-border"/>
                            <p>No purchase orders found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            </Card>

            <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title="Create New Purchase Order">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground">Supplier</label>
                        <select
                            value={newPoData.supplierId}
                            onChange={(e) => setNewPoData({ ...newPoData, supplierId: e.target.value })}
                            className="w-full mt-1 border rounded-md p-2 bg-background border-input focus:ring-1 focus:ring-ring"
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
                                        className="w-full border rounded-md p-2 bg-background border-input focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="" disabled>Select item</option>
                                        {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                                    </select>
                                    <input type="number" value={item.quantity} min="1" onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full border rounded-md p-2 border-input focus:ring-1 focus:ring-ring" />
                                    <input type="number" value={item.cost} min="0" step="0.01" onChange={(e) => handleItemChange(index, 'cost', e.target.value)} className="w-full border rounded-md p-2 border-input focus:ring-1 focus:ring-ring" />
                                    <button onClick={() => handleRemoveItem(index)} className="text-destructive/80 hover:text-destructive"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAddItem} className="text-sm text-primary mt-2 flex items-center"><Plus size={16} className="mr-1"/> Add Item</button>
                    </div>
                    <div className="text-right font-bold text-lg pt-4 border-t border-border">
                        Total: {formatCurrency(newPoTotal)}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCloseFormModal} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">Cancel</button>
                        <button onClick={handleSubmitNewPO} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Create Order</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Details for PO #${selectedOrder?.id.slice(-6).toUpperCase()}`}>
                {selectedOrder && (
                    <div className="space-y-4">
                        <p><strong>Supplier:</strong> {getSupplierById(selectedOrder.supplierId)?.name}</p>
                        <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> <StatusBadge status={selectedOrder.status} /></p>
                        {selectedOrder.completionDate && <p><strong>Completion Date:</strong> {new Date(selectedOrder.completionDate).toLocaleDateString()}</p>}
                        <h4 className="font-semibold pt-2 border-t border-border">Items</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {selectedOrder.items.map(item => {
                                const invItem = inventory.find(i => i.id === item.itemId);
                                return <li key={item.itemId}>{item.quantity} x {invItem?.name || 'N/A'} @ {formatCurrency(item.cost)} each</li>
                            })}
                        </ul>
                         <div className="text-right font-bold text-lg pt-2 border-t border-border">
                            Total: {formatCurrency(selectedOrder.totalCost)}
                        </div>
                         <div className="flex justify-end pt-4">
                            <button onClick={() => setIsDetailsModalOpen(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
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
                confirmButtonClass={confirmationAction?.status === 'Completed' ? 'bg-emerald-600 hover:bg-emerald-700' : confirmationAction?.status === 'Cancelled' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90' }
            />
        </>
    );
};

export default Purchasing;