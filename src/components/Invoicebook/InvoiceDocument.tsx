import React from 'react';
import { Entry } from '../../data';
import { formatMinor, lineTotalMinor } from '../../lib/currency';
import { displayStatus, invoiceCurrency, invoiceTotals, STATUS_STYLES } from '../../lib/invoice';
import { milliToInput, bpsToInput } from '../../lib/invoice';

// One invoice, rendered for both the on-screen view and the print/PDF output.
// Every figure comes from invoiceTotals/lineTotalMinor, so they cannot diverge.
const InvoiceDocument: React.FC<{ invoice: Entry; today: string }> = ({ invoice, today }) => {
  const currency = invoiceCurrency(invoice);
  const totals = invoiceTotals(invoice);
  const status = displayStatus(invoice, today);
  const lines = invoice.lines ?? [];
  const money = (n: number) => formatMinor(n, currency);

  return (
    <article className="text-gray-900 bg-white p-6 text-sm" aria-label={`Invoice ${invoice.UUID}`}>
      <header className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold">Invoice</h3>
          <p className="font-mono">{invoice.UUID}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">BMS Demo Co.</p>
          <p className="text-gray-600">Fake demo data</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold uppercase ${STATUS_STYLES[status]}`}>{status}</span>
        </div>
      </header>

      <section className="flex justify-between mb-6">
        <div>
          <p className="text-xs uppercase text-gray-600">Bill to</p>
          <p className="font-semibold">{invoice.name}</p>
          {invoice.companyname && <p>{invoice.companyname}</p>}
          {invoice.address && <p>{invoice.address}</p>}
          <p>{invoice.email}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right h-min">
          <dt className="text-gray-600">Issued</dt>
          <dd>{invoice.issueDate ?? '—'}</dd>
          <dt className="text-gray-600">Due</dt>
          <dd>{invoice.dueDate ?? '—'}</dd>
          <dt className="text-gray-600">Terms</dt>
          <dd>{invoice.paymentTerms || '—'}</dd>
          {invoice.paidDate && (
            <>
              <dt className="text-gray-600">Paid</dt>
              <dd>{invoice.paidDate}</dd>
            </>
          )}
        </dl>
      </section>

      <table className="w-full mb-4">
        <thead>
          <tr className="border-b-2 border-gray-800 text-left">
            <th scope="col" className="py-1">Description</th>
            <th scope="col" className="py-1 text-right">Qty</th>
            <th scope="col" className="py-1 text-right">Rate</th>
            <th scope="col" className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr><td colSpan={4} className="py-2 text-gray-600">No line items.</td></tr>
          )}
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-gray-300">
              <td className="py-1">{l.description}</td>
              <td className="py-1 text-right">{milliToInput(l.qtyMilli)}</td>
              <td className="py-1 text-right">{money(l.rateMinor)}</td>
              <td className="py-1 text-right">{money(lineTotalMinor(l.qtyMilli, l.rateMinor))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto w-64 grid grid-cols-2 gap-y-1 text-right">
        <dt>Subtotal</dt>
        <dd>{money(totals.subtotalMinor)}</dd>
        <dt>Tax ({bpsToInput(invoice.taxRateBps ?? 0)}%)</dt>
        <dd>{money(totals.taxMinor)}</dd>
        <dt className="font-bold border-t border-gray-800 pt-1">Total ({currency})</dt>
        <dd className="font-bold border-t border-gray-800 pt-1">{money(totals.totalMinor)}</dd>
      </dl>

      {invoice.notes && (
        <section className="mt-6">
          <p className="text-xs uppercase text-gray-600">Notes</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </section>
      )}
    </article>
  );
};

export default InvoiceDocument;
