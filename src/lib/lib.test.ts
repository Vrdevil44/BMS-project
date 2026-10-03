import test from 'node:test';
import assert from 'node:assert/strict';
import { _resetMemoryCounters, formatInvoiceNumber, nextInvoiceNumber } from './invoiceNumber';
import { validateDueAfterIssue, validateEntry, validateIsoDate, validatePositiveMinor } from './validation';

test('invoice numbers increment, never repeat, and respect existing records', () => {
  _resetMemoryCounters();
  assert.equal(nextInvoiceNumber([], 2026), 'INV-2026-0001');
  assert.equal(nextInvoiceNumber([], 2026), 'INV-2026-0002');
  assert.equal(nextInvoiceNumber(['INV-2026-0010', 'CUST-1001'], 2026), 'INV-2026-0011');
  assert.equal(nextInvoiceNumber([], 2027), 'INV-2027-0001');
  assert.equal(formatInvoiceNumber(2026, 12345), 'INV-2026-12345');
});

test('validateEntry', () => {
  const ok = { name: 'Ada', companyname: '', email: 'ada@example.com', phone: '555-0101', address: '' };
  assert.deepEqual(validateEntry(ok), {});
  const bad = validateEntry({ ...ok, name: ' ', email: 'nope', phone: 'abc' });
  assert.deepEqual(Object.keys(bad).sort(), ['email', 'name', 'phone']);
  assert.equal(validateEntry({ ...ok, email: '' }).email, 'Email is required.');
});

test('amount and date checks', () => {
  assert.equal(validatePositiveMinor(100), null);
  assert.ok(validatePositiveMinor(0));
  assert.ok(validatePositiveMinor(null));
  assert.equal(validateIsoDate('2026-02-28'), null);
  assert.ok(validateIsoDate('2026-02-30'));
  assert.ok(validateIsoDate('1999-01-01'));
  assert.ok(validateIsoDate('26-1-1'));
  assert.equal(validateDueAfterIssue('2026-01-01', '2026-01-01'), null);
  assert.ok(validateDueAfterIssue('2026-01-02', '2026-01-01'));
});
