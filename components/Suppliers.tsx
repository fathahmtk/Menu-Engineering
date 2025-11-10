
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import { useData } from '../hooks/useDataContext';
import { Supplier } from '../types';
import { PlusCircle, Mail, Phone, Edit, Trash2 } from 'lucide-react';

const Suppliers: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    // FIX: Change type to Supplier | null for clarity.
    const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
    // FIX: Change type to Omit<Supplier, 'id' | 'businessId'> as businessId is handled by the context.
    const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'businessId'>>({ name: '', contactPerson: '', phone: '', email: '' });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
        // FIX: Add businessId to the updated supplier object to match the Supplier type.
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

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Supplier Directory</h2>
                    <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        <PlusCircle size={20} className="mr-2" />
                        Add Supplier
                    </button>
                </div>
                {suppliers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suppliers.map(supplier => (
                            <div key={supplier.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-primary">{supplier.name}</h3>
                                    <p className="text-text-secondary font-medium">{supplier.contactPerson}</p>
                                    <div className="mt-4 space-y-2">
                                        <a href={`tel:${supplier.phone}`} className="flex items-center text-sm text-text-secondary hover:text-primary">
                                            <Phone size={14} className="mr-2"/>
                                            {supplier.phone}
                                        </a>
                                        <a href={`mailto:${supplier.email}`} className="flex items-center text-sm text-text-secondary hover:text-primary">
                                            <Mail size={14} className="mr-2"/>
                                            {supplier.email}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex justify-end items-center space-x-3 mt-4">
                                    <button onClick={() => handleOpenModal(supplier)} className="text-primary hover:text-indigo-700" aria-label={`Edit ${supplier.name}`}>
                                        <Edit size={20}/>
                                    </button>
                                     <button onClick={() => handleDelete(supplier.id)} className="text-red-500 hover:text-red-700" aria-label={`Delete ${supplier.name}`}>
                                        <Trash2 size={20}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10">
                        <p className="text-text-secondary">No suppliers found.</p>
                        <button onClick={() => handleOpenModal()} className="mt-4 text-primary font-semibold hover:underline">Add your first supplier</button>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentSupplier ? 'Edit Supplier' : 'Add New Supplier'}>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Supplier Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">Save Supplier</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Suppliers;