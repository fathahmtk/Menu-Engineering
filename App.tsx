
import React, { useState, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import { DataProvider } from './hooks/useDataContext';
import { CurrencyProvider } from './hooks/useCurrencyContext';
import CurrencySelector from './components/CurrencySelector';
import BusinessSelector from './components/BusinessSelector';
import { Menu as MenuIcon, ChefHat, LoaderCircle, CheckCircle } from 'lucide-react';
import { useData } from './hooks/useDataContext';
import Card from './components/common/Card';
import { AuthProvider, useAuth } from './hooks/useAuthContext';


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

const GlobalLoading: React.FC<{ message?: string }> = ({ message = 'Loading App...' }) => (
    <div className="w-screen h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center text-[var(--color-primary)]">
            <LoaderCircle size={48} className="animate-spin"/>
            <p className="mt-4 text-lg font-semibold">{message}</p>
        </div>
    </div>
);

const OnboardingScreen: React.FC = () => {
    const { addBusiness } = useData();
    const [newBusinessName, setNewBusinessName] = useState('');

    const handleCreateFirstBusiness = async () => {
        if (newBusinessName.trim()) {
            await addBusiness(newBusinessName.trim());
            setNewBusinessName('');
        }
    };

    return (
        <div 
            className="relative flex items-center justify-center min-h-screen bg-cover bg-center p-4"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')" }}
        >
            <div className="absolute inset-0 bg-black/50 z-0"></div>
            <div className="text-center w-full max-w-lg mx-auto z-10 p-8 rounded-2xl shadow-2xl border border-white/20"
                 style={{ background: 'rgba(17, 20, 24, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
                <ChefHat className="text-[var(--color-primary)] mx-auto" size={48} />
                <h1 className="text-4xl font-bold mt-4 text-white">Welcome to F&B Costing Pro</h1>
                <p className="text-[var(--color-text-muted)] mt-4 mb-2 max-w-md mx-auto">
                    Take control of your kitchen's profitability. Our tools help you manage inventory, perfect recipe costs, and analyze sales with ease.
                </p>
                <div className="text-left bg-white/5 p-4 rounded-lg my-6 border border-white/10">
                    <h2 className="font-semibold text-lg mb-2 text-white">Key Features:</h2>
                    <ul className="space-y-2 text-[var(--color-text-muted)]">
                        <li className="flex items-start"><CheckCircle className="text-[var(--color-primary)] w-5 h-5 mr-2 mt-0.5 flex-shrink-0" /><span><b>Inventory Control:</b> Track stock levels and supplier costs in real-time.</span></li>
                        <li className="flex items-start"><CheckCircle className="text-[var(--color-primary)] w-5 h-5 mr-2 mt-0.5 flex-shrink-0" /><span><b>Recipe Costing:</b> Calculate costs per serving and set profitable menu prices.</span></li>
                        <li className="flex items-start"><CheckCircle className="text-[var(--color-primary)] w-5 h-5 mr-2 mt-0.5 flex-shrink-0" /><span><b>Sales Analytics:</b> Gain insights into item performance and profitability.</span></li>
                    </ul>
                </div>
                 <p className="text-[var(--color-text-muted)] mt-2 mb-6">To get started, please create your first business.</p>
                <div className="flex flex-col space-y-3">
                     <input
                        type="text"
                        value={newBusinessName}
                        onChange={(e) => setNewBusinessName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFirstBusiness()}
                        placeholder="e.g., The Golden Spoon Bistro"
                        className="luxury-input w-full px-4 py-2"
                        aria-label="New business name"
                    />
                    <button 
                        onClick={handleCreateFirstBusiness}
                        disabled={!newBusinessName.trim()}
                        className="luxury-btn luxury-btn-primary w-full py-2.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    >
                        Create Business
                    </button>
                </div>
                <footer className="mt-8 text-center text-xs text-white/40">
                    <p>Developed by <strong>Noor Digital Solution - Abdul Fathah</strong></p>
                    <p>
                        <a href="mailto:abdulfathahntk@gmail.com" className="hover:underline">abdulfathahntk@gmail.com</a> | 
                        <a href="tel:+97431618735" className="hover:underline"> +974 31618735</a>
                    </p>
                </footer>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { businesses, loading: dataLoading } = useData();
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const CurrentViewComponent = viewComponents[currentView];

    if (dataLoading) {
        return <GlobalLoading message="Loading your business data..." />;
    }
    
    if (businesses.length === 0) {
        return <OnboardingScreen />;
    }

    return (
        <div className="flex min-h-screen text-[var(--color-text-primary)] bg-[var(--color-background)]">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <main className="flex-1 flex flex-col h-screen">
                <header className="bg-[var(--color-card)]/80 border-b border-[var(--color-border)] p-2 sm:p-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                    <div className="flex items-center">
                        <button 
                            className="lg:hidden mr-2 sm:mr-4 text-[var(--color-text-muted)]"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <MenuIcon size={24} />
                        </button>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] hidden sm:block">{viewTitles[currentView]}</h2>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <BusinessSelector />
                        <CurrencySelector />
                    </div>
                </header>
                <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <Suspense fallback={<GlobalLoading message="Loading Content..." />}>
                        <CurrentViewComponent />
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

const AppContainer: React.FC = () => {
    const { session, loading: authLoading } = useAuth();
    
    if (authLoading) {
        return <GlobalLoading />;
    }

    return (
        <DataProvider>
            <CurrencyProvider>
                <AppContent />
            </CurrencyProvider>
        </DataProvider>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContainer />
        </AuthProvider>
    );
};

export default App;