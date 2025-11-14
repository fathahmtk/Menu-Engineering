import React, { useState, useRef, useEffect } from 'react';
import BusinessSelector from './BusinessSelector';
import { useAuth } from '../hooks/useAuthContext';
import { useTheme } from '../hooks/useTheme';
import { Menu as MenuIcon, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { View } from '../App';

interface HeaderProps {
  viewTitle: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setCurrentView: (view: View) => void;
}

const UserDropdown: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full bg-[var(--color-input)] flex items-center justify-center hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                <User size={20} className="text-[var(--color-text-secondary)]" />
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-56 origin-top-right bg-[var(--color-card)] rounded-xl shadow-lg ring-1 ring-[var(--color-border)] z-50">
                    <div className="p-2">
                        <div className="px-2 py-2">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Signed in as</p>
                            <p className="text-sm text-[var(--color-text-muted)] truncate">{user?.email || 'User'}</p>
                        </div>
                        <div className="border-t border-[var(--color-border)] my-1"></div>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('settings'); setIsOpen(false); }} className="flex items-center w-full px-2 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-input)] hover:text-[var(--color-text-primary)] rounded-md">
                            <Settings size={16} className="mr-2"/> Settings
                        </a>
                        <div className="flex items-center w-full px-2 py-2 text-sm text-[var(--color-text-secondary)] rounded-md">
                            <Sun size={16} className="mr-2"/> 
                            <span>Theme</span>
                            <div className="ml-auto flex items-center space-x-1 bg-[var(--color-background)] p-0.5 rounded-md">
                               <button onClick={() => setTheme('light')} className={`p-1 rounded ${theme === 'light' ? 'bg-[var(--color-card)] shadow-sm' : ''}`}><Sun size={14}/></button>
                               <button onClick={() => setTheme('dark')} className={`p-1 rounded ${theme === 'dark' ? 'bg-[var(--color-card)] shadow-sm' : ''}`}><Moon size={14}/></button>
                            </div>
                        </div>
                        <div className="border-t border-[var(--color-border)] my-1"></div>
                        <a href="#" onClick={(e) => { e.preventDefault(); signOut(); setIsOpen(false); }} className="flex items-center w-full px-2 py-2 text-sm text-[var(--color-danger)]/90 hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] rounded-md">
                            <LogOut size={16} className="mr-2"/> Logout
                        </a>
                    </div>
                 </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ viewTitle, setIsSidebarOpen, setCurrentView }) => {
    return (
        <header className="bg-[var(--color-card)]/80 border-b border-[var(--color-border)] p-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center min-w-0">
                <button 
                    className="lg:hidden mr-2 md:mr-4 text-[var(--color-text-muted)]"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open sidebar"
                >
                    <MenuIcon size={24} />
                </button>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] truncate">{viewTitle}</h2>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                <BusinessSelector />
                <UserDropdown onNavigate={setCurrentView} />
            </div>
        </header>
    );
};

export default Header;
