import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useAuth } from '../hooks/useAuthContext';
import { useTheme } from '../hooks/useTheme';
import { useAppSettings } from '../hooks/useAppSettings';
import { useCurrency } from '../hooks/useCurrencyContext';
import { useNotification } from '../hooks/useNotificationContext';
import { Business, RecipeCategory, IngredientUnit, UnitConversion, StaffMember, Overhead, AppSettings } from '../types';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { Edit3, Trash2, Sun, Moon, AlertTriangle, Building, Settings as SettingsIcon, Database, List, DollarSign, PlusCircle, BarChart3 } from 'lucide-react';

const TABS = [
  { id: 'business', label: 'Business Details', icon: <Building size={18} /> },
  { id: 'financials', label: 'Financials', icon: <DollarSign size={18} /> },
  { id: 'preferences', label: 'Preferences', icon: <SettingsIcon size={18} /> },
  { id: 'data', label: 'Data Management', icon: <Database size={18} /> },
  { id: 'lists', label: 'Manage Lists', icon: <List size={18} /> },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('business');
    const { businesses, activeBusinessId, updateBusiness } = useData();
    const { addNotification } = useNotification();
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    const activeBusiness = businesses.find(b => b.id === activeBusinessId);

    const handleResetData = () => {
        localStorage.clear();
        window.location.reload();
    };
    
    const handleExportData = () => {
        const dataToExport = {
            businesses,
            // In a real app, you would export all other relevant data from useData here
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `ican_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addNotification("Data exported successfully!", "success");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
                <Card noPadding>
                    <div className="p-4">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">Manage your application.</p>
                    </div>
                    <nav className="p-2">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center text-left p-3 my-1 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold' : 'hover:bg-[var(--color-input)] text-[var(--color-text-secondary)]'}`}
                            >
                                {tab.icon}
                                <span className="ml-3">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </Card>
            </div>

            <div className="lg:col-span-3">
                <Card>
                    {activeTab === 'business' && <BusinessDetailsTab business={activeBusiness} updateBusiness={updateBusiness} addNotification={addNotification} />}
                    {activeTab === 'financials' && <FinancialsTab />}
                    {activeTab === 'preferences' && <PreferencesTab />}
                    {activeTab === 'data' && <DataManagementTab onExport={handleExportData} onReset={() => setIsResetConfirmOpen(true)} />}
                    {activeTab === 'lists' && <ManageListsTab />}
                </Card>
            </div>

            <ConfirmationModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={handleResetData}
                title="Confirm Application Reset"
                message="Are you sure you want to reset all application data? This action is irreversible and will delete all businesses, recipes, and other data."
                confirmText="Yes, Reset Everything"
            />
        </div>
    );
};


const BusinessDetailsTab: React.FC<{ business?: Business, updateBusiness: (b: Business) => void, addNotification: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ business, updateBusiness, addNotification }) => {
    const [formData, setFormData] = useState<Business | null>(null);

    useEffect(() => {
        if (business) {
            setFormData(JSON.parse(JSON.stringify(business)));
        }
    }, [business]);

    if (!formData) return <div>Loading...</div>;

    const isDirty = JSON.stringify(business) !== JSON.stringify(formData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        updateBusiness(formData);
        addNotification("Business details updated!", "success");
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold">Business Details</h3>
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)]">Business Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="ican-input mt-1" />
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)]">Address</label>
                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="ican-input mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Contact Phone</label>
                    <input type="tel" name="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} className="ican-input mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Tax ID / VAT Number</label>
                    <input type="text" name="taxId" value={formData.taxId || ''} onChange={handleChange} className="ican-input mt-1" />
                </div>
            </div>
             <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={!isDirty} className={`ican-btn ican-btn-primary ${!isDirty ? 'ican-btn-disabled' : ''}`}>Save Changes</button>
            </div>
        </div>
    );
};

const FinancialsTab: React.FC = () => {
    const { settings, updateSettings } = useAppSettings();
    const { staffMembers, addStaffMember, updateStaffMember, deleteStaffMember, overheads, addOverhead, updateOverhead, deleteOverhead } = useData();
    const { formatCurrency } = useCurrency();
    const { addNotification } = useNotification();
    
    const [isStaffModalOpen, setStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

    const [isOverheadModalOpen, setOverheadModalOpen] = useState(false);
    const [editingOverhead, setEditingOverhead] = useState<Overhead | null>(null);

    const handleMetricChange = (field: keyof AppSettings, value: string) => {
        updateSettings({ [field]: Number(value) || 0 });
    };

    // Labour Cost calculations
    const totalMonthlySalary = useMemo(() => staffMembers.reduce((sum, s) => sum + s.monthlySalary, 0), [staffMembers]);
    const totalMonthlyHours = settings.workingDaysPerMonth * settings.hoursPerDay;
    const blendedRatePerHour = totalMonthlyHours > 0 ? totalMonthlySalary / totalMonthlyHours : 0;

    // Overhead Cost calculations
    const totalVOH = useMemo(() => overheads.filter(o => o.type === 'Variable').reduce((sum, o) => sum + o.monthlyCost, 0), [overheads]);
    const totalFOH = useMemo(() => overheads.filter(o => o.type === 'Fixed').reduce((sum, o) => sum + o.monthlyCost, 0), [overheads]);
    const vohPerDish = settings.totalDishesProduced > 0 ? totalVOH / settings.totalDishesProduced : 0;
    const fohPerDish = settings.totalDishesSold > 0 ? totalFOH / settings.totalDishesSold : 0;

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold">Financials & Costing Parameters</h3>
            
            {/* Labour Section */}
            <div className="p-4 border border-[var(--color-border)] rounded-lg space-y-6">
                <h4 className="text-lg font-semibold">Labour Configuration</h4>
                
                <div>
                    <h5 className="font-semibold text-[var(--color-text-secondary)]">Working Schedule</h5>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">Set the standard monthly working schedule for your business. This is used to calculate the blended labour rate.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Working Days / Month</label>
                            <input type="number" value={settings.workingDaysPerMonth} onChange={e => handleMetricChange('workingDaysPerMonth', e.target.value)} className="ican-input mt-1"/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Hours / Day</label>
                            <input type="number" value={settings.hoursPerDay} onChange={e => handleMetricChange('hoursPerDay', e.target.value)} className="ican-input mt-1"/>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h5 className="font-semibold text-[var(--color-text-secondary)]">Staff Members</h5>
                        <button onClick={() => { setEditingStaff(null); setStaffModalOpen(true); }} className="ican-btn ican-btn-secondary py-1 px-2 text-sm"><PlusCircle size={16}/></button>
                    </div>
                    <div className="bg-[var(--color-input)] rounded-lg p-2 max-h-48 overflow-y-auto">
                        {staffMembers.map(staff => (
                            <div key={staff.id} className="flex justify-between items-center p-2 hover:bg-[var(--color-border)] rounded-md">
                                <div>
                                    <p className="font-medium">{staff.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{formatCurrency(staff.monthlySalary)}/month</p>
                                </div>
                                <div className="space-x-1">
                                    <button onClick={() => { setEditingStaff(staff); setStaffModalOpen(true);}} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"><Edit3 size={16} /></button>
                                    <button onClick={() => deleteStaffMember(staff.id)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[var(--color-input)] p-4 rounded-lg space-y-3">
                    <h5 className="font-semibold text-[var(--color-text-secondary)] mb-2">Labour Cost Analysis</h5>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="text-[var(--color-text-muted)]">Total Monthly Labour Cost:</div>
                        <div className="font-semibold text-right">{formatCurrency(totalMonthlySalary)}</div>
                        <div className="text-[var(--color-text-muted)]">Total Monthly Hours:</div>
                        <div className="font-semibold text-right">{totalMonthlyHours.toLocaleString()} hrs</div>
                        <div className="text-[var(--color-text-muted)] font-bold text-[var(--color-text-primary)] border-t border-[var(--color-border)] pt-2 mt-1 col-span-2 flex justify-between items-center">
                            <span>Blended Labour Rate / Hour:</span>
                            <span className="font-bold text-base text-[var(--color-primary)]">{formatCurrency(blendedRatePerHour)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overhead Section */}
            <div className="p-4 border border-[var(--color-border)] rounded-lg space-y-6">
                <h4 className="text-lg font-semibold">Overhead Configuration</h4>
                
                <div>
                    <h5 className="font-semibold text-[var(--color-text-secondary)]">Production & Sales Volume</h5>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">These volumes are used to allocate overhead costs to each dish.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Total Dishes Produced / Month</label>
                            <input type="number" value={settings.totalDishesProduced} onChange={e => handleMetricChange('totalDishesProduced', e.target.value)} className="ican-input mt-1"/>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Total Dishes Sold / Month</label>
                            <input type="number" value={settings.totalDishesSold} onChange={e => handleMetricChange('totalDishesSold', e.target.value)} className="ican-input mt-1"/>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h5 className="font-semibold text-[var(--color-text-secondary)]">Overhead Items</h5>
                        <button onClick={() => { setEditingOverhead(null); setOverheadModalOpen(true); }} className="ican-btn ican-btn-secondary py-1 px-2 text-sm"><PlusCircle size={16}/></button>
                    </div>
                     <div className="bg-[var(--color-input)] rounded-lg p-2 max-h-48 overflow-y-auto">
                        {overheads.map(o => (
                            <div key={o.id} className="flex justify-between items-center p-2 hover:bg-[var(--color-border)] rounded-md">
                                <div>
                                    <p className="font-medium">{o.name} <span className="text-xs text-[var(--color-text-muted)]">({o.type})</span></p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{formatCurrency(o.monthlyCost)}/month</p>
                                </div>
                                <div className="space-x-1">
                                    <button onClick={() => { setEditingOverhead(o); setOverheadModalOpen(true);}} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"><Edit3 size={16} /></button>
                                    <button onClick={() => deleteOverhead(o.id)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[var(--color-input)] p-4 rounded-lg space-y-3">
                    <h5 className="font-semibold text-[var(--color-text-secondary)] mb-2">Overhead Cost Analysis</h5>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="text-[var(--color-text-muted)]">Total Variable Overheads:</div>
                        <div className="font-semibold text-right">{formatCurrency(totalVOH)}</div>
                        <div className="text-[var(--color-text-muted)]">VOH Cost per Produced Dish:</div>
                        <div className="font-semibold text-right">{formatCurrency(vohPerDish)}</div>
                        
                        <div className="text-[var(--color-text-muted)] pt-2 mt-1 border-t border-[var(--color-border)]">Total Fixed Overheads:</div>
                        <div className="font-semibold text-right pt-2 mt-1 border-t border-[var(--color-border)]">{formatCurrency(totalFOH)}</div>
                        <div className="text-[var(--color-text-muted)]">FOH Cost per Sold Dish:</div>
                        <div className="font-semibold text-right">{formatCurrency(fohPerDish)}</div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <StaffFormModal 
                isOpen={isStaffModalOpen} 
                onClose={() => setStaffModalOpen(false)}
                onSave={async (data) => {
                    if(editingStaff) {
                        await updateStaffMember({ ...editingStaff, ...data });
                        addNotification("Staff member updated.", "success");
                    } else {
                        await addStaffMember(data);
                        addNotification("Staff member added.", "success");
                    }
                    setStaffModalOpen(false);
                }}
                staffMember={editingStaff}
            />
            <OverheadFormModal
                isOpen={isOverheadModalOpen}
                onClose={() => setOverheadModalOpen(false)}
                onSave={async (data) => {
                     if(editingOverhead) {
                        await updateOverhead({ ...editingOverhead, ...data });
                        addNotification("Overhead updated.", "success");
                    } else {
                        await addOverhead(data);
                        addNotification("Overhead added.", "success");
                    }
                    setOverheadModalOpen(false);
                }}
                overhead={editingOverhead}
            />
        </div>
    );
};

const StaffFormModal: React.FC<{isOpen: boolean, onClose: ()=>void, onSave: (data:Omit<StaffMember, 'id'|'businessId'>)=>void, staffMember: StaffMember|null}> = ({isOpen, onClose, onSave, staffMember}) => {
    const [name, setName] = useState('');
    const [monthlySalary, setMonthlySalary] = useState(0);

    useEffect(() => {
        if(isOpen) {
            setName(staffMember?.name || '');
            setMonthlySalary(staffMember?.monthlySalary || 0);
        }
    }, [isOpen, staffMember]);
    
    const handleSubmit = () => {
        if(name.trim() && monthlySalary > 0) {
            onSave({name, monthlySalary});
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={staffMember ? "Edit Staff Member" : "Add Staff Member"}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Staff Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="ican-input mt-1"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Monthly Salary</label>
                    <input type="number" value={monthlySalary} onChange={e => setMonthlySalary(Number(e.target.value))} className="ican-input mt-1"/>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button onClick={onClose} className="ican-btn ican-btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} className="ican-btn ican-btn-primary">Save</button>
                </div>
            </div>
        </Modal>
    );
};

const OverheadFormModal: React.FC<{isOpen: boolean, onClose: ()=>void, onSave: (data:Omit<Overhead, 'id'|'businessId'>)=>void, overhead: Overhead|null}> = ({isOpen, onClose, onSave, overhead}) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'Fixed'|'Variable'>('Fixed');
    const [monthlyCost, setMonthlyCost] = useState(0);

    useEffect(() => {
        if(isOpen) {
            setName(overhead?.name || '');
            setType(overhead?.type || 'Fixed');
            setMonthlyCost(overhead?.monthlyCost || 0);
        }
    }, [isOpen, overhead]);
    
    const handleSubmit = () => {
        if(name.trim() && monthlyCost > 0) {
            onSave({name, type, monthlyCost});
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={overhead ? "Edit Overhead" : "Add Overhead"}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Overhead Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="ican-input mt-1"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Type</label>
                    <select value={type} onChange={e => setType(e.target.value as 'Fixed'|'Variable')} className="ican-select mt-1">
                        <option value="Fixed">Fixed</option>
                        <option value="Variable">Variable</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Monthly Cost</label>
                    <input type="number" value={monthlyCost} onChange={e => setMonthlyCost(Number(e.target.value))} className="ican-input mt-1"/>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button onClick={onClose} className="ican-btn ican-btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} className="ican-btn ican-btn-primary">Save</button>
                </div>
            </div>
        </Modal>
    );
};


const PreferencesTab: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { settings, updateSettings } = useAppSettings();
    const { currency, setCurrency, supportedCurrencies, isLoading } = useCurrency();
    
    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold">Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                    <h4 className="font-semibold">Theme</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">Choose your preferred interface look.</p>
                </div>
                 <div className="flex items-center space-x-2 bg-[var(--color-input)] p-1 rounded-lg">
                    <button onClick={() => setTheme('light')} className={`w-full flex justify-center items-center p-2 rounded-md text-sm font-semibold ${theme === 'light' ? 'bg-[var(--color-card)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>
                        <Sun size={16} className="mr-2"/> Light
                    </button>
                    <button onClick={() => setTheme('dark')} className={`w-full flex justify-center items-center p-2 rounded-md text-sm font-semibold ${theme === 'dark' ? 'bg-[var(--color-card)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>
                        <Moon size={16} className="mr-2"/> Dark
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                 <div>
                    <h4 className="font-semibold">Default Currency</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">Set the primary currency for all financial data.</p>
                </div>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="ican-select" disabled={isLoading}>
                    {supportedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                 <div>
                    <h4 className="font-semibold">Default Food Cost Target</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">Used for suggesting sale prices on new recipes.</p>
                </div>
                 <div className="relative">
                    <input type="number" value={settings.foodCostTarget} onChange={(e) => updateSettings({ foodCostTarget: parseInt(e.target.value) || 0 })} className="ican-input pr-8" min="1" max="100"/>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">%</span>
                </div>
            </div>
        </div>
    );
};

const DataManagementTab: React.FC<{onExport: ()=>void, onReset: ()=>void}> = ({onExport, onReset}) => (
     <div className="space-y-8">
        <h3 className="text-xl font-bold">Data Management</h3>
        <div>
            <h4 className="font-semibold">Export Data</h4>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">Download all your business data as a single JSON file for backup or external use.</p>
            <button onClick={onExport} className="ican-btn ican-btn-secondary">Export All Data</button>
        </div>
        <div>
            <h4 className="font-semibold text-[var(--color-danger)]">Reset Application</h4>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">Permanently delete all data across all businesses. This action cannot be undone.</p>
            <button onClick={onReset} className="ican-btn ican-btn-danger">Reset Application</button>
        </div>
     </div>
);

const ManageListsTab: React.FC = () => {
    const { categories, addCategory, updateCategory, deleteCategory, ingredientUnits, addUnit, updateUnit, deleteUnit, unitConversions, addUnitConversion, deleteUnitConversion, pricedItems } = useData();
    const { addNotification } = useNotification();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<RecipeCategory | null>(null);
    
    const [newUnitName, setNewUnitName] = useState('');
    const [editingUnit, setEditingUnit] = useState<IngredientUnit | null>(null);

    const [newConversion, setNewConversion] = useState<Omit<UnitConversion, 'id' | 'businessId'>>({ fromUnit: '', toUnit: '', factor: 1, itemId: undefined });

    const handleAddCategory = async () => {
        if (newCategoryName.trim()) {
            await addCategory(newCategoryName.trim());
            addNotification('Category added!', 'success');
            setNewCategoryName('');
        }
    };

    const handleUpdateCategory = async () => {
        if (editingCategory && editingCategory.name.trim()) {
            await updateCategory(editingCategory.id, editingCategory.name.trim());
            addNotification('Category updated!', 'success');
            setEditingCategory(null);
        }
    };
    
    const handleDeleteCategory = async (id: string) => {
        const result = await deleteCategory(id);
        if (!result.success) addNotification(result.message || 'Failed to delete.', 'error');
        else addNotification('Category deleted.', 'success');
    };
    
    const handleAddUnit = async () => {
        if (newUnitName.trim()) {
            await addUnit(newUnitName.trim());
            addNotification('Unit added!', 'success');
            setNewUnitName('');
        }
    };

    const handleUpdateUnit = async () => {
        if (editingUnit && editingUnit.name.trim()) {
            await updateUnit(editingUnit.id, editingUnit.name.trim());
            addNotification('Unit updated!', 'success');
            setEditingUnit(null);
        }
    };
    
    const handleDeleteUnit = async (id: string) => {
        const result = await deleteUnit(id);
        if (!result.success) addNotification(result.message || 'Failed to delete.', 'error');
        else addNotification('Unit deleted.', 'success');
    };

    const handleAddConversion = async () => {
        if (newConversion.fromUnit.trim() && newConversion.toUnit.trim() && newConversion.factor > 0) {
            await addUnitConversion(newConversion);
            addNotification('Conversion added!', 'success');
            setNewConversion({ fromUnit: '', toUnit: '', factor: 1, itemId: undefined });
        } else {
            addNotification('Please fill all conversion fields correctly.', 'error');
        }
    };

    const allUnits = useMemo(() => {
        const customUnits = ingredientUnits.map(u => u.name);
        return [...new Set(['kg', 'g', 'L', 'ml', 'unit', 'dozen', 'lb', 'oz', 'gal', ...customUnits])];
    }, [ingredientUnits]);

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold">Manage Lists</h3>
            {/* Unit Conversions */}
            <div>
                <h4 className="font-semibold mb-2">Unit Conversions</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3 p-3 bg-[var(--color-input)] rounded-lg">
                    <input type="text" value={newConversion.fromUnit} onChange={(e) => setNewConversion(p=>({...p, fromUnit: e.target.value}))} placeholder="From Unit (e.g., case)" className="ican-input" list="units-list"/>
                    <input type="text" value={newConversion.toUnit} onChange={(e) => setNewConversion(p=>({...p, toUnit: e.target.value}))} placeholder="To Unit (e.g., kg)" className="ican-input" list="units-list"/>
                    <input type="number" value={newConversion.factor} onChange={(e) => setNewConversion(p=>({...p, factor: parseFloat(e.target.value) || 1}))} placeholder="Factor" className="ican-input" />
                    <datalist id="units-list">{allUnits.map(u => <option key={u} value={u} />)}</datalist>
                    <select value={newConversion.itemId || ''} onChange={(e) => setNewConversion(p=>({...p, itemId: e.target.value || undefined}))} className="ican-select">
                        <option value="">Generic (All Items)</option>
                        {pricedItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </div>
                 <button onClick={handleAddConversion} className="ican-btn ican-btn-primary">Add Conversion</button>
                <ul className="space-y-2 max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-md p-2 bg-[var(--color-input)] mt-3">
                    {unitConversions.map(conv => (
                        <li key={conv.id} className="flex items-center justify-between p-2 hover:bg-[var(--color-border)] rounded">
                            <span className="text-sm">
                                1 {conv.fromUnit} = {conv.factor} {conv.toUnit}
                                <span className="text-xs text-[var(--color-text-muted)] ml-2">
                                    ({conv.itemId ? pricedItems.find(i=>i.id===conv.itemId)?.name || 'Specific Item' : 'Generic'})
                                </span>
                            </span>
                             <button onClick={() => deleteUnitConversion(conv.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={16} /></button>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Recipe Categories */}
            <div>
                <h4 className="font-semibold mb-2">Recipe Categories</h4>
                <div className="flex space-x-2 mb-3">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="ican-input flex-grow"/>
                    <button onClick={handleAddCategory} className={`ican-btn ican-btn-primary ${!newCategoryName.trim() ? 'ican-btn-disabled' : ''}`}>Add</button>
                </div>
                <ul className="space-y-2 max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-md p-2 bg-[var(--color-input)]">
                    {categories.map(cat => (
                        <li key={cat.id} className="flex items-center justify-between p-2 hover:bg-[var(--color-border)] rounded">
                            {editingCategory?.id === cat.id ? (
                                <input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} onBlur={handleUpdateCategory} onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()} className="ican-input p-1 w-full" autoFocus />
                            ) : ( <span>{cat.name}</span> )}
                            <div className="space-x-2">
                                <button onClick={() => setEditingCategory(cat)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"><Edit3 size={16} /></button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={16} /></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Ingredient Units */}
            <div>
                <h4 className="font-semibold mb-2">Ingredient Units</h4>
                <div className="flex space-x-2 mb-3">
                    <input type="text" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="New unit name (e.g. bunch)" className="ican-input flex-grow"/>
                    <button onClick={handleAddUnit} className={`ican-btn ican-btn-primary ${!newUnitName.trim() ? 'ican-btn-disabled' : ''}`}>Add</button>
                </div>
                <ul className="space-y-2 max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-md p-2 bg-[var(--color-input)]">
                    {ingredientUnits.map(unit => (
                        <li key={unit.id} className="flex items-center justify-between p-2 hover:bg-[var(--color-border)] rounded">
                            {editingUnit?.id === unit.id ? (
                                <input type="text" value={editingUnit.name} onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })} onBlur={handleUpdateUnit} onKeyDown={(e) => e.key === 'Enter' && handleUpdateUnit()} className="ican-input p-1 w-full" autoFocus />
                            ) : ( <span>{unit.name}</span> )}
                            <div className="space-x-2">
                                <button onClick={() => setEditingUnit(unit)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"><Edit3 size={16} /></button>
                                <button onClick={() => handleDeleteUnit(unit.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"><Trash2 size={16} /></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


export default Settings;