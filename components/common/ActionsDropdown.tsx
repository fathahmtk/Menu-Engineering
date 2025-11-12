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
        className="ican-btn ican-btn-secondary px-3"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical size={20} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-[var(--color-card)] rounded-xl shadow-lg ring-1 ring-[var(--color-border)] z-50">
          <div className="py-1">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onImport(); setIsOpen(false); }}
              className="flex items-center px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-input)]"
            >
              <Upload size={16} className="mr-3" />
              Import CSV
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onExport(); setIsOpen(false); }}
              className="flex items-center px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-input)]"
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