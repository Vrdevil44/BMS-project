import React from 'react';
import { Entry } from '../../data';
import { formatMinor } from '../../lib/currency';
import {
  customerInvoices, displayStatus, formatMoneyMap, invoiceCurrency, invoiceTotals, STATUS_STYLES, totalBilled,
} from '../../lib/invoice';

interface CustomerDetailProps {
  customer: Entry;
  invoices: Entry[];
  today: string;
  onBack: () => void;
  onEdit: () => void;
  onOpenInvoice: (id: string) => void;
  onNewInvoice: (customerUUID: string) => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, invoices, today, onBack, onEdit, onOpenInvoice, onNewInvoice }) => {
  const history = customerInvoices(customer, invoices);
  const billed = totalBilled(history);

  return (
    <div className="container mx-auto p-6 text-white">
      <button type="button" onClick={onBack} className="underline mb-2">← All customers</button>
      <h1 className="text-2xl font-semibold mb-1">{customer.name}</h1>
      {customer.companyname && <p className="mb-4">{customer.companyname}</p>}

      <div className="flex flex-wrap gap-x-10 gap-y-4 mb-4">
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
          <dt className="font-semibold">ID</dt><dd>{customer.UUID}</dd>
          <dt className="font-semibold">Email</dt><dd><a className="underline" href={`mailto:${customer.email}`}>{customer.email}</a></dd>
          <dt className="font-semibold">Phone</dt><dd>{customer.phone || '—'}</dd>
          <dt className="font-semibold">Address</dt><dd>{customer.address || '—'}</dd>
        </dl>
        <div>
          <p className="font-semibold">Total billed</p>
          <p className="text-2xl" data-testid="total-billed">{formatMoneyMap(billed)}</p>
          <p className="text-sm text-gray-200">Sent and paid invoices; drafts and voids excluded</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={onEdit} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md">Edit customer</button>
        <button type="button" onClick={() => onNewInvoice(customer.UUID)} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md">New invoice</button>
      </div>

      <h2 className="text-lg font-semibold mb-2">Invoice history</h2>
      {history.length === 0 ? (
        <p role="status">No invoices for this customer yet.</p>
      ) : (
        <table className="w-full border divide-y">
          <caption className="sr-only">Invoices for {customer.name}</caption>
          <thead className="bg-gray-300">
            <tr>
              {['Invoice #', 'Issued', 'Due', 'Status', 'Total'].map((h) => <th key={h} scope="col" className="px-4 py-2 text-left font-bold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {history.map((inv) => {
              const st = displayStatus(inv, today);
              return (
                <tr key={inv.id} onClick={() => onOpenInvoice(inv.id)} className="cursor-pointer transition duration-300 ease-in-out hover:bg-gray-900">
                  <td className="text-white px-4 py-2">
                    <button type="button" className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded">{inv.UUID}</button>
                  </td>
                  <td className="text-white px-4 py-2">{inv.issueDate ?? '—'}</td>
                  <td className="text-white px-4 py-2">{inv.dueDate ?? '—'}</td>
                  <td className="text-white px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${STATUS_STYLES[st]}`}>{st}</span></td>
                  <td className="text-white px-4 py-2 text-right">{formatMinor(invoiceTotals(inv).totalMinor, invoiceCurrency(inv))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CustomerDetail;
