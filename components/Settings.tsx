import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { useData } from '../hooks/useDataContext';
import { useAuth } from '../hooks/useAuthContext';
import { useTheme } from '../hooks/useTheme';
import { useAppSettings } from '../hooks/useAppSettings';
import { useCurrency } from '../hooks/useCurrencyContext';
import { useNotification } from '../hooks/useNotificationContext';
import { Business, RecipeCategory, IngredientUnit } from '../types';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { Edit3, Trash2, Sun, Moon, AlertTriangle, Building, Settings as SettingsIcon, Database, List } from 'lucide-react';

const TABS = [
  { id: 'business', label: 'Business Details', icon: <Building size={18} /> },
  { id: 'preferences', label: 'Preferences', icon: <SettingsIcon size={18} /> },
  { id: 'data', label: 'Data Management', icon: <Database size={18} /> },
  { id: 'lists', label: 'Manage Lists', icon: <List size={18} /> },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('business');
    const { businesses, activeBusinessId, updateBusiness } = useData();
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    const activeBusiness = businesses.find(b => b.id === activeBusinessId);

    const handleResetData = () => {
        // In a real app, this would be a destructive backend operation.
        // For this mock app, we'll clear localStorage and reload.
        localStorage.clear();
        window.location.reload();
    };
    
    const handleExportData = () => {
        // This is a simplified export. In a real app, you'd gather all data from context.
        const dataToExport = {
            businesses,
            // ... include other data like inventory, recipes etc.
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
                    <div className="p-4 border-b border-[var(--color-border)]">
                        <h2 className="text-lg font-bold">Settings</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">Manage your application and business settings.</p>
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
                message="Are you sure you want to reset all application data? This action is irreversible and will delete all businesses, inventory, recipes, and other data."
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

const PreferencesTab: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { settings, updateSettings } = useAppSettings();
    const { currency, setCurrency, supportedCurrencies, isLoading } = useCurrency();
    
    const handleDashboardToggle = (key: string) => {
        updateSettings({
            dashboard: {
                ...settings.dashboard,
                [key]: !settings.dashboard[key]
            }
        });
    };

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

            <div>
                <h4 className="font-semibold">Dashboard Cards</h4>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">Choose which metric cards to display on the dashboard.</p>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(settings.dashboard).map(([key, value]) => (
                        <label key={key} className="flex items-center space-x-3 cursor-pointer">
                           <input type="checkbox" checked={value} onChange={() => handleDashboardToggle(key)} className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"/>
                           <span className="text-sm font-medium text-[var(--color-text-primary)] capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                           </span>
                        </label>
                    ))}
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
    const { categories, addCategory, updateCategory, deleteCategory, ingredientUnits, addUnit, updateUnit, deleteUnit } = useData();
    const { addNotification } = useNotification();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<RecipeCategory | null>(null);
    
    const [newUnitName, setNewUnitName] = useState('');
    const [editingUnit, setEditingUnit] = useState<IngredientUnit | null>(null);

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

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold">Manage Lists</h3>
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