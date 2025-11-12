



import React, { useState } from 'react';
import { useData } from '../hooks/useDataContext';
import { Building, ChevronDown, PlusCircle } from 'lucide-react';
import Modal from './common/Modal';

const BusinessSelector: React.FC = () => {
    const { businesses, activeBusinessId, setActiveBusinessId, addBusiness } = useData();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState('');

    const activeBusiness = businesses.find(b => b.id === activeBusinessId);

    const handleSelectBusiness = (id: string) => {
        setActiveBusinessId(id);
        setIsDropdownOpen(false);
    };
    
    const handleAddBusiness = () => {
        if (newBusinessName.trim()) {
            addBusiness(newBusinessName.trim());
            setNewBusinessName('');
        }
    };

    if (!activeBusiness) {
        return null;
    }

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-black/5 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    <Building size={20} className="text-[var(--color-primary)]" />
                    <span className="font-semibold text-[var(--color-text-primary)] hidden sm:inline">{activeBusiness.name}</span>
                    <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 origin-top-right bg-[var(--color-card)] rounded-xl shadow-lg ring-1 ring-[var(--color-border)] z-50">
                        <div className="py-1">
                            <div className="px-4 py-2 text-xs text-[var(--color-text-muted)] uppercase">Switch Business</div>
                            {businesses.map(business => (
                                <a
                                    key={business.id}
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelectBusiness(business.id); }}
                                    className={`block px-4 py-2 text-sm ${
                                        activeBusinessId === business.id ? 'font-bold text-[var(--color-primary)] bg-[var(--color-secondary)]' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-secondary)]'
                                    }`}
                                >
                                    {business.name}
                                </a>
                            ))}
                            <div className="border-t border-[var(--color-border)] my-1"></div>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setIsModalOpen(true); setIsDropdownOpen(false); }}
                                className="block px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-secondary)] flex items-center"
                            >
                                <PlusCircle size={16} className="mr-2" />
                                Manage Businesses
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Manage Businesses">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-md font-semibold text-[var(--color-text-muted)] mb-2">Existing Businesses</h3>
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 border border-[var(--color-border)] rounded-md p-2 bg-[var(--color-secondary)]">
                            {businesses.map(business => (
                                <li key={business.id} className="text-[var(--color-text-primary)] px-2 py-1">{business.name}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                         <h3 className="text-md font-semibold text-[var(--color-text-muted)] mb-2">Add New Business</h3>
                         <div className="flex space-x-2">
                             <input
                                type="text"
                                value={newBusinessName}
                                onChange={(e) => setNewBusinessName(e.target.value)}
                                placeholder="New business name"
                                className="luxury-input flex-grow"
                            />
                            <button 
                                onClick={handleAddBusiness}
                                disabled={!newBusinessName.trim()}
                                className="luxury-btn luxury-btn-primary disabled:opacity-50"
                            >
                                Add
                            </button>
                         </div>
                    </div>
                     <div className="flex justify-end pt-4">
                        <button onClick={() => setIsModalOpen(false)} className="luxury-btn luxury-btn-secondary">
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default BusinessSelector;