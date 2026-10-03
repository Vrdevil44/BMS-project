import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysIso, compareValues, customerInvoices, dashboardStats, displayStatus, invoiceTotals, isOverdue, matchesQuery, monthlyRevenue, totalBilled,
} from './invoice';
import type { Entry } from '../data/types';

const base: Entry = { id: 'x', UUID: 'INV-2026-0001', name: 'Ada', companyname: '', email: 'ada@example.com', phone: '', address: '' };
const inv = (o: Partial<Entry>): Entry => ({
  ...base,
  customerUUID: 'CUST-1',
  lines: [{ description: 'Work', qtyMilli: 2000, rateMinor: 10000 }],
  taxRateBps: 1000,
  currency: 'USD',
  issueDate: '2026-10-01',
  dueDate: '2026-10-31',
  status: 'sent',
  ...o,
});
const TODAY = '2026-10-15';

test('invoiceTotals uses minor-unit math', () => {
  assert.deepEqual(invoiceTotals(inv({})), { subtotalMinor: 20000, taxMinor: 2000, totalMinor: 22000 });
  assert.deepEqual(invoiceTotals(base), { subtotalMinor: 0, taxMinor: 0, totalMinor: 0 });
});

test('overdue is derived: only sent invoices past their due date', () => {
  assert.equal(isOverdue(inv({ dueDate: '2026-10-14' }), TODAY), true);
  assert.equal(isOverdue(inv({ dueDate: '2026-10-15' }), TODAY), false);
  for (const status of ['draft', 'paid', 'void'] as const) assert.equal(isOverdue(inv({ dueDate: '2026-01-01', status }), TODAY), false);
  assert.equal(displayStatus(inv({ dueDate: '2026-10-01' }), TODAY), 'overdue');
  assert.equal(displayStatus(inv({ status: 'paid' }), TODAY), 'paid');
  assert.equal(displayStatus(base, TODAY), 'draft');
});

test('addDaysIso crosses month and year boundaries', () => {
  assert.equal(addDaysIso('2026-12-20', 30), '2027-01-19');
  assert.equal(addDaysIso('2026-02-01', 0), '2026-02-01');
});

test('dashboardStats', () => {
  const list = [
    inv({ id: 'a' }),
    inv({ id: 'b', dueDate: '2026-10-01' }),
    inv({ id: 'c', status: 'paid', paidDate: '2026-10-05' }),
    inv({ id: 'd', status: 'paid', paidDate: '2026-09-05' }),
    inv({ id: 'e', status: 'draft' }),
    inv({ id: 'f', status: 'void' }),
    inv({ id: 'g', currency: 'EUR' }),
  ];
  const s = dashboardStats(list, TODAY);
  assert.deepEqual(s.outstanding, { USD: 44000, EUR: 22000 });
  assert.deepEqual(s.paidThisMonth, { USD: 22000 });
  assert.equal(s.overdueCount, 1);
  assert.equal(s.recent.length, 5);
});

test('monthlyRevenue buckets paid invoices for one currency', () => {
  const list = [
    inv({ status: 'paid', paidDate: '2026-10-05' }),
    inv({ status: 'paid', paidDate: '2026-08-20' }),
    inv({ status: 'paid', paidDate: '2026-08-21', currency: 'EUR' }),
    inv({ status: 'paid', paidDate: '2025-01-01' }),
    inv({ status: 'sent' }),
  ];
  const r = monthlyRevenue(list, 'USD', TODAY, 4);
  assert.deepEqual(r.map((x) => x.month), ['2026-07', '2026-08', '2026-09', '2026-10']);
  assert.deepEqual(r.map((x) => x.totalMinor), [0, 22000, 0, 22000]);
});

test('customerInvoices and totalBilled', () => {
  const cust: Entry = { ...base, id: 'c', UUID: 'CUST-1' };
  const list = [inv({ id: 'a' }), inv({ id: 'b', customerUUID: 'CUST-2' }), inv({ id: 'c', status: 'void' }), inv({ id: 'd', status: 'paid' }), { ...base, id: 'legacy' }];
  const mine = customerInvoices(cust, list);
  assert.deepEqual(mine.map((i) => i.id).sort(), ['a', 'c', 'd', 'legacy']);
  assert.deepEqual(totalBilled(mine), { USD: 44000 });
});

test('matchesQuery and compareValues', () => {
  assert.equal(matchesQuery(base, 'ADA', ['name']), true);
  assert.equal(matchesQuery(base, 'zzz', ['name', 'email']), false);
  assert.equal(matchesQuery(base, '  ', ['name']), true);
  assert.ok(compareValues('INV-2026-0002', 'INV-2026-0010', 'ascending') < 0);
  assert.ok(compareValues(5, 10, 'descending') > 0);
});

test('input formatters round-trip with the parsers', async () => {
  const { parseAmountToMinor, parseQuantityToMilli, parsePercentToBps } = await import('./currency');
  const { minorToInput, milliToInput, bpsToInput, formatMoneyMap } = await import('./invoice');
  for (const v of [0, 5, 100, 123450, 8540]) assert.equal(parseAmountToMinor(minorToInput(v, 'USD')), v);
  assert.equal(minorToInput(1200, 'JPY'), '1200');
  for (const v of [500, 1000, 1500, 12500, 1]) assert.equal(parseQuantityToMilli(milliToInput(v)), v);
  for (const v of [0, 825, 2000, 5]) assert.equal(parsePercentToBps(bpsToInput(v)), v);
  assert.equal(formatMoneyMap({}), '—');
  assert.equal(formatMoneyMap({ USD: 123456, EUR: 500 }), '$1,234.56 · €5.00');
});
