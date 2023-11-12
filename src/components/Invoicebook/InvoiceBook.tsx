import React, { useState, useEffect, FormEvent, useMemo, useRef } from 'react';
import Modal from './Modal';

// Define the structure of an address book entry
interface Entry {
  id: number;
  UUID: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

// Define the structure for sort configuration
interface SortConfig {
  key: keyof Entry;
  direction: 'ascending' | 'descending';
}

const AddressBook: React.FC = () => {
  const [searchUUID, setSearchUUID] = useState<string>('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [searchedUUID, setSearchedUUID] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [showModal, setShowModal] = useState(false);

  const handleAddClick = () => {
    setShowModal(true)
    setSelectedEntry(null)
  };
  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedEntry(null)
  };
  useEffect(() => {
    fetchEntries();
  }, []);


  const handleSearch = async () => {
    if (searchUUID) {
      const response = await fetch(`/api/addressbook/search?UUID=${searchUUID}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setSearchedUUID(searchUUID);
        // Optionally, set the form data if you're using it to display searched entry
      } else {
        alert('No entry found with the provided UUID.');
        setSearchedUUID(null);
      }
    } else {
      alert('Please provide a UUID to search.');
      setSearchedUUID(null);
    }
  };

  const fetchEntries = async () => {
    const response = await fetch('/api/addressbook/read');
    const data = await response.json() as Entry[];
    setEntries(data);
  };

  const handleEdit = (entry: Entry) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };


  // Adjusted handleDelete function
  const handleDelete = async (id: number) => {
    await fetch(`/api/addressbook/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setShowModal(false);
    fetchEntries(); // Refresh the entries after deletion
  };

  const requestSort = (key: keyof Entry) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction: direction as 'ascending' | 'descending' });
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      } else if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [entries, sortConfig]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch('/api/addressbook/read');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json() as Entry[];
        setEntries(data);
      } catch (error) {
        console.error('Error fetching entries:', error);
      }
    };

    fetchEntries();
  }, []);


  const clearFormFields = () => {
    setSelectedEntry({
      id: 0,
      UUID: '',
      name: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const entryData = {
      name: data.get('name') as string,
      email: data.get('email') as string,
      phone: data.get('phone') as string,
      address: data.get('address') as string,
    };

    if (selectedEntry && selectedEntry.id) {
      // PUT request to update an existing entry
      await fetch('/api/addressbook/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...entryData, id: selectedEntry.id }),
      });
      setSelectedEntry(null); // Clear the selected entry
      setShowModal(false);
      fetchEntries();
    } else {
      // POST request to create a new entry
      const response = await fetch('/api/addressbook/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });
      const data = await response.json();
      alert(`Successfully added! Your UUID is: ${data.UUID}`);
      clearFormFields(); // Clear the form fields after a successful add
      fetchEntries(); // Re-fetch entries
      setShowModal(false);
      setSelectedEntry(null); // Reset selectedEntry after form submission
    }
  };

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
          placeholder="Enter UUID to search"
          value={searchUUID}
          onChange={(e) => setSearchUUID(e.target.value)}
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          type="button"
          onClick={handleSearch}>
          Search
        </button>
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
          {sortedEntries.map((entry) => (
            <tr
              key={entry.id}
              onClick={() => handleEdit(entry)} // Make the row clickable
              className="cursor-pointer" // Change the cursor to indicate the row is clickable
              style={entry.UUID === searchedUUID ? { backgroundColor: '#FFD700' } : {}}
            >
              <td className="px-4 py-2">{entry.UUID}</td>
              <td className="px-4 py-2">{entry.name}</td>
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
        initialData={selectedEntry || { id: 0, UUID: '', name: '', email: '', phone: '', address: '' }} // Pass the initial data
        children={undefined}      />
    </div >
  );
};

export default AddressBook;
