import React, { useState, useEffect, useMemo, useCallback } from 'react';
import InvoiceDialog from './InvoiceDialog';
import InvoiceView from './InvoiceView';
import { store, Entry, EntryInput } from '../../data';
import { nextInvoiceNumber } from '../../lib/invoiceNumber';
import { formatMinor } from '../../lib/currency';
import {
  compareValues, displayStatus, DisplayStatus, invoiceCurrency, invoiceTotals, isoDate, matchesQuery, STATUS_STYLES,
} from '../../lib/invoice';

export type InvoiceIntent = { kind: 'view'; id: string } | { kind: 'new'; customerUUID: string };

type SortKey = 'UUID' | 'name' | 'issueDate' | 'dueDate' | 'status' | 'total';

interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'UUID', label: 'Invoice #' },
  { key: 'name', label: 'Customer' },
  { key: 'issueDate', label: 'Issued' },
  { key: 'dueDate', label: 'Due' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
];

const FILTERS: { value: DisplayStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
];

const InvoiceBook: React.FC<{ intent?: InvoiceIntent | null }> = ({ intent }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [customers, setCustomers] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [viewing, setViewing] = useState<Entry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [newForCustomer, setNewForCustomer] = useState<string | undefined>(
    intent?.kind === 'new' ? intent.customerUUID : undefined,
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issueDate', direction: 'descending' });
  const [showModal, setShowModal] = useState(intent?.kind === 'new');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'all'>('all');
  const [pendingViewId, setPendingViewId] = useState<string | null>(intent?.kind === 'view' ? intent.id : null);

  const today = isoDate(new Date());

  const fetchEntries = useCallback(async () => {
    try {
      const [records, custs] = await Promise.all([store.list('invoicebook'), store.list('addressbook')]);
      setEntries(records);
      setCustomers(custs);
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

  // Open the invoice a dashboard / customer link pointed at, once data is in.
  useEffect(() => {
    if (!pendingViewId || loading) return;
    const found = entries.find((e) => e.id === pendingViewId);
    if (found) setViewing(found);
    setPendingViewId(null);
  }, [pendingViewId, loading, entries]);

  const handleAddClick = () => {
    setSelectedEntry(null);
    setNewForCustomer(undefined);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEntry(null);
    setNewForCustomer(undefined);
  };

  const handleEdit = (entry: Entry) => {
    setViewing(null);
    setSelectedEntry(entry);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    await store.remove('invoicebook', selectedEntry.id);
    await fetchEntries();
    handleCloseModal();
  };

  const handleSave = async (values: EntryInput) => {
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

  const requestSort = (key: SortKey) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending',
    });
  };

  const filteredSortedEntries = useMemo(() => {
    const sortValue = (e: Entry): string | number => {
      switch (sortConfig.key) {
        case 'total': return invoiceTotals(e).totalMinor;
        case 'status': return displayStatus(e, today);
        case 'issueDate': return e.issueDate ?? '';
        case 'dueDate': return e.dueDate ?? '';
        default: return e[sortConfig.key];
      }
    };
    return entries
      .filter((e) => matchesQuery(e, searchInput, ['UUID', 'name', 'companyname', 'email']))
      .filter((e) => statusFilter === 'all' || displayStatus(e, today) === statusFilter)
      .sort((a, b) => compareValues(sortValue(a), sortValue(b), sortConfig.direction));
  }, [entries, sortConfig, searchInput, statusFilter, today]);

  const filtering = searchInput.trim() !== '' || statusFilter !== 'all';
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
    statusMessage = (
      <p role="status" className="mt-4 text-gray-800">
        No invoices match{searchInput.trim() ? ` “${searchInput}”` : ' these filters'}.{' '}
        {filtering && (
          <button type="button" className="underline" onClick={() => { setSearchInput(''); setStatusFilter('all'); }}>Clear filters</button>
        )}
      </p>
    );

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
        <label htmlFor="invoices-search" className="sr-only">Search invoices by number, customer, company or email</label>
        <input
          id="invoices-search"
          className="w-full p-2 border rounded text-gray-700"
          type="text"
          placeholder="Search number, customer, company or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <label htmlFor="invoices-status" className="sr-only">Filter by status</label>
        <select
          id="invoices-status"
          className="p-2 border rounded text-gray-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DisplayStatus | 'all')}
        >
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
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
          {filteredSortedEntries.map((entry) => {
            const status = displayStatus(entry, today);
            return (
              <tr
                key={entry.id}
                onClick={() => setViewing(entry)}
                className="cursor-pointer transition duration-300 ease-in-out hover:bg-purple-100"
              >
                <td className="px-4 py-2">{entry.UUID}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded"
                    aria-label={`View invoice ${entry.UUID} for ${entry.name}`}
                  >
                    {entry.name}
                  </button>
                  {entry.companyname && <span className="block text-sm text-gray-700">{entry.companyname}</span>}
                </td>
                <td className="px-4 py-2">{entry.issueDate ?? '—'}</td>
                <td className="px-4 py-2">{entry.dueDate ?? '—'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${STATUS_STYLES[status]}`}>{status}</span>
                </td>
                <td className="px-4 py-2 text-right">{formatMinor(invoiceTotals(entry).totalMinor, invoiceCurrency(entry))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {statusMessage}
      {viewing && (
        <InvoiceView invoice={viewing} today={today} onClose={() => setViewing(null)} onEdit={() => handleEdit(viewing)} />
      )}
      {showModal && (
        <InvoiceDialog
          invoice={selectedEntry}
          customers={customers}
          customerUUID={newForCustomer}
          onClose={handleCloseModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default InvoiceBook;
