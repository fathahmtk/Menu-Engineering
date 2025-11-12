
import React from 'react';
import { LayoutDashboard, ShoppingCart, BookOpen, Truck, Utensils, BarChart2, ChefHat, X, ClipboardList, Receipt, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuthContext';


type View = 'dashboard' | 'inventory' | 'recipes' | 'suppliers' | 'purchasing' | 'menu' | 'sales' | 'reports';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    className={`flex items-center p-3 my-1 cursor-pointer rounded-lg transition-all duration-200 relative ${
      isActive
        ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg'
        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]'
    }`}
    onClick={onClick}
  >
    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/4 w-1 bg-white/50 rounded-r-full"></div>}
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  const { signOut } = useAuth();
  
  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <ShoppingCart size={20} /> },
    { id: 'recipes', label: 'Recipes', icon: <BookOpen size={20} /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck size={20} /> },
    { id: 'purchasing', label: 'Purchasing', icon: <ClipboardList size={20} /> },
    { id: 'menu', label: 'Menu', icon: <Utensils size={20} /> },
    { id: 'sales', label: 'Sales', icon: <Receipt size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} /> },
  ];

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className={`fixed lg:static inset-0 bg-black bg-opacity-60 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`bg-[hsl(220,18%,6%)] w-64 min-h-screen p-4 flex flex-col fixed lg:static z-40 transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-[var(--color-border)]`}>
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
                 <ChefHat className="text-[var(--color-primary)]" size={32} />
                 <h1 className="text-2xl font-bold ml-2 text-white">F&B Pro</h1>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-[var(--color-text-muted)]">
                <X size={24} />
            </button>
        </div>
        <nav className="flex-1">
          <ul>
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentView === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </ul>
        </nav>
        
        <div className="mt-auto">
             <button
                onClick={signOut}
                className="w-full flex items-center p-3 my-1 cursor-pointer rounded-lg transition-colors text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
              >
                <LogOut size={20} />
                <span className="ml-4 font-medium">Logout</span>
              </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;