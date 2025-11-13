



import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import { useData } from '../hooks/useDataContext';
import { Supplier } from '../types';
import { PlusCircle, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import ActionsDropdown from './common/ActionsDropdown';
import ImportModal from './common/ImportModal';
import { convertToCSV, downloadCSV } from '../utils/csvHelper';
import ConfirmationModal from './common/ConfirmationModal';

const Suppliers: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, bulkAddSuppliers } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'businessId'>>({ name: '', contactPerson: '', phone: '', email: '' });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        if (currentSupplier) {
            setFormData({
                name: currentSupplier.name,
                contactPerson: currentSupplier.contactPerson,
                phone: currentSupplier.phone,
                email: currentSupplier.email,
            });
        } else {
            setFormData({ name: '', contactPerson: '', phone: '', email: '' });
        }
    }, [currentSupplier]);

    const handleOpenModal = (supplier: Supplier | null = null) => {
        setCurrentSupplier(supplier);
        setIsModalOpen(true);
        setErrors({});
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSupplier(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = 'Supplier name is required.';
        if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required.';
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'A valid email is required.';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        if (currentSupplier) {
            updateSupplier({ ...formData, id: currentSupplier.id, businessId: currentSupplier.businessId });
        } else {
            addSupplier(formData);
        }
        handleCloseModal();
    };

    const handleDeleteClick = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!supplierToDelete) return;
        const result = await deleteSupplier(supplierToDelete.id);
        if (!result.success) {
            alert(result.message);
        }
        setIsConfirmOpen(false);
        setSupplierToDelete(null);
    };

    const handleExport = () => {
        const headers = ['name', 'contactPerson', 'phone', 'email'];
        const dataToExport = suppliers.map(s => ({
            name: s.name,
            contactPerson: s.contactPerson,
            phone: s.phone,
            email: s.email,
        }));
        const csvString = convertToCSV(dataToExport, headers);
        downloadCSV(csvString, 'suppliers.csv');
    };

    const parseSupplierFile = async (fileContent: string): Promise<{ data: Omit<Supplier, 'id' | 'businessId'>[]; errors: string[] }> => {
        const lines = fileContent.trim().split('\n');
        if (lines.length < 2) return { data: [], errors: ["CSV file is empty or has only a header."] };

        const headers = lines[0].trim().split(',').map(h => h.replace(/^"|"$/g, '').trim());
        const requiredHeaders = ['name', 'contactPerson', 'phone', 'email'];
        const errors: string[] = [];
        
        requiredHeaders.forEach(h => {
            if (!headers.includes(h)) errors.push(`Missing required header: ${h}`);
        });
        if (errors.length > 0) return { data: [], errors };

        const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const supplier: any = {};
            headers.forEach((header, i) => supplier[header] = values[i]);
            
            if (!supplier.name) errors.push(`Row ${index + 2}: Supplier name is missing.`);
            if (!supplier.email || !/\S+@\S+\.\S+/.test(supplier.email)) errors.push(`Row ${index + 2}: Invalid email for ${supplier.name}.`);
            return {
                name: supplier.name,
                contactPerson: supplier.contactPerson,
                phone: supplier.phone,
                email: supplier.email,
            };
        }).filter(s => s.name);
        
        return { data, errors };
    };

    const handleImport = (data: Omit<Supplier, 'id' | 'businessId'>[]) => {
        return Promise.resolve(bulkAddSuppliers(data));
    };

    return (
        <>
            <Card>
                <div className="flex flex-col md:flex-row gap-4 md:gap-2 justify-between items-start md:items-center mb-6">
                    <h2 className="text-xl font-bold">Supplier Directory</h2>
                    <div className="flex items-center space-x-2">
                        <ActionsDropdown onExport={handleExport} onImport={() => setIsImportModalOpen(true)} />
                        <button onClick={() => handleOpenModal()} className="ican-btn ican-btn-primary p-2 md:px-4 md:py-2">
                            <PlusCircle size={20} className="md:mr-2" />
                            <span className="hidden md:inline">Add Supplier</span>
                        </button>
                    </div>
                </div>
                {suppliers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suppliers.map(supplier => (
                            <div key={supplier.id} className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)] flex flex-col justify-between hover:border-[var(--color-primary)]/50 transition-colors">
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--color-primary)]">{supplier.name}</h3>
                                    <p className="text-[var(--color-text-primary)] font-medium">{supplier.contactPerson}</p>
                                    <div className="mt-4 space-y-2">
                                        <a href={`tel:${supplier.phone}`} className="flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                                            <Phone size={14} className="mr-2"/>
                                            {supplier.phone}
                                        </a>
                                        <a href={`mailto:${supplier.email}`} className="flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                                            <Mail size={14} className="mr-2"/>
                                            {supplier.email}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex justify-end items-center space-x-1 mt-4">
                                    <button onClick={() => handleOpenModal(supplier)} className="p-3 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-input)] hover:text-[var(--color-primary)] transition-colors" aria-label={`Edit ${supplier.name}`}>
                                        <Edit size={20}/>
                                    </button>
                                     <button onClick={() => handleDeleteClick(supplier)} className="p-3 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-input)] hover:text-[var(--color-danger)] transition-colors" aria-label={`Delete ${supplier.name}`}>
                                        <Trash2 size={20}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10">
                        <p className="text-[var(--color-text-muted)]">No suppliers found.</p>
                        <button onClick={() => handleOpenModal()} className="mt-4 text-[var(--color-primary)] font-semibold hover:underline">Add your first supplier</button>
                    </div>
                )}
            </Card>

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Suppliers"
                templateUrl="data:text/csv;charset=utf-8,name,contactPerson,phone,email%0AExample%20Supplier,John%20Doe,123-456-7890,john@example.com"
                templateFilename="suppliers_template.csv"
                parseFile={parseSupplierFile}
                onImport={handleImport}
                renderPreview={(supplier: any, index) => (
                    <div key={index} className="p-2 text-sm">
                        <p className="font-semibold text-[var(--color-text-primary)]">{supplier.name}</p>
                        <p className="text-[var(--color-text-muted)]">{supplier.contactPerson} - {supplier.email}</p>
                    </div>
                )}
            />
            
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${supplierToDelete?.name}"? This action cannot be undone.`}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentSupplier ? 'Edit Supplier' : 'Add New Supplier'}>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-muted)]">Supplier Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`ican-input mt-1 ${errors.name ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="contactPerson" className="block text-sm font-medium text-[var(--color-text-muted)]">Contact Person</label>
                        <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} className={`ican-input mt-1 ${errors.contactPerson ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.contactPerson && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.contactPerson}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-muted)]">Email Address</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`ican-input mt-1 ${errors.email ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.email && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.email}</p>}
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text-muted)]">Phone Number</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={`ican-input mt-1 ${errors.phone ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.phone && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                        <button onClick={handleCloseModal} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button onClick={handleSubmit} className="ican-btn ican-btn-primary w-full md:w-auto">Save Supplier</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Suppliers;