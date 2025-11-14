


import React, { useState, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { DataProvider } from './hooks/useDataContext';
import { CurrencyProvider } from './hooks/useCurrencyContext';
import { Menu as MenuIcon, LoaderCircle } from 'lucide-react';
import { useData } from './hooks/useDataContext';
import { AuthProvider, useAuth } from './hooks/useAuthContext';
import { NotificationProvider } from './hooks/useNotificationContext';
import { UnsavedChangesProvider } from './hooks/useUnsavedChangesContext';
import { ThemeProvider } from './hooks/useTheme';
import { AppSettingsProvider } from './hooks/useAppSettings';


// Lazy-load page components for better performance
const AuthPage = lazy(() => import('./components/AuthPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const PriceList = lazy(() => import('./components/Purchasing')); // Re-purposed for Price List
const Recipes = lazy(() => import('./components/Recipes'));
const Menu = lazy(() => import('./components/Menu'));
const Suppliers = lazy(() => import('./components/Suppliers'));
const Reports = lazy(() => import('./components/Reports'));
const Settings = lazy(() => import('./components/Settings'));


export type View = 'dashboard' | 'pricelist' | 'recipes' | 'menu' | 'suppliers' | 'reports' | 'settings';

const viewComponents: Record<View, React.LazyExoticComponent<React.FC<{}>>> = {
    dashboard: Dashboard,
    pricelist: PriceList,
    recipes: Recipes,
    menu: Menu,
    suppliers: Suppliers,
    reports: Reports,
    settings: Settings,
};

export const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    pricelist: 'Price List Management',
    recipes: 'Recipe & Menu Costing',
    menu: 'Menu Engineering',
    suppliers: 'Supplier Directory',
    reports: 'Cost Analysis Reports',
    settings: 'Application Settings',
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
            <div className="text-center w-full max-w-md md:max-w-xl mx-auto z-10 p-8 md:p-12 ican-card" style={{ animation: 'slideUp 0.5s ease-out' }}>
                <ICanLogo />
                <h1 className="text-3xl md:text-4xl font-bold mt-4 text-[var(--color-text-primary)]">Welcome to iCAN</h1>
                <h2 className="text-xl font-medium text-[var(--color-primary)]">F&B Costing Platform</h2>
                <p className="text-[var(--color-text-secondary)] mt-4 mb-8 max-w-md mx-auto">
                    Centralize your operations. Manage inventory and recipes for all your business divisions in one powerful platform.
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
                <div className="flex-1 flex flex-col h-screen">
                    <Header
                        viewTitle={viewTitles[currentView]}
                        setIsSidebarOpen={setIsSidebarOpen}
                        setCurrentView={setCurrentView}
                    />
                    <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <Suspense fallback={<GlobalLoading message="Loading Content..." />}>
                            <CurrentViewComponent />
                        </Suspense>
                    </main>
                </div>
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
        <AppSettingsProvider>
            <DataProvider>
                <CurrencyProvider>
                    <NotificationProvider>
                        <ThemeProvider>
                            <AppContent />
                        </ThemeProvider>
                    </NotificationProvider>
                </CurrencyProvider>
            </DataProvider>
        </AppSettingsProvider>
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