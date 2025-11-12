
import React, { useState, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import { DataProvider } from './hooks/useDataContext';
import { CurrencyProvider } from './hooks/useCurrencyContext';
import CurrencySelector from './components/CurrencySelector';
import BusinessSelector from './components/BusinessSelector';
import { Menu as MenuIcon, CheckCircle, LoaderCircle } from 'lucide-react';
import { useData } from './hooks/useDataContext';
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

const GlobalLoading: React.FC<{ message?: string }> = ({ message = 'Loading Application...' }) => (
    <div className="w-screen h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center text-[var(--color-primary)]">
            <LoaderCircle size={48} className="animate-spin"/>
            <p className="mt-4 text-lg font-semibold text-[var(--color-text-secondary)]">{message}</p>
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
    
    const CanGroupLogo = () => (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="var(--color-primary)"/>
          <path d="M15.5 8.5C14.67 7.33 13.33 6.5 12 6.5C10.67 6.5 9.33 7.33 8.5 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M15.5 15.5C14.67 16.67 13.33 17.5 12 17.5C10.67 17.5 9.33 16.67 8.5 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8.5 15.5C7.33 14.67 6.5 13.33 6.5 12C6.5 10.67 7.33 9.33 8.5 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M15.5 8.5C16.67 9.33 17.5 10.67 17.5 12C17.5 13.33 16.67 14.67 15.5 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );

    return (
        <div 
            className="flex items-center justify-center min-h-screen bg-cover bg-center p-4 bg-[var(--color-background)]"
        >
            <div className="text-center w-full max-w-lg mx-auto z-10 p-8 sm:p-12 rounded-2xl shadow-2xl border border-black/5 bg-[var(--color-card)]" style={{ animation: 'slideUp 0.5s ease-out' }}>
                <CanGroupLogo />
                <h1 className="text-3xl sm:text-4xl font-bold mt-4 text-[var(--color-text-primary)]">Welcome to CAN Group</h1>
                <h2 className="text-xl font-medium text-[var(--color-primary)]">F&B Business Intelligence Platform</h2>
                <p className="text-[var(--color-text-secondary)] mt-4 mb-8 max-w-md mx-auto">
                    Centralize your operations. Manage inventory, recipes, and sales for all your business divisions in one powerful platform.
                </p>

                <p className="text-[var(--color-text-muted)] text-sm mt-2 mb-4">To get started, please create your first business division.</p>
                <div className="flex flex-col space-y-3">
                     <input
                        type="text"
                        value={newBusinessName}
                        onChange={(e) => setNewBusinessName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFirstBusiness()}
                        placeholder="e.g., CAN Group - Qatar Division"
                        className="can-input text-center"
                        aria-label="New business name"
                    />
                    <button 
                        onClick={handleCreateFirstBusiness}
                        disabled={!newBusinessName.trim()}
                        className={`can-btn can-btn-primary py-2.5 ${!newBusinessName.trim() ? 'can-btn-disabled' : ''}`}
                    >
                        Create Division
                    </button>
                </div>
                 <footer className="mt-12 text-center text-xs text-[var(--color-text-muted)]">
                    <p>&copy; {new Date().getFullYear()} CAN Food & Beverage Group. All Rights Reserved.</p>
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
                <header className="bg-[var(--color-card)]/80 border-b border-[var(--color-border)] p-3 sm:p-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
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
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto" style={{ animation: 'fadeIn 0.5s ease-out' }}>
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