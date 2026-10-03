import React, { useEffect, useRef, useState } from 'react';
import Dialog from '../Dialog';
import { Entry, EntryInput, InvoiceStatus } from '../../data';
import { computeTotals, formatMinor, parseAmountToMinor, parsePercentToBps, parseQuantityToMilli } from '../../lib/currency';
import {
  addDaysIso, bpsToInput, CURRENCIES, invoiceCurrency, isoDate, milliToInput, minorToInput, PAYMENT_TERMS, STATUSES,
} from '../../lib/invoice';
import { FieldErrors, validateDueAfterIssue, validateIsoDate } from '../../lib/validation';

const INPUT = 'w-full p-2 border rounded text-gray-700';

interface LineDraft {
  description: string;
  qty: string;
  rate: string;
}

interface InvoiceDialogProps {
  invoice: Entry | null;
  customers: Entry[];
  /** Pre-select this customer on a new invoice. */
  customerUUID?: string;
  onClose: () => void;
  /** Throw to surface an error inside the dialog. */
  onSave: (values: EntryInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

const Err: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <p id={id} className="mt-1 text-sm text-red-700 bg-red-50 rounded px-2 py-1">{children}</p>
);

const Field: React.FC<{ id: string; label: string; error?: string; children: React.ReactNode }> = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm text-gray-800 mb-1">{label}</label>
    {children}
    {error && <Err id={`${id}-error`}>{error}</Err>}
  </div>
);

const InvoiceDialog: React.FC<InvoiceDialogProps> = ({ invoice, customers, customerUUID, onClose, onSave, onDelete }) => {
  const isEdit = !!invoice;
  const today = isoDate(new Date());
  const [customer, setCustomer] = useState(invoice?.customerUUID ?? customerUUID ?? '');
  const [currency, setCurrency] = useState(invoice ? invoiceCurrency(invoice) : 'USD');
  const [issueDate, setIssueDate] = useState(invoice?.issueDate ?? today);
  const [terms, setTerms] = useState(invoice?.paymentTerms ?? 'Net 30');
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? addDaysIso(today, 30));
  const [taxPct, setTaxPct] = useState(invoice ? bpsToInput(invoice.taxRateBps ?? 0) : '0');
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status ?? 'draft');
  const [notes, setNotes] = useState(invoice?.notes ?? '');
  const [lines, setLines] = useState<LineDraft[]>(
    invoice?.lines?.length
      ? invoice.lines.map((l) => ({ description: l.description, qty: milliToInput(l.qtyMilli), rate: minorToInput(l.rateMinor, invoiceCurrency(invoice)) }))
      : [{ description: '', qty: '1', rate: '' }],
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);
  useEffect(() => {
    if (confirmingDelete) keepRef.current?.focus();
  }, [confirmingDelete]);

  const clear = (key: string) => setErrors((e) => ({ ...e, [key]: undefined }));

  // Live totals from the same function the saved invoice and the PDF use.
  const parsedLines = lines.map((l) => ({ qty: parseQuantityToMilli(l.qty), rate: parseAmountToMinor(l.rate, currency) }));
  const taxBps = parsePercentToBps(taxPct);
  const preview = computeTotals(
    parsedLines.flatMap((l) => (l.qty !== null && l.rate !== null ? [{ qtyMilli: l.qty, rateMinor: l.rate }] : [])),
    taxBps ?? 0,
  );

  const setLine = (i: number, patch: Partial<LineDraft>) => {
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
    clear(`line-${i}`);
    clear('lines');
  };

  const handleTerms = (value: string) => {
    setTerms(value);
    const t = PAYMENT_TERMS.find((p) => p.label === value);
    if (t && !validateIsoDate(issueDate)) {
      setDueDate(addDaysIso(issueDate, t.days));
      clear('dueDate');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const found: FieldErrors = {};
    const cust = customers.find((c) => c.UUID === customer);
    if (!cust) found.customer = 'Choose a customer.';
    const issueErr = validateIsoDate(issueDate);
    if (issueErr) found.issueDate = issueErr;
    const dueErr = validateIsoDate(dueDate) ?? (issueErr ? null : validateDueAfterIssue(issueDate, dueDate));
    if (dueErr) found.dueDate = dueErr;
    if (taxBps === null || taxBps > 10000) found.tax = 'Enter a tax rate between 0 and 100, like 8.25.';
    lines.forEach((l, i) => {
      const p = parsedLines[i];
      if (!l.description.trim()) found[`line-${i}`] = 'Describe this line item.';
      else if (p.qty === null || p.qty <= 0) found[`line-${i}`] = 'Quantity must be a positive number (up to 3 decimals).';
      else if (p.rate === null || p.rate <= 0) found[`line-${i}`] = 'Rate must be a positive amount, like 125.00.';
    });
    if (notes.length > 1000) found.notes = 'Notes must be 1000 characters or fewer.';
    setErrors(found);
    setFormError(null);
    const firstKey = Object.keys(found).find((k) => found[k]);
    if (firstKey || !cust) {
      form.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)?.focus();
      return;
    }

    const paidDate = status === 'paid' ? invoice?.paidDate ?? today : undefined;
    const values: EntryInput = {
      name: cust.name,
      companyname: cust.companyname,
      email: cust.email,
      phone: cust.phone,
      address: cust.address,
      customerUUID: cust.UUID,
      lines: lines.map((l, i) => ({ description: l.description.trim(), qtyMilli: parsedLines[i].qty as number, rateMinor: parsedLines[i].rate as number })),
      taxRateBps: taxBps as number,
      currency,
      issueDate,
      dueDate,
      paymentTerms: terms,
      notes: notes.trim(),
      status,
      paidDate,
    };
    setBusy(true);
    try {
      await onSave(values);
    } catch (err) {
      console.error('Save error:', err);
      if (mounted.current) setFormError('Could not save this invoice. Please try again.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    setBusy(true);
    setFormError(null);
    try {
      await onDelete();
    } catch (err) {
      console.error('Delete error:', err);
      if (mounted.current) {
        setFormError('Could not delete this invoice. Please try again.');
        setConfirmingDelete(false);
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const err = (k: string) => errors[k];
  const aria = (id: string, k: string) => ({ 'aria-invalid': !!err(k), 'aria-describedby': err(k) ? `${id}-error` : undefined });
  const saveColor = isEdit ? 'bg-blue-700 hover:bg-blue-800' : 'bg-green-700 hover:bg-green-800';

  return (
    <Dialog title={isEdit ? `Edit Invoice ${invoice?.UUID}` : 'Add a New Invoice'} variant="light" onClose={onClose} wide>
      {() => (
        <form className="mb-2 space-y-4" noValidate onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="inv-customer" label="Customer (required)" error={err('customer')}>
              <select
                id="inv-customer"
                data-field="customer"
                data-autofocus=""
                className={INPUT}
                value={customer}
                onChange={(e) => { setCustomer(e.target.value); clear('customer'); }}
                {...aria('inv-customer', 'customer')}
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.UUID}>{c.name}{c.companyname ? ` — ${c.companyname}` : ''} ({c.UUID})</option>
                ))}
              </select>
            </Field>
            <Field id="inv-status" label="Status">
              <select id="inv-status" className={INPUT} value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
            <Field id="inv-issue" label="Issue date" error={err('issueDate')}>
              <input id="inv-issue" data-field="issueDate" className={INPUT} type="date" value={issueDate}
                onChange={(e) => { setIssueDate(e.target.value); clear('issueDate'); }} {...aria('inv-issue', 'issueDate')} />
            </Field>
            <Field id="inv-terms" label="Payment terms">
              <select id="inv-terms" className={INPUT} value={terms} onChange={(e) => handleTerms(e.target.value)}>
                {PAYMENT_TERMS.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
                {!PAYMENT_TERMS.some((p) => p.label === terms) && <option value={terms}>{terms}</option>}
              </select>
            </Field>
            <Field id="inv-due" label="Due date" error={err('dueDate')}>
              <input id="inv-due" data-field="dueDate" className={INPUT} type="date" value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); clear('dueDate'); }} {...aria('inv-due', 'dueDate')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="inv-currency" label="Currency">
                <select id="inv-currency" className={INPUT} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field id="inv-tax" label="Tax rate (%)" error={err('tax')}>
                <input id="inv-tax" data-field="tax" className={INPUT} type="text" inputMode="decimal" value={taxPct}
                  onChange={(e) => { setTaxPct(e.target.value); clear('tax'); }} {...aria('inv-tax', 'tax')} />
              </Field>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm text-gray-800 mb-1">Line items</legend>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i}>
                  <div className="flex gap-2 items-start">
                    <input aria-label={`Line ${i + 1} description`} data-field={`line-${i}`} className={`${INPUT} flex-grow`} type="text" placeholder="Description"
                      value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} aria-invalid={!!err(`line-${i}`)} aria-describedby={err(`line-${i}`) ? `line-${i}-error` : undefined} />
                    <input aria-label={`Line ${i + 1} quantity`} className={`${INPUT} w-20`} type="text" inputMode="decimal" placeholder="Qty"
                      value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                    <input aria-label={`Line ${i + 1} rate`} className={`${INPUT} w-28`} type="text" inputMode="decimal" placeholder="Rate"
                      value={l.rate} onChange={(e) => setLine(i, { rate: e.target.value })} />
                    <button
                      type="button"
                      aria-label={`Remove line ${i + 1}`}
                      disabled={lines.length === 1}
                      onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                      className="bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white px-3 py-2 rounded-md"
                    >
                      ×
                    </button>
                  </div>
                  {err(`line-${i}`) && <Err id={`line-${i}-error`}>{err(`line-${i}`)}</Err>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setLines((ls) => [...ls, { description: '', qty: '1', rate: '' }])}
              className="mt-2 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded-md text-sm">
              Add line
            </button>
          </fieldset>

          <dl className="ml-auto w-64 grid grid-cols-2 gap-y-1 text-right text-gray-800" aria-live="polite">
            <dt>Subtotal</dt><dd>{formatMinor(preview.subtotalMinor, currency)}</dd>
            <dt>Tax</dt><dd>{formatMinor(preview.taxMinor, currency)}</dd>
            <dt className="font-bold">Total</dt><dd className="font-bold">{formatMinor(preview.totalMinor, currency)}</dd>
          </dl>

          <Field id="inv-notes" label="Notes" error={err('notes')}>
            <textarea id="inv-notes" data-field="notes" className={INPUT} rows={2} value={notes}
              onChange={(e) => { setNotes(e.target.value); clear('notes'); }} {...aria('inv-notes', 'notes')} />
          </Field>

          {formError && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded px-2 py-1">{formError}</p>}

          {confirmingDelete ? (
            <div role="alertdialog" aria-label="Confirm delete invoice" className="rounded border border-red-300 bg-red-50 p-3 text-red-900">
              <p className="mb-3">Delete this invoice? This cannot be undone.</p>
              <button type="button" onClick={handleConfirmDelete} disabled={busy} className="bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white px-4 py-2 rounded-md mr-2">
                Yes, delete
              </button>
              <button type="button" ref={keepRef} onClick={() => setConfirmingDelete(false)} disabled={busy} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md">
                Keep it
              </button>
            </div>
          ) : (
            <>
              <button type="submit" disabled={busy} className={`${saveColor} disabled:opacity-60 text-white px-4 py-2 rounded-md mr-2`}>
                {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
              </button>
              {isEdit ? (
                <button type="button" className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md" onClick={() => setConfirmingDelete(true)}>
                  Delete
                </button>
              ) : (
                <button type="button" onClick={onClose} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md">
                  Cancel
                </button>
              )}
            </>
          )}
        </form>
      )}
    </Dialog>
  );
};

export default InvoiceDialog;
