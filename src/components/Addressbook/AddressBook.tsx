import React, { useState, useEffect, useMemo, useCallback } from 'react';
import EntryDialog from '../EntryDialog';
import { store, Entry } from '../../data';
import { EntryValues } from '../../lib/validation';

interface SortConfig {
  key: keyof Entry;
  direction: 'ascending' | 'descending';
}

const COLUMNS: { key: keyof Entry; label: string }[] = [
  { key: 'UUID', label: 'UUID' },
  { key: 'name', label: 'Name' },
  { key: 'companyname', label: 'Company Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
];

const AddressBook: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState<string>('');

  const fetchEntries = useCallback(async () => {
    try {
      const records = await store.list('addressbook');
      setEntries(records);
      setLoadError(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setEntries([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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

  const handleDelete = async () => {
    if (!selectedEntry) return;
    await store.remove('addressbook', selectedEntry.id);
    await fetchEntries();
    handleCloseModal();
  };

  const handleSave = async (values: EntryValues) => {
    if (selectedEntry) {
      await store.update('addressbook', selectedEntry.id, values);
    } else {
      await store.create('addressbook', values);
    }
    await fetchEntries();
    handleCloseModal();
  };

  const requestSort = (key: keyof Entry) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending',
    });
  };

  const filteredSortedEntries = useMemo(() => {
    const q = searchInput.toLowerCase();
    const filtered = entries.filter(
      (entry) => entry.name.toLowerCase().includes(q) || entry.UUID.toLowerCase().includes(q),
    );
    return filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [entries, sortConfig, searchInput]);

  let statusMessage: React.ReactNode = null;
  if (loading) statusMessage = <p role="status" className="mt-4 text-white">Loading customers…</p>;
  else if (loadError)
    statusMessage = (
      <p role="alert" className="mt-4 text-white">
        Could not load customers.{' '}
        <button type="button" className="underline" onClick={() => { setLoading(true); fetchEntries(); }}>Try again</button>
      </p>
    );
  else if (entries.length === 0)
    statusMessage = <p role="status" className="mt-4 text-white">No customers yet. Use Add to create the first one.</p>;
  else if (filteredSortedEntries.length === 0)
    statusMessage = <p role="status" className="mt-4 text-white">No customers match “{searchInput}”.</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-white">Customers</h1>
      <div className="flex items-center space-x-2 mb-4">
        <button
          type="button"
          onClick={handleAddClick}
          className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded-md"
        >
          Add
        </button>
        <label htmlFor="customers-search" className="sr-only">Search customers by UUID or name</label>
        <input
          id="customers-search"
          className="w-full p-2 border rounded text-gray-700"
          type="text"
          placeholder="Enter UUID or Name to search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <table className="w-max divide-y mt-4 text-gray-800">
        <caption className="sr-only">Customers list, sortable by column</caption>
        <thead className="bg-gray-300">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-2"
                aria-sort={sortConfig.key === col.key ? sortConfig.direction : 'none'}
              >
                <button
                  type="button"
                  className="font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-800 rounded"
                  onClick={() => requestSort(col.key)}
                >
                  {col.label} {sortConfig.key === col.key && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredSortedEntries.map((entry) => (
            <tr
              key={entry.id}
              onClick={() => handleEdit(entry)}
              className="cursor-pointer transition duration-300 ease-in-out hover:bg-gray-900"
            >
              <td className="text-white px-4 py-2">{entry.UUID}</td>
              <td className="text-white px-4 py-2">
                <button
                  type="button"
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded"
                  aria-label={`Edit ${entry.name}`}
                >
                  {entry.name}
                </button>
              </td>
              <td className="text-white px-4 py-2">{entry.companyname}</td>
              <td className="text-white px-4 py-2">{entry.email}</td>
              <td className="text-white px-4 py-2">{entry.phone}</td>
              <td className="text-white px-4 py-2">{entry.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {statusMessage}
      {showModal && (
        <EntryDialog
          variant="dark"
          title={selectedEntry ? 'Edit Customer Details' : 'Add a New Customer'}
          noun="customer"
          initialData={selectedEntry}
          onClose={handleCloseModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default AddressBook;
