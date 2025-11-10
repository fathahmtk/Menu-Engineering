
import React from 'react';
import { LayoutDashboard, ShoppingCart, BookOpen, Truck, Utensils, BarChart2, ChefHat, X, ClipboardList, Receipt } from 'lucide-react';

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
    className={`flex items-center p-3 my-1 cursor-pointer rounded-lg transition-colors ${
      isActive
        ? 'bg-primary text-white shadow-lg'
        : 'text-gray-700 hover:bg-white/30'
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
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
      <div className={`fixed lg:static inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`bg-white/60 backdrop-blur-xl border-r border-white/20 w-64 min-h-screen p-4 flex flex-col fixed lg:static z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
                 <ChefHat className="text-primary" size={32} />
                 <h1 className="text-2xl font-bold ml-2 text-primary">F&B Costing Pro</h1>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500">
                <X size={24} />
            </button>
        </div>
        <nav>
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
      </aside>
    </>
  );
};

export default Sidebar;
