import React, { useState, useEffect, useMemo, useCallback } from 'react';
import EntryDialog from '../EntryDialog';
import { store, Entry } from '../../data';
import { EntryValues } from '../../lib/validation';
import { nextInvoiceNumber } from '../../lib/invoiceNumber';

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

const InvoiceBook: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState<string>('');

  const fetchEntries = useCallback(async () => {
    try {
      const records = await store.list('invoicebook');
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
    await store.remove('invoicebook', selectedEntry.id);
    await fetchEntries();
    handleCloseModal();
  };

  const handleSave = async (values: EntryValues) => {
    if (selectedEntry) {
      await store.update('invoicebook', selectedEntry.id, values);
    } else {
      // The number is consumed even if the save fails, so it can never be reused.
      const UUID = nextInvoiceNumber(entries.map((e) => e.UUID));
      await store.create('invoicebook', { ...values, UUID });
    }
    await fetchEntries();
    handleCloseModal();
  };

  const lookupCustomer = async (uuid: string): Promise<EntryValues | null> => {
    try {
      const record = await store.findByUUID('addressbook', uuid);
      if (!record) return null;
      const { name, companyname, email, phone, address } = record;
      return { name, companyname, email, phone, address };
    } catch (error) {
      console.error('Error fetching customer data:', error);
      return null;
    }
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
  if (loading) statusMessage = <p role="status" className="mt-4 text-gray-800">Loading invoices…</p>;
  else if (loadError)
    statusMessage = (
      <p role="alert" className="mt-4 text-gray-800">
        Could not load invoices.{' '}
        <button type="button" className="underline" onClick={() => { setLoading(true); fetchEntries(); }}>Try again</button>
      </p>
    );
  else if (entries.length === 0)
    statusMessage = <p role="status" className="mt-4 text-gray-800">No invoices yet. Use Add to create the first one.</p>;
  else if (filteredSortedEntries.length === 0)
    statusMessage = <p role="status" className="mt-4 text-gray-800">No invoices match “{searchInput}”.</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">Invoices</h1>
      <div className="flex items-center space-x-2 mb-4">
        <button
          type="button"
          onClick={handleAddClick}
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md"
        >
          Add
        </button>
        <label htmlFor="invoices-search" className="sr-only">Search invoices by UUID or name</label>
        <input
          id="invoices-search"
          className="w-full p-2 border rounded text-gray-700"
          type="text"
          placeholder="Enter UUID or Name to search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <table className="w-full border divide-y mt-4 text-gray-800">
        <caption className="sr-only">Invoices list, sortable by column</caption>
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
              className="cursor-pointer transition duration-300 ease-in-out hover:bg-purple-100"
            >
              <td className="px-4 py-2">{entry.UUID}</td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded"
                  aria-label={`Edit ${entry.name}`}
                >
                  {entry.name}
                </button>
              </td>
              <td className="px-4 py-2">{entry.companyname}</td>
              <td className="px-4 py-2">{entry.email}</td>
              <td className="px-4 py-2">{entry.phone}</td>
              <td className="px-4 py-2">{entry.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {statusMessage}
      {showModal && (
        <EntryDialog
          variant="light"
          title={selectedEntry ? 'Edit Invoice Details' : 'Add a New Invoice'}
          noun="invoice"
          initialData={selectedEntry}
          onClose={handleCloseModal}
          onSave={handleSave}
          onDelete={handleDelete}
          lookupCustomer={lookupCustomer}
        />
      )}
    </div>
  );
};

export default InvoiceBook;
