import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import Modal from './Modal';
import PocketBase from 'pocketbase';


const pb = new PocketBase('http://127.0.0.1:8090'); // Adjust the URL as needed

interface Entry {
  id: string;
  UUID: string;
  name: string;
  companyname: string;
  email: string;
  phone: string;
  address: string;
}

interface SortConfig {
  key: keyof Entry;
  direction: 'ascending' | 'descending';
}

const AddressBook: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState<string>('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/invoicebook/read');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      // Access the 'data' property of the result
      if (Array.isArray(result.data)) {
        setEntries(result.data);
      } else {
        // Handle the case where 'data' is not an array
        console.error('Data property fetched is not an array:', result.data);
        setEntries([]); // Set entries to an empty array to avoid errors
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setEntries([]); // Set entries to an empty array to avoid errors
    }
  };
  

  const clearFormFields = () => {
    setSelectedEntry({
      id: '',
      UUID: '',
      name: '',
      companyname: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleCRUDOperation = async (url: string, method: string, body?: {}) => {
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Operation failed');
      fetchEntries();
    } catch (error) {
      console.error('Operation error:', error);
    }
  };

  const handleAddClick = () => {
    setSelectedEntry(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEntry(null);
  };

  const handleEdit = (entry: Entry) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
  const deleteUrl = `/api/invoicebook/delete/${id}`;
  await handleCRUDOperation(deleteUrl, 'DELETE',{});
  setShowModal(false);
};


  const requestSort = (key: keyof Entry) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending',
    });
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [entries, sortConfig]);

  const filteredSortedEntries = useMemo(() => {
    return sortedEntries.filter(entry =>
      entry.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      entry.UUID.toLowerCase().includes(searchInput.toLowerCase()),
    );
  }, [sortedEntries, searchInput]);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const entryData = {
      id: selectedEntry?.id,
      name: formData.get('name'),
      companyname: formData.get('companyname'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    };

    const url = selectedEntry ? '/api/invoicebook/update' : '/api/invoicebook/create';
    const method = selectedEntry ? 'PUT' : 'POST';

    await handleCRUDOperation(url, method, entryData);

    setShowModal(false);
    setSelectedEntry(null);
    form.reset(); // Reset the form fields after a successful operation
  }; 
  

  async function fetchCustomerData(uuid: string): Promise<Entry | null> {
    try {
        // Replace 'uuidFieldName' with the actual field name in your 'addressbook' collection that holds the UUID
        const record = await pb.collection('addressbook').getFirstListItem(`UUID="${uuid}"`);
        if (record) {
            return {
                id: record.id, // or any other necessary field from the record
                UUID: record.UUID, // or the respective field
                name: record.name,
                companyname: record.companyname,
                email: record.email,
                phone: record.phone,
                address: record.address
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching customer data:", error);
        return null;
    }
}

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">Invoices</h1>
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={handleAddClick}
          className="bg-green-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Add
        </button>
        <input
          className="w-full p-2 border rounded text-gray-700"
          type="text"
          placeholder="Enter UUID or Name to search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} // Update searchInput as user types
        />
        
      </div>

      <table className="w-full border divide-y mt-4 text-gray-800">
        <thead className="bg-gray-300">
          <tr>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('UUID')}>
              UUID {sortConfig.key === 'UUID' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('name')}>
              Name {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('companyname')}>
              Company Name {sortConfig.key === 'companyname' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('email')}>
              Email {sortConfig.key === 'email' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('phone')}>
              Phone {sortConfig.key === 'phone' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('address')}>
              Address {sortConfig.key === 'address' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredSortedEntries.map((entry) => (
            <tr
              key={entry.id}
              onClick={() => handleEdit(entry)} // Make the row clickable
              className={`cursor-pointer transition duration-300 ease-in-out hover:bg-purple-100`}
              >
              <td className="px-4 py-2">{entry.UUID}</td>
              <td className="px-4 py-2">{entry.name}</td>
              <td className="px-4 py-2">{entry.companyname}</td>
              <td className="px-4 py-2">{entry.email}</td>
              <td className="px-4 py-2">{entry.phone}</td>
              <td className="px-4 py-2">{entry.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedEntry ? 'Edit Invoice Details' : 'Add a New Invoice'}
        onSubmit={handleFormSubmit} // Pass the form submission handler
        onClearForm={clearFormFields} // Pass the function to clear the form
        onDelete={() => selectedEntry && handleDelete(selectedEntry.id)} // Pass the delete handler
        mode={selectedEntry ? 'edit' : 'add'} // Pass the mode
        fetchCustomerData={fetchCustomerData}
        initialData={selectedEntry || { id: '', UUID: '', name: '', companyname:'', email: '', phone: '', address: '' }} // Pass the initial data
        children={undefined} />
    </div >
  );
};

export default AddressBook;
