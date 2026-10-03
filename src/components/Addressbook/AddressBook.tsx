import React, { useState, useEffect, useMemo, useCallback } from 'react';
import EntryDialog from '../EntryDialog';
import { store, Entry } from '../../data';
import { EntryValues } from '../../lib/validation';
import CustomerDetail from './CustomerDetail';
import {
  BTN_PRIMARY, INPUT, LINK, LoadingBlock, PAGE_TITLE, ROW_BTN, SUBTLE, TABLE, TABLE_WRAP, TBODY, TD, TH, THEAD, TR_CLICK, FOCUS,
} from '../ui';
import { compareValues, customerInvoices, formatMoneyMap, isOverdue, isoDate, matchesQuery, totalBilled } from '../../lib/invoice';

type SortKey = keyof Entry | 'invoiceCount';
type OpenFilter = 'all' | 'open' | 'overdue' | 'none';

interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'UUID', label: 'UUID' },
  { key: 'name', label: 'Name' },
  { key: 'companyname', label: 'Company Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'invoiceCount', label: 'Invoices' },
];

const OPEN_FILTERS: { value: OpenFilter; label: string }[] = [
  { value: 'all', label: 'All customers' },
  { value: 'open', label: 'Has unpaid invoices' },
  { value: 'overdue', label: 'Has overdue invoices' },
  { value: 'none', label: 'No invoices' },
];

interface AddressBookProps {
  onOpenInvoice?: (id: string) => void;
  onNewInvoice?: (customerUUID: string) => void;
}

const AddressBook: React.FC<AddressBookProps> = ({ onOpenInvoice, onNewInvoice }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [invoices, setInvoices] = useState<Entry[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [openFilter, setOpenFilter] = useState<OpenFilter>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState<string>('');

  const fetchEntries = useCallback(async () => {
    try {
      const [records, invs] = await Promise.all([store.list('addressbook'), store.list('invoicebook')]);
      setEntries(records);
      setInvoices(invs);
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
    setDetailId(null);
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

  const requestSort = (key: SortKey) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending',
    });
  };

  const today = isoDate(new Date());

  const stats = useMemo(() => {
    const m = new Map<string, { count: number; open: boolean; overdue: boolean; billed: string }>();
    for (const c of entries) {
      const mine = customerInvoices(c, invoices);
      m.set(c.id, {
        count: mine.length,
        open: mine.some((i) => i.status === 'sent'),
        overdue: mine.some((i) => isOverdue(i, today)),
        billed: formatMoneyMap(totalBilled(mine)),
      });
    }
    return m;
  }, [entries, invoices, today]);

  const filteredSortedEntries = useMemo(() => {
    const countOf = (e: Entry) => stats.get(e.id)?.count ?? 0;
    return entries
      .filter((e) => matchesQuery(e, searchInput, ['UUID', 'name', 'companyname', 'email', 'phone', 'address']))
      .filter((e) => {
        const st = stats.get(e.id);
        if (openFilter === 'open') return !!st?.open;
        if (openFilter === 'overdue') return !!st?.overdue;
        if (openFilter === 'none') return countOf(e) === 0;
        return true;
      })
      .sort((a, b) =>
        sortConfig.key === 'invoiceCount'
          ? compareValues(countOf(a), countOf(b), sortConfig.direction)
          : compareValues(String(a[sortConfig.key] ?? ''), String(b[sortConfig.key] ?? ''), sortConfig.direction),
      );
  }, [entries, stats, sortConfig, searchInput, openFilter]);

  const detailCustomer = detailId ? entries.find((e) => e.id === detailId) ?? null : null;

  let statusMessage: React.ReactNode = null;
  if (loading) statusMessage = <LoadingBlock label="Loading customers…" />;
  else if (loadError)
    statusMessage = (
      <p role="alert" className={`mt-4 ${SUBTLE}`}>
        Could not load customers.{' '}
        <button type="button" className={LINK} onClick={() => { setLoading(true); fetchEntries(); }}>Try again</button>
      </p>
    );
  else if (entries.length === 0)
    statusMessage = <p role="status" className={`mt-4 ${SUBTLE}`}>No customers yet. Use Add to create the first one.</p>;
  else if (filteredSortedEntries.length === 0)
    statusMessage = (
      <p role="status" className={`mt-4 ${SUBTLE}`}>No customers match{searchInput.trim() ? ` “${searchInput}”` : ' this filter'}.{' '}
        <button type="button" className={LINK} onClick={() => { setSearchInput(''); setOpenFilter('all'); }}>Clear filters</button>
      </p>
    );

  const dialog = showModal && (
    <EntryDialog
      variant="dark"
      title={selectedEntry ? 'Edit Customer Details' : 'Add a New Customer'}
      noun="customer"
      initialData={selectedEntry}
      onClose={handleCloseModal}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );

  if (detailCustomer) {
    return (
      <>
        <CustomerDetail
          customer={detailCustomer}
          invoices={invoices}
          today={today}
          onBack={() => setDetailId(null)}
          onEdit={() => handleEdit(detailCustomer)}
          onOpenInvoice={(id) => onOpenInvoice?.(id)}
          onNewInvoice={(uuid) => onNewInvoice?.(uuid)}
        />
        {dialog}
      </>
    );
  }

  return (
    <div>
      <h1 className={`${PAGE_TITLE} mb-4`}>Customers</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleAddClick} className={BTN_PRIMARY}>
          Add
        </button>
        <label htmlFor="customers-search" className="sr-only">Search customers by ID, name, company, email, phone or address</label>
        <input
          id="customers-search"
          data-search=""
          className={`${INPUT} min-w-0 flex-1 basis-48`}
          type="text"
          placeholder="Search name, company, email, phone…  ( / )"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <label htmlFor="customers-filter" className="sr-only">Filter customers</label>
        <select id="customers-filter" className={`${INPUT} w-auto`} value={openFilter} onChange={(e) => setOpenFilter(e.target.value as OpenFilter)}>
          {OPEN_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div className={TABLE_WRAP}>
        <table className={`${TABLE} min-w-[56rem]`}>
          <caption className="sr-only">Customers list, sortable by column</caption>
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
            {filteredSortedEntries.map((entry) => (
              <tr key={entry.id} onClick={() => setDetailId(entry.id)} className={TR_CLICK}>
                <td className={`${TD} font-mono text-xs ${SUBTLE}`}>{entry.UUID}</td>
                <td className={TD}>
                  <button type="button" className={ROW_BTN} aria-label={`View ${entry.name}`}>
                    {entry.name}
                  </button>
                </td>
                <td className={TD}>{entry.companyname}</td>
                <td className={TD}>{entry.email}</td>
                <td className={`${TD} whitespace-nowrap`}>{entry.phone}</td>
                <td className={TD}>{entry.address}</td>
                <td className={`${TD} text-center`} title={stats.get(entry.id)?.billed}>{stats.get(entry.id)?.count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {statusMessage}
      {dialog}
    </div>
  );
};

export default AddressBook;
