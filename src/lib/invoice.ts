// Invoice logic shared by the screen, the dashboard and the print/PDF view.
// Totals always come from computeTotals in currency.ts. Overdue is derived here
// and never stored.
import { computeTotals, exponentFor, formatMinor, Totals } from './currency';
import type { Entry, InvoiceStatus } from '../data/types';

export const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'void'];
export type DisplayStatus = InvoiceStatus | 'overdue';
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'];
export const PAYMENT_TERMS: { label: string; days: number }[] = [
  { label: 'Due on receipt', days: 0 },
  { label: 'Net 15', days: 15 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 60', days: 60 },
];

export const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}

export const invoiceStatus = (e: Entry): InvoiceStatus => e.status ?? 'draft';
export const invoiceCurrency = (e: Entry): string => e.currency ?? 'USD';

export function invoiceTotals(e: Entry): Totals {
  return computeTotals(e.lines ?? [], e.taxRateBps ?? 0);
}

/** Overdue = sent (unpaid, not draft/void) and due date strictly before `today`. */
export function isOverdue(e: Entry, today: string): boolean {
  return invoiceStatus(e) === 'sent' && !!e.dueDate && e.dueDate < today;
}

export function displayStatus(e: Entry, today: string): DisplayStatus {
  return isOverdue(e, today) ? 'overdue' : invoiceStatus(e);
}

export type MoneyByCurrency = Record<string, number>;
const add = (m: MoneyByCurrency, c: string, v: number) => {
  m[c] = (m[c] ?? 0) + v;
};

export interface DashboardStats {
  outstanding: MoneyByCurrency;
  paidThisMonth: MoneyByCurrency;
  overdueCount: number;
  overdueTotal: MoneyByCurrency;
  recent: Entry[];
}

/** Outstanding = sent invoices (incl. overdue). Drafts and voids never count. */
export function dashboardStats(invoices: readonly Entry[], today: string): DashboardStats {
  const month = today.slice(0, 7);
  const s: DashboardStats = { outstanding: {}, paidThisMonth: {}, overdueCount: 0, overdueTotal: {}, recent: [] };
  for (const inv of invoices) {
    const st = invoiceStatus(inv);
    const c = invoiceCurrency(inv);
    const total = invoiceTotals(inv).totalMinor;
    if (st === 'sent') {
      add(s.outstanding, c, total);
      if (isOverdue(inv, today)) {
        s.overdueCount += 1;
        add(s.overdueTotal, c, total);
      }
    } else if (st === 'paid' && (inv.paidDate ?? inv.issueDate ?? '').slice(0, 7) === month) {
      add(s.paidThisMonth, c, total);
    }
  }
  s.recent = [...invoices].sort((a, b) => (b.issueDate ?? '').localeCompare(a.issueDate ?? '')).slice(0, 5);
  return s;
}

export interface MonthRevenue {
  month: string; // YYYY-MM
  totalMinor: number;
}

/** Paid revenue for the last `months` months ending at `today`'s month, one currency. */
export function monthlyRevenue(invoices: readonly Entry[], currency: string, today: string, months = 6): MonthRevenue[] {
  const [y, m] = today.split('-').map(Number);
  const buckets: MonthRevenue[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    buckets.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, totalMinor: 0 });
  }
  for (const inv of invoices) {
    if (invoiceStatus(inv) !== 'paid' || invoiceCurrency(inv) !== currency) continue;
    const b = buckets.find((x) => x.month === (inv.paidDate ?? inv.issueDate ?? '').slice(0, 7));
    if (b) b.totalMinor += invoiceTotals(inv).totalMinor;
  }
  return buckets;
}

/** Customer's invoices (matched by customerUUID, falling back to email for legacy rows) and total billed per currency. */
export function customerInvoices(customer: Entry, invoices: readonly Entry[]): Entry[] {
  return invoices
    .filter((i) => (i.customerUUID ? i.customerUUID === customer.UUID : i.email.toLowerCase() === customer.email.toLowerCase()))
    .sort((a, b) => (b.issueDate ?? '').localeCompare(a.issueDate ?? ''));
}

/** Total billed = everything except drafts and voids. */
export function totalBilled(invoices: readonly Entry[]): MoneyByCurrency {
  const out: MoneyByCurrency = {};
  for (const inv of invoices) {
    const st = invoiceStatus(inv);
    if (st === 'sent' || st === 'paid') add(out, invoiceCurrency(inv), invoiceTotals(inv).totalMinor);
  }
  return out;
}

/** Case-insensitive match on any of the given fields. */
export function matchesQuery(e: Entry, q: string, fields: (keyof Entry)[]): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => String(e[f] ?? '').toLowerCase().includes(needle));
}

export function compareValues(a: string | number, b: string | number, dir: 'ascending' | 'descending'): number {
  const r = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'ascending' ? r : -r;
}

/** "$1,200.00 · €300.00", or an em dash when empty. */
export function formatMoneyMap(m: MoneyByCurrency): string {
  const parts = Object.entries(m).map(([c, v]) => formatMinor(v, c));
  return parts.length ? parts.join(' · ') : '—';
}

/** 123450 -> "1234.50" (no symbol or grouping), for editing in a text input. */
export function minorToInput(minor: number, currency: string): string {
  const exp = exponentFor(currency);
  const abs = Math.abs(minor);
  const unit = 10 ** exp;
  const frac = exp > 0 ? `.${String(abs % unit).padStart(exp, '0')}` : '';
  return `${minor < 0 ? '-' : ''}${Math.floor(abs / unit)}${frac}`;
}

/** 1500 milli-units -> "1.5". */
export function milliToInput(qtyMilli: number): string {
  const whole = Math.floor(qtyMilli / 1000);
  const frac = String(qtyMilli % 1000).padStart(3, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : String(whole);
}

/** "8.25" style percent text for basis points. */
export function bpsToInput(bps: number): string {
  const whole = Math.floor(bps / 100);
  const frac = String(bps % 100).padStart(2, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : String(whole);
}

export const STATUS_STYLES: Record<DisplayStatus, string> = {
  draft: 'bg-gray-200 text-gray-800',
  sent: 'bg-blue-100 text-blue-900',
  paid: 'bg-green-100 text-green-900',
  void: 'bg-gray-300 text-gray-700 line-through',
  overdue: 'bg-red-100 text-red-900',
};
