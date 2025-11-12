import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Download, Upload } from 'lucide-react';

interface ActionsDropdownProps {
  onExport: () => void;
  onImport: () => void;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ onExport, onImport }) => {
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-[var(--color-text-muted)] px-3 py-2 rounded-lg hover:bg-white/10 transition-colors border border-[var(--color-border)]"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical size={20} />
        <span className="ml-2 font-semibold text-sm">Actions</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-[var(--color-card)] rounded-xl shadow-lg ring-1 ring-[var(--color-border)] z-50">
          <div className="py-1">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onImport(); setIsOpen(false); }}
              className="flex items-center px-4 py-2 text-sm text-white hover:bg-white/5"
            >
              <Upload size={16} className="mr-3" />
              Import CSV
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onExport(); setIsOpen(false); }}
              className="flex items-center px-4 py-2 text-sm text-white hover:bg-white/5"
            >
              <Download size={16} className="mr-3" />
              Export CSV
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsDropdown;