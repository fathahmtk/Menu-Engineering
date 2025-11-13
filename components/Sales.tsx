



import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Trash2, TrendingUp, DollarSign, Receipt, BarChart } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

type SaleItemForm = {
    id: number;
    menuItemId: string;
    quantity: number;
};

const Sales: React.FC = () => {
    const { sales, menuItems, addSale } = useData();
    const { formatCurrency } = useCurrency();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saleItems, setSaleItems] = useState<SaleItemForm[]>([
        { id: Date.now(), menuItemId: menuItems.length > 0 ? menuItems[0].id : '', quantity: 1 }
    ]);
    
    const salesMetrics = useMemo(() => {
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.totalProfit, 0);
        const totalSalesCount = sales.length;
        const averageSaleValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

        return { totalRevenue, totalProfit, totalSalesCount, averageSaleValue };
    }, [sales]);

    const salesChartData = useMemo(() => {
        const salesByDate: { [key: string]: { revenue: number, profit: number } } = {};
        
        sales.forEach(sale => {
            const date = new Date(sale.saleDate).toLocaleDateString('en-CA'); // YYYY-MM-DD for sorting
            if (!salesByDate[date]) {
                salesByDate[date] = { revenue: 0, profit: 0 };
            }
            salesByDate[date].revenue += sale.totalRevenue;
            salesByDate[date].profit += sale.totalProfit;
        });

        return Object.keys(salesByDate)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => ({ 
                date: new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), 
                revenue: salesByDate[date].revenue, 
                profit: salesByDate[date].profit 
            }));

    }, [sales]);
    
    const sortedSales = useMemo(() => [...sales].sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()), [sales]);

    const openModal = () => {
        setSaleItems([{ id: Date.now(), menuItemId: menuItems.length > 0 ? menuItems[0].id : '', quantity: 1 }]);
        setIsModalOpen(true);
    };

    const handleItemChange = (id: number, field: keyof Omit<SaleItemForm, 'id'>, value: string | number) => {
        setSaleItems(currentItems =>
            currentItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const addSaleItem = () => {
        setSaleItems(current => [...current, { id: Date.now(), menuItemId: menuItems.length > 0 ? menuItems[0].id : '', quantity: 1 }]);
    };

    const removeSaleItem = (id: number) => {
        setSaleItems(current => current.filter(item => item.id !== id));
    };

    const modalSaleTotal = useMemo(() => {
        return saleItems.reduce((total, currentItem) => {
            const menuItem = menuItems.find(mi => mi.id === currentItem.menuItemId);
            return total + (menuItem ? menuItem.salePrice * currentItem.quantity : 0);
        }, 0);
    }, [saleItems, menuItems]);

    const handleRecordSale = () => {
        if (saleItems.some(item => !item.menuItemId || item.quantity <= 0)) {
            alert('Please select a valid menu item and quantity for all entries.');
            return;
        }
        
        const itemsToSubmit = saleItems.map(({menuItemId, quantity}) => ({menuItemId, quantity}));
        addSale(itemsToSubmit);
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-[var(--color-primary-light)] rounded-full"><TrendingUp className="text-[var(--color-primary)]" /></div>
                        <div className="ml-4">
                            <p className="text-sm text-[var(--color-text-muted)]">Total Revenue</p>
                            <p className="text-2xl font-bold">{formatCurrency(salesMetrics.totalRevenue)}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full"><DollarSign className="text-green-500" /></div>
                        <div className="ml-4">
                            <p className="text-sm text-[var(--color-text-muted)]">Total Profit</p>
                            <p className="text-2xl font-bold">{formatCurrency(salesMetrics.totalProfit)}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-full"><Receipt className="text-yellow-500" /></div>
                        <div className="ml-4">
                            <p className="text-sm text-[var(--color-text-muted)]">Total Transactions</p>
                            <p className="text-2xl font-bold">{salesMetrics.totalSalesCount}</p>
                        </div>
                    </div>
                </Card>
                 <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-sky-100 rounded-full"><BarChart className="text-sky-500" /></div>
                        <div className="ml-4">
                            <p className="text-sm text-[var(--color-text-muted)]">Avg. Sale Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(salesMetrics.averageSaleValue)}</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <h3 className="text-lg font-semibold mb-4">Sales Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesChartData}>
                            <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--color-text-muted)' }} tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', color: 'var(--color-text-primary)', boxShadow: 'var(--shadow-md)' }}
                                labelStyle={{ color: 'var(--color-text-primary)', fontWeight: '600' }}
                            />
                            <Legend wrapperStyle={{ color: 'var(--color-text-muted)' }} />
                            <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" name="Revenue" strokeWidth={2} />
                            <Line type="monotone" dataKey="profit" stroke="var(--color-success)" name="Profit" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Recent Transactions</h3>
                         <button onClick={openModal} className="ican-btn ican-btn-primary p-2 md:py-1.5 md:px-3 text-sm">
                            <PlusCircle size={16} className="md:mr-2" />
                            <span className="hidden md:inline">Record Sale</span>
                        </button>
                    </div>
                    <div className="overflow-y-auto max-h-[280px]">
                        {sortedSales.length > 0 ? (
                        <ul className="space-y-3">
                            {sortedSales.slice(0, 10).map(sale => {
                                const mainItem = menuItems.find(mi => mi.id === sale.items[0].menuItemId);
                                return (
                                    <li key={sale.id} className="flex justify-between items-center p-2 rounded-md hover:bg-[var(--color-input)]">
                                        <div>
                                            <p className="font-medium text-[var(--color-text-primary)]">{mainItem?.name || 'Unknown Item'} {sale.items.length > 1 ? ` & ${sale.items.length - 1} more` : ''}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">{new Date(sale.saleDate).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(sale.totalRevenue)}</p>
                                            <p className="text-xs text-[var(--color-success)]">Profit: {formatCurrency(sale.totalProfit)}</p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                        ) : (
                             <div className="text-center py-10 text-[var(--color-text-muted)]">
                                <p>No sales recorded yet.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Sale">
                <div className="space-y-4">
                    {saleItems.map((item, index) => (
                         <div key={item.id} className="flex flex-col md:grid md:grid-cols-[1fr,80px,auto] gap-2 md:items-center">
                            <select
                                value={item.menuItemId}
                                onChange={e => handleItemChange(item.id, 'menuItemId', e.target.value)}
                                className="ican-select"
                                disabled={menuItems.length === 0}
                            >
                                {menuItems.length > 0 ? (
                                    menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)
                                ) : (
                                    <option>No menu items available</option>
                                )}
                            </select>
                            <input
                                type="number"
                                value={item.quantity}
                                min="1"
                                onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="ican-input"
                                placeholder="Qty"
                            />
                            <button
                                onClick={() => removeSaleItem(item.id)}
                                disabled={saleItems.length <= 1}
                                className="text-[var(--color-danger)]/80 hover:text-[var(--color-danger)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed md:justify-self-center"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addSaleItem} className="text-sm text-[var(--color-primary)] flex items-center font-semibold">
                        <PlusCircle size={16} className="mr-1" /> Add another item
                    </button>
                    <div className="text-right font-bold text-lg pt-4 border-t border-[var(--color-border)]">
                        Total: {formatCurrency(modalSaleTotal)}
                    </div>
                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                        <button onClick={() => setIsModalOpen(false)} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button onClick={handleRecordSale} className="ican-btn ican-btn-primary w-full md:w-auto">Record Sale</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Sales;
