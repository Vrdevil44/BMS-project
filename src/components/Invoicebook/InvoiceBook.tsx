import React, { useState, useEffect, useMemo, useCallback } from 'react';
import InvoiceDialog from './InvoiceDialog';
import InvoiceView from './InvoiceView';
import { store, Entry, EntryInput } from '../../data';
import {
  BTN_PRIMARY, FOCUS, INPUT, LINK, LoadingBlock, PAGE_TITLE, ROW_BTN, StatusPill, SUBTLE, TABLE, TABLE_WRAP, TBODY, TD, TH, THEAD, TR_CLICK,
} from '../ui';
import { nextInvoiceNumber } from '../../lib/invoiceNumber';
import { formatMinor } from '../../lib/currency';
import {
  compareValues, displayStatus, DisplayStatus, invoiceCurrency, invoiceTotals, isoDate, matchesQuery,
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
  if (loading) statusMessage = <LoadingBlock label="Loading invoices…" />;
  else if (loadError)
    statusMessage = (
      <p role="alert" className={`mt-4 ${SUBTLE}`}>
        Could not load invoices.{' '}
        <button type="button" className={LINK} onClick={() => { setLoading(true); fetchEntries(); }}>Try again</button>
      </p>
    );
  else if (entries.length === 0)
    statusMessage = <p role="status" className={`mt-4 ${SUBTLE}`}>No invoices yet. Use Add to create the first one.</p>;
  else if (filteredSortedEntries.length === 0)
    statusMessage = (
      <p role="status" className={`mt-4 ${SUBTLE}`}>
        No invoices match{searchInput.trim() ? ` “${searchInput}”` : ' these filters'}.{' '}
        {filtering && (
          <button type="button" className={LINK} onClick={() => { setSearchInput(''); setStatusFilter('all'); }}>Clear filters</button>
        )}
      </p>
    );

  return (
    <div>
      <h1 className={`${PAGE_TITLE} mb-4`}>Invoices</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleAddClick} className={BTN_PRIMARY}>
          Add
        </button>
        <label htmlFor="invoices-search" className="sr-only">Search invoices by number, customer, company or email</label>
        <input
          id="invoices-search"
          data-search=""
          className={`${INPUT} min-w-0 flex-1 basis-48`}
          type="text"
          placeholder="Search number, customer, company or email  ( / )"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <label htmlFor="invoices-status" className="sr-only">Filter by status</label>
        <select
          id="invoices-status"
          className={`${INPUT} w-auto`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DisplayStatus | 'all')}
        >
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <caption className="sr-only">Invoices list, sortable by column</caption>
          <thead className={THEAD}>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={TH}
                  aria-sort={sortConfig.key === col.key ? sortConfig.direction : 'none'}
                >
                  <button
                    type="button"
                    className={`rounded font-semibold uppercase tracking-wide hover:text-slate-900 dark:hover:text-white ${FOCUS}`}
                    onClick={() => requestSort(col.key)}
                  >
                    {col.label} {sortConfig.key === col.key && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={TBODY}>
            {filteredSortedEntries.map((entry) => {
              const status = displayStatus(entry, today);
              return (
                <tr key={entry.id} onClick={() => setViewing(entry)} className={TR_CLICK}>
                  <td className={`${TD} whitespace-nowrap font-mono text-xs`}>{entry.UUID}</td>
                  <td className={TD}>
                    <button type="button" className={ROW_BTN} aria-label={`View invoice ${entry.UUID} for ${entry.name}`}>
                      {entry.name}
                    </button>
                    {entry.companyname && <span className={`block text-xs ${SUBTLE}`}>{entry.companyname}</span>}
                  </td>
                  <td className={`${TD} whitespace-nowrap`}>{entry.issueDate ?? '—'}</td>
                  <td className={`${TD} whitespace-nowrap`}>{entry.dueDate ?? '—'}</td>
                  <td className={TD}><StatusPill status={status} /></td>
                  <td className={`${TD} whitespace-nowrap text-right font-medium tabular-nums`}>{formatMinor(invoiceTotals(entry).totalMinor, invoiceCurrency(entry))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
