
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
                    className="flex items-center space-x-2 p-2 rounded-lg bg-white/30 hover:bg-white/50 border border-white/20"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    <Building size={20} className="text-primary" />
                    <span className="font-semibold text-text-primary hidden sm:inline">{activeBusiness.name}</span>
                    <ChevronDown size={16} className="text-text-secondary" />
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white/80 backdrop-blur-2xl rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                            <div className="px-4 py-2 text-xs text-gray-500 uppercase">Switch Business</div>
                            {businesses.map(business => (
                                <a
                                    key={business.id}
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelectBusiness(business.id); }}
                                    className={`block px-4 py-2 text-sm ${
                                        activeBusinessId === business.id ? 'font-bold text-primary bg-primary/10' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {business.name}
                                </a>
                            ))}
                            <div className="border-t border-gray-200 my-1"></div>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setIsModalOpen(true); setIsDropdownOpen(false); }}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
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
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Existing Businesses</h3>
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50">
                            {businesses.map(business => (
                                <li key={business.id} className="text-text-secondary px-2 py-1">{business.name}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                         <h3 className="text-md font-semibold text-gray-800 mb-2">Add New Business</h3>
                         <div className="flex space-x-2">
                             <input
                                type="text"
                                value={newBusinessName}
                                onChange={(e) => setNewBusinessName(e.target.value)}
                                placeholder="New business name"
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                            <button 
                                onClick={handleAddBusiness}
                                disabled={!newBusinessName.trim()}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                            >
                                Add
                            </button>
                         </div>
                    </div>
                     <div className="flex justify-end pt-4">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default BusinessSelector;
