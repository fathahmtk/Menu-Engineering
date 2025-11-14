import React from 'react';
import { LayoutDashboard, BookOpen, X, SlidersHorizontal, LogOut, BarChart3, Utensils, Users, Tags } from 'lucide-react';
import { useAuth } from '../hooks/useAuthContext';
import { useUnsavedChanges } from '../hooks/useUnsavedChangesContext';
import { View } from '../App';


interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ICanLogo = () => (
    <div className="flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">iCAN</h1>
    </div>
);

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    className={`relative flex items-center p-3 my-1 cursor-pointer rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-input)] hover:text-[var(--color-text-primary)]'
    }`}
    onClick={onClick}
  >
    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--color-primary)] rounded-r-full" />}
    {icon}
    <span className="ml-4">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  const { signOut } = useAuth();
  const { promptNavigation } = useUnsavedChanges();
  
  const navItems: {
      id: View;
      label: string;
      icon: React.ReactNode;
    }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'pricelist', label: 'Price List', icon: <Tags size={20} /> },
        { id: 'recipes', label: 'Recipes', icon: <BookOpen size={20} /> },
        { id: 'menu', label: 'Menu Items', icon: <Utensils size={20} /> },
        { id: 'suppliers', label: 'Suppliers', icon: <Users size={20} /> },
        { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  ];

  const handleNavigation = (view: View) => {
    promptNavigation(() => {
        setCurrentView(view);
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    });
  };

  return (
    <>
      <div className={`fixed lg:static inset-0 bg-black bg-opacity-60 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`bg-[var(--color-sidebar)] w-64 min-h-screen p-4 flex flex-col fixed lg:static z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-[var(--color-border)] shadow-lg`}>
        <div className="flex items-center justify-between mb-8">
            <ICanLogo />
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
      </aside>
    </>
  );
};

export default Sidebar;