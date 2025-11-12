

import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import { useData } from '../hooks/useDataContext';
import { Supplier } from '../types';
import { PlusCircle, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import ActionsDropdown from './common/ActionsDropdown';
import ImportModal from './common/ImportModal';
import { convertToCSV, downloadCSV } from '../utils/csvHelper';

const Suppliers: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, bulkAddSuppliers } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
            const result = deleteSupplier(id);
            if (!result.success) {
                alert(result.message);
            }
        }
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
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 justify-between items-start sm:items-center mb-6">
                    <h2 className="text-xl font-bold">Supplier Directory</h2>
                    <div className="flex items-center space-x-2">
                        <ActionsDropdown onExport={handleExport} onImport={() => setIsImportModalOpen(true)} />
                        <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                            <PlusCircle size={20} className="mr-2" />
                            Add Supplier
                        </button>
                    </div>
                </div>
                {suppliers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suppliers.map(supplier => (
                            <div key={supplier.id} className="bg-muted p-4 rounded-lg border border-border flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-primary">{supplier.name}</h3>
                                    <p className="text-foreground font-medium">{supplier.contactPerson}</p>
                                    <div className="mt-4 space-y-2">
                                        <a href={`tel:${supplier.phone}`} className="flex items-center text-sm text-muted-foreground hover:text-primary">
                                            <Phone size={14} className="mr-2"/>
                                            {supplier.phone}
                                        </a>
                                        <a href={`mailto:${supplier.email}`} className="flex items-center text-sm text-muted-foreground hover:text-primary">
                                            <Mail size={14} className="mr-2"/>
                                            {supplier.email}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex justify-end items-center space-x-3 mt-4">
                                    <button onClick={() => handleOpenModal(supplier)} className="text-primary hover:text-primary/80" aria-label={`Edit ${supplier.name}`}>
                                        <Edit size={20}/>
                                    </button>
                                     <button onClick={() => handleDelete(supplier.id)} className="text-destructive hover:text-destructive/80" aria-label={`Delete ${supplier.name}`}>
                                        <Trash2 size={20}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10">
                        <p className="text-muted-foreground">No suppliers found.</p>
                        <button onClick={() => handleOpenModal()} className="mt-4 text-primary font-semibold hover:underline">Add your first supplier</button>
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
                        <p className="font-semibold">{supplier.name}</p>
                        <p className="text-muted-foreground">{supplier.contactPerson} - {supplier.email}</p>
                    </div>
                )}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentSupplier ? 'Edit Supplier' : 'Add New Supplier'}>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground">Supplier Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm ${errors.name ? 'border-destructive' : 'border-input'}`} />
                        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="contactPerson" className="block text-sm font-medium text-foreground">Contact Person</label>
                        <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm ${errors.contactPerson ? 'border-destructive' : 'border-input'}`} />
                        {errors.contactPerson && <p className="text-destructive text-xs mt-1">{errors.contactPerson}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground">Email Address</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm ${errors.email ? 'border-destructive' : 'border-input'}`} />
                        {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-foreground">Phone Number</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm ${errors.phone ? 'border-destructive' : 'border-input'}`} />
                        {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCloseModal} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save Supplier</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Suppliers;