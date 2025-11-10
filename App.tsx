
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Suppliers from './components/Suppliers';
import Menu from './components/Menu';
import Reports from './components/Reports';
import { DataProvider } from './hooks/useDataContext';
import { CurrencyProvider } from './hooks/useCurrencyContext';
import CurrencySelector from './components/CurrencySelector';
import BusinessSelector from './components/BusinessSelector';
import { Menu as MenuIcon, ChefHat } from 'lucide-react';
import { useData } from './hooks/useDataContext';

type View = 'dashboard' | 'inventory' | 'recipes' | 'suppliers' | 'menu' | 'reports';

const viewComponents: Record<View, React.FC> = {
    dashboard: Dashboard,
    inventory: Inventory,
    recipes: Recipes,
    suppliers: Suppliers,
    menu: Menu,
    reports: Reports,
};

const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard Overview',
    inventory: 'Inventory Management',
    recipes: 'Recipe Costing',
    suppliers: 'Supplier Directory',
    menu: 'Menu Engineering',
    reports: 'Analytics & Reports',
};

const AppContent: React.FC = () => {
    const { businesses, addBusiness } = useData();
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const CurrentViewComponent = viewComponents[currentView];
    const [newBusinessName, setNewBusinessName] = useState('');


    if (businesses.length === 0) {
        const handleCreateFirstBusiness = () => {
            if (newBusinessName.trim()) {
                addBusiness(newBusinessName.trim());
                setNewBusinessName('');
            }
        };

        return (
            <div className="flex items-center justify-center min-h-screen bg-transparent">
                <div className="text-center p-8 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 max-w-md mx-auto">
                    <ChefHat className="text-primary mx-auto" size={48} />
                    <h1 className="text-3xl font-bold mt-4 text-primary">Welcome to F&B Costing Pro</h1>
                    <p className="text-text-secondary mt-2 mb-6">To get started, please create your first business.</p>
                    <div className="flex flex-col space-y-3">
                         <input
                            type="text"
                            value={newBusinessName}
                            onChange={(e) => setNewBusinessName(e.target.value)}
                            placeholder="e.g., Main Restaurant"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            aria-label="New business name"
                        />
                        <button 
                            onClick={handleCreateFirstBusiness}
                            disabled={!newBusinessName.trim()}
                            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                        >
                            Create Business
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-transparent text-text-primary">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <main className="flex-1 flex flex-col">
                <header className="bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-sm p-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center">
                        <button 
                            className="lg:hidden mr-4 text-gray-600"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <MenuIcon size={24} />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-700 hidden sm:block">{viewTitles[currentView]}</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <BusinessSelector />
                        <CurrencySelector />
                    </div>
                </header>
                <div className="flex-1 p-4 md:p-6 lg:p-8">
                    <CurrentViewComponent />
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <DataProvider>
            <CurrencyProvider>
                <AppContent />
            </CurrencyProvider>
        </DataProvider>
    );
};

export default App;
