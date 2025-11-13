


import React, { useState, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import { DataProvider } from './hooks/useDataContext';
import { CurrencyProvider } from './hooks/useCurrencyContext';
import CurrencySelector from './components/CurrencySelector';
import BusinessSelector from './components/BusinessSelector';
import { Menu as MenuIcon, CheckCircle, LoaderCircle } from 'lucide-react';
import { useData } from './hooks/useDataContext';
import { AuthProvider, useAuth } from './hooks/useAuthContext';
import { NotificationProvider } from './hooks/useNotificationContext';
import { UnsavedChangesProvider } from './hooks/useUnsavedChangesContext';


// Lazy-load page components for better performance
const AuthPage = lazy(() => import('./components/AuthPage'));
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
    
    const ICanLogo = () => (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );

    return (
        <div 
            className="flex items-center justify-center min-h-screen bg-cover bg-center p-4 bg-[var(--color-background)]"
        >
            <div className="text-center w-full max-w-md md:max-w-xl mx-auto z-10 p-8 md:p-12 rounded-2xl shadow-2xl border border-black/5 bg-[var(--color-card)]" style={{ animation: 'slideUp 0.5s ease-out' }}>
                <ICanLogo />
                <h1 className="text-3xl md:text-4xl font-bold mt-4 text-[var(--color-text-primary)]">Welcome to iCAN</h1>
                <h2 className="text-xl font-medium text-[var(--color-primary)]">F&B Intelligence Platform</h2>
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
                        placeholder="e.g., iCAN - Qatar Division"
                        className="ican-input text-center"
                        aria-label="New business name"
                    />
                    <button 
                        onClick={handleCreateFirstBusiness}
                        disabled={!newBusinessName.trim()}
                        className={`ican-btn ican-btn-primary py-2.5 ${!newBusinessName.trim() ? 'ican-btn-disabled' : ''}`}
                    >
                        Create Division
                    </button>
                </div>
                 <footer className="mt-12 text-center text-xs text-[var(--color-text-muted)]">
                    <p>&copy; {new Date().getFullYear()} iCAN F&B Group. All Rights Reserved.</p>
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
        <UnsavedChangesProvider>
            <div className="flex min-h-screen text-[var(--color-text-primary)] bg-[var(--color-background)]">
                <Sidebar 
                    currentView={currentView} 
                    setCurrentView={setCurrentView}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                />
                <main className="flex-1 flex flex-col h-screen">
                    <header className="bg-[var(--color-card)]/80 border-b border-[var(--color-border)] p-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                        <div className="flex items-center min-w-0">
                            <button 
                                className="lg:hidden mr-2 md:mr-4 text-[var(--color-text-muted)]"
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Open sidebar"
                            >
                                <MenuIcon size={24} />
                            </button>
                            <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-primary)] truncate">{viewTitles[currentView]}</h2>
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                            <BusinessSelector />
                            <CurrencySelector />
                        </div>
                    </header>
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <Suspense fallback={<GlobalLoading message="Loading Content..." />}>
                            <CurrentViewComponent />
                        </Suspense>
                    </div>
                </main>
            </div>
        </UnsavedChangesProvider>
    );
};

const AppContainer: React.FC = () => {
    const { session, loading: authLoading } = useAuth();
    
    if (authLoading) {
        return <GlobalLoading />;
    }

    if (!session) {
        return (
            <Suspense fallback={<GlobalLoading />}>
                <AuthPage />
            </Suspense>
        );
    }

    return (
        <DataProvider>
            <CurrencyProvider>
                <NotificationProvider>
                    <AppContent />
                </NotificationProvider>
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