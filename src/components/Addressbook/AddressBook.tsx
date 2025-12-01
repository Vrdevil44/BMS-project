import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import Modal from './Modal';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

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
      const records = await pb.collection('addressbook').getFullList<Entry>({
        sort: '-created',
      });
      setEntries(records);
    } catch (error) {
      console.error('Fetch error:', error);
      setEntries([]);
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
    try {
      await pb.collection('addressbook').delete(id);
      fetchEntries();
      setShowModal(false);
    } catch (error) {
      console.error('Delete error:', error);
    }
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
      name: formData.get('name'),
      companyname: formData.get('companyname'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    };

    try {
      if (selectedEntry && selectedEntry.id) {
        await pb.collection('addressbook').update(selectedEntry.id, entryData);
      } else {
        await pb.collection('addressbook').create(entryData);
      }
      fetchEntries();
      setShowModal(false);
      setSelectedEntry(null);
      form.reset();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };
  

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-white">Customers</h1>
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={handleAddClick}
          className="bg-green-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-md"
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

      <table className="w-max divide-y mt-4 text-gray-800">
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
              className={`cursor-pointer transition duration-300 ease-in-out hover:bg-gray-900`}
              >
              <td className="text-white px-4 py-2">{entry.UUID}</td>
              <td className="text-white px-4 py-2">{entry.name}</td>
              <td className="text-white px-4 py-2">{entry.companyname}</td>
              <td className="text-white px-4 py-2">{entry.email}</td>
              <td className="text-white px-4 py-2">{entry.phone}</td>
              <td className="text-white px-4 py-2">{entry.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedEntry ? 'Edit Customer Details' : 'Add a New Customer'}
        onSubmit={handleFormSubmit} // Pass the form submission handler
        onClearForm={clearFormFields} // Pass the function to clear the form
        onDelete={() => selectedEntry && handleDelete(selectedEntry.id)} // Pass the delete handler
        mode={selectedEntry ? 'edit' : 'add'} // Pass the mode
        initialData={selectedEntry || { id: '', UUID: '', name: '', companyname:'', email: '', phone: '', address: '' }} // Pass the initial data
        children={undefined} />
    </div >
  );
};

export default AddressBook;
