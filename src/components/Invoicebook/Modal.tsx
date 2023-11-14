// components/Modal.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

interface FormFields {
    name: string;
    companyname: string;
    email: string;
    phone: string;
    address: string;
}
interface Entry {
    id: string;
    UUID: string;
    name: string;
    companyname: string;
    email: string;
    phone: string;
    address: string;
}

interface ModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onDelete?: (entryId: string) => void; // Pass the ID to delete
    onClearForm: () => void; // Add this line
    mode: 'add' | 'edit';
    initialData: Entry;
    fetchCustomerData: (uuid: string) => Promise<Entry | null>; // Function to fetch customer data
}

//This is my current invoicebook' popup modal that handles both updating/deleting functions, and creating entry functions as well, in a dual mode setup.
//I want to include the search and fetch functionality discussed before into this form to populate these fields automatically

const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, onSubmit,
    onDelete,
    onClearForm,
    mode,
    fetchCustomerData,
    initialData }) => {
    if (!isOpen) return null;

    const [searchUuid, setSearchUuid] = useState<string>('');

    const [formData, setFormData] = useState<FormFields>({
        name: '',
        companyname: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (mode === 'edit') {
            setFormData({
                name: initialData.name,
                companyname: initialData.companyname,
                email: initialData.email,
                phone: initialData.phone,
                address: initialData.address
            });
        }
    }, [initialData, mode]);

    const handleFetchClick = async () => {
        const customerData = await fetchCustomerData(searchUuid);
        if (customerData) {
            setFormData({
                name: customerData.name,
                companyname: customerData.companyname,
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address,
            });
        } else {
            // Handle case where customer is not found
            console.log("Customer not found");
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    const clearForm = () => {
        setFormData({
            name: '',
            companyname: '',
            email: '',
            phone: '',
            address: '',
        });
        onClearForm();
    };




    return (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-50 flex">
            <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow">
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 mt-4 mr-4 bg-red-500 text-white rounded-full p-2 leading-none flex items-center justify-center hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    style={{ width: '30px', height: '30px' }}
                >
                    {/* The following SVG is a cross icon */}
                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h2>
                <div className="mb-6 space-y-4">
                    <input
                        className="w-full p-2 border rounded text-gray-700"
                        type="text"
                        placeholder="Enter UUID to search"
                        value={searchUuid}
                        onChange={(e) => setSearchUuid(e.target.value)}
                    />
                    <button
                        onClick={handleFetchClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                        Fetch Customer
                    </button>
                </div>
                <form className="mb-6 space-y-4" id="personForm" onSubmit={onSubmit}>
                    <input
                        className="w-full p-2 border rounded text-gray-700"
                        type="text"
                        name="name"
                        value={formData?.name ?? ''}
                        onChange={handleChange}
                        placeholder="Name"
                    />
                    <input
                        className="w-full p-2 border rounded text-gray-700"
                        type="text"
                        name="companyname"
                        placeholder="Company Name"
                        value={formData.companyname} // Ensure you have companyName in your formData state
                        onChange={handleChange} // Make sure handleChange updates formData.companyName
                    />
                    <input
                        className="w-full p-2 border rounded text-gray-700"
                        type="text"
                        name="email"
                        value={formData?.email ?? ''}
                        onChange={handleChange}
                        placeholder="Email"
                    />

                    <input
                        className="w-full p-2 border rounded text-gray-700"
                        type="text"
                        name="phone"
                        value={formData?.phone ?? ''}
                        onChange={handleChange}
                        placeholder="Phone"
                    />

                    <input
                        className="w-full p-2 border rounded text-gray-700"
                        type="text"
                        name="address"
                        value={formData?.address ?? ''}
                        onChange={handleChange}
                        placeholder="Address"
                    />

                    {mode === 'edit' && (
                        <>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md mr-2">
                                Update
                            </button>
                            <button
                                type="button"
                                className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                                onClick={() => onDelete && onDelete(initialData.id)}>
                                Delete
                            </button>
                        </>
                    )}

                    {mode === 'add' && (
                        <>
                            <button type="submit" className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-md mr-2">
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    clearForm(); // This will reset the form fields to their initial state
                                    onClose();   // This will close the modal
                                }}
                                className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Modal;