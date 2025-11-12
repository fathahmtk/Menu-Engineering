

import React, { useState, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import { DataProvider } from './hooks/useDataContext';
import { CurrencyProvider } from './hooks/useCurrencyContext';
import CurrencySelector from './components/CurrencySelector';
import BusinessSelector from './components/BusinessSelector';
import { Menu as MenuIcon, ChefHat, LoaderCircle } from 'lucide-react';
import { useData } from './hooks/useDataContext';
import Card from './components/common/Card';

// Lazy-load page components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const Inventory = lazy(() => import('./components/Inventory'));
const Recipes = lazy(() => import('./components/Recipes'));
const Suppliers = lazy(() => import('./components/Suppliers'));
const Purchasing = lazy(() => import('./components/Purchasing'));
const Menu = lazy(() => import('./components/Menu'));
const Sales = lazy(() => import('./components/Sales'));
const Reports = lazy(() => import('./components/Reports'));


type View = 'dashboard' | 'inventory' | 'recipes' | 'suppliers' | 'purchasing' | 'menu' | 'sales' | 'reports';

const viewComponents: Record<View, React.LazyExoticComponent<React.FC<{}>>> = {
    dashboard: Dashboard,
    inventory: Inventory,
    recipes: Recipes,
    suppliers: Suppliers,
    purchasing: Purchasing,
    menu: Menu,
    sales: Sales,
    reports: Reports,
};

const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    inventory: 'Inventory Management',
    recipes: 'Recipe & Menu Costing',
    suppliers: 'Supplier Directory',
    purchasing: 'Purchase Orders',
    menu: 'Menu Engineering',
    sales: 'Sales Analytics',
    reports: 'Reports & Insights',
};

const LoadingFallback: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center text-primary">
            <LoaderCircle size={48} className="animate-spin"/>
            <p className="mt-4 text-lg font-semibold">Loading Content...</p>
        </div>
    </div>
);

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
            <div 
                className="relative flex items-center justify-center min-h-screen bg-cover bg-center p-4"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')" }}
            >
                <div className="absolute inset-0 bg-black/70 z-0"></div>
                <Card className="text-center w-full max-w-md mx-auto z-10 bg-card/70 backdrop-blur-sm border-border/50">
                    <ChefHat className="text-primary mx-auto" size={48} />
                    <h1 className="text-3xl font-bold mt-4 text-foreground">Welcome to F&B Costing Pro</h1>
                    <p className="text-muted-foreground mt-2 mb-6">To get started, please create your first business.</p>
                    <div className="flex flex-col space-y-3">
                         <input
                            type="text"
                            value={newBusinessName}
                            onChange={(e) => setNewBusinessName(e.target.value)}
                            placeholder="e.g., Main Restaurant"
                            className="w-full px-4 py-2 border border-input bg-background/80 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:text-sm text-foreground placeholder:text-muted-foreground"
                            aria-label="New business name"
                        />
                        <button 
                            onClick={handleCreateFirstBusiness}
                            disabled={!newBusinessName.trim()}
                            className="w-full bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-transform hover:scale-105 disabled:bg-primary/50 disabled:scale-100"
                        >
                            Create Business
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen text-foreground bg-background">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <main className="flex-1 flex flex-col h-screen">
                <header className="bg-card/80 border-b border-border shadow-sm p-2 sm:p-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                    <div className="flex items-center">
                        <button 
                            className="lg:hidden mr-2 sm:mr-4 text-muted-foreground"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <MenuIcon size={24} />
                        </button>
                        <h2 className="text-xl font-semibold text-foreground hidden sm:block">{viewTitles[currentView]}</h2>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <BusinessSelector />
                        <CurrencySelector />
                    </div>
                </header>
                <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <Suspense fallback={<LoadingFallback />}>
                        <CurrentViewComponent />
                    </Suspense>
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