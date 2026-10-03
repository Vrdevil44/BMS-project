import { addDaysIso, isoDate } from '../lib/invoice';
import { CollectionName, Entry, InvoiceLine, InvoiceStatus } from './types';

// All fake: invented names, example.com emails, 555-01xx phone numbers.
// Dates are relative to "today" so the demo always has one overdue invoice and
// some revenue this month, whenever it is opened.
const today = isoDate(new Date());
const ago = (days: number) => addDaysIso(today, -days);

const customers: Entry[] = [
  { id: 'c1', UUID: 'CUST-1001', name: 'Ada Quill', companyname: 'Quillworks Ltd', email: 'ada@example.com', phone: '555-0101', address: '1 Imaginary Lane, Faketown' },
  { id: 'c2', UUID: 'CUST-1002', name: 'Bram Teller', companyname: 'Teller & Sons', email: 'bram@example.com', phone: '555-0102', address: '22 Placeholder Ave, Nowhereville' },
  { id: 'c3', UUID: 'CUST-1003', name: 'Cleo Marsh', companyname: 'Marsh Mercantile', email: 'cleo@example.com', phone: '555-0103', address: '303 Sample Street, Exampleton' },
  { id: 'c4', UUID: 'CUST-1004', name: 'Dov Lindqvist', companyname: 'Lindqvist Logistics', email: 'dov@example.com', phone: '555-0104', address: '4 Test Road, Mockburg' },
];

const line = (description: string, qty: number, rate: number): InvoiceLine => ({ description, qtyMilli: Math.round(qty * 1000), rateMinor: Math.round(rate * 100) });

interface InvSpec {
  n: number;
  cust: string;
  issued: number; // days ago
  net: number;
  status: InvoiceStatus;
  paidAgo?: number;
  lines: InvoiceLine[];
  tax?: number;
  currency?: string;
  notes?: string;
}

const specs: InvSpec[] = [
  { n: 1, cust: 'c1', issued: 130, net: 30, status: 'paid', paidAgo: 105, lines: [line('Brand identity workshop', 1, 2400), line('Logo files and guidelines', 1, 600)], tax: 825 },
  { n: 2, cust: 'c3', issued: 105, net: 30, status: 'paid', paidAgo: 80, lines: [line('Quarterly bookkeeping', 3, 450)], tax: 825 },
  { n: 3, cust: 'c2', issued: 75, net: 15, status: 'paid', paidAgo: 58, lines: [line('Consulting (hours)', 12.5, 120), line('Travel expenses', 1, 85.4)], tax: 825 },
  { n: 4, cust: 'c4', issued: 52, net: 30, status: 'paid', paidAgo: 30, lines: [line('Route optimisation study', 1, 3200)], tax: 0 },
  { n: 5, cust: 'c1', issued: 28, net: 30, status: 'paid', paidAgo: 12, lines: [line('Website copy rewrite', 8, 95), line('Proofreading', 2.5, 60)], tax: 825 },
  { n: 6, cust: 'c3', issued: 20, net: 15, status: 'paid', paidAgo: 0, lines: [line('Inventory audit', 2, 520)], tax: 825 },
  { n: 7, cust: 'c2', issued: 55, net: 30, status: 'sent', lines: [line('Retainer: month 1', 1, 1800), line('Extra support hours', 4, 75)], tax: 825, notes: 'Second reminder sent. Please remit at your earliest convenience.' },
  { n: 8, cust: 'c4', issued: 6, net: 30, status: 'sent', lines: [line('Warehouse layout review', 1, 1450)], tax: 0 },
  { n: 9, cust: 'c1', issued: 2, net: 30, status: 'sent', currency: 'EUR', lines: [line('Translation (per 1,000 words)', 6, 70)], tax: 2000, notes: 'Amounts in EUR. Bank details on request.' },
  { n: 10, cust: 'c3', issued: 1, net: 30, status: 'draft', lines: [line('Spring catalogue photography', 1, 900)], tax: 825 },
  { n: 11, cust: 'c2', issued: 40, net: 30, status: 'void', lines: [line('Duplicate of INV-0003', 1, 1000)], tax: 825, notes: 'Voided: issued in error.' },
];

const year = new Date().getFullYear();
const invoices: Entry[] = specs.map((s) => {
  const c = customers.find((x) => x.id === s.cust) as Entry;
  const issueDate = ago(s.issued);
  return {
    id: `i${s.n}`,
    UUID: `INV-${year}-${String(s.n).padStart(4, '0')}`,
    name: c.name,
    companyname: c.companyname,
    email: c.email,
    phone: c.phone,
    address: c.address,
    customerUUID: c.UUID,
    lines: s.lines,
    taxRateBps: s.tax ?? 0,
    currency: s.currency ?? 'USD',
    issueDate,
    dueDate: addDaysIso(issueDate, s.net),
    paymentTerms: s.net === 0 ? 'Due on receipt' : `Net ${s.net}`,
    notes: s.notes ?? '',
    status: s.status,
    ...(s.paidAgo !== undefined ? { paidDate: ago(s.paidAgo) } : {}),
  };
});

export const SEED: Record<CollectionName, Entry[]> = { addressbook: customers, invoicebook: invoices };
