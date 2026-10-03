import React from 'react';
import { Entry } from '../../data';
import {
  BTN_PRIMARY, BTN_SECONDARY, CARD, LINK, PAGE_TITLE, ROW_BTN, StatusPill, SUBTLE, TABLE, TABLE_WRAP, TBODY, TD, TH, THEAD, TR_CLICK,
} from '../ui';
import { formatMinor } from '../../lib/currency';
import {
  customerInvoices, displayStatus, formatMoneyMap, invoiceCurrency, invoiceTotals, totalBilled,
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
    <div>
      <button type="button" onClick={onBack} className={`${LINK} mb-3 text-sm`}>← All customers</button>
      <h1 className={PAGE_TITLE}>{customer.name}</h1>
      {customer.companyname && <p className={`mb-4 ${SUBTLE}`}>{customer.companyname}</p>}

      <div className="mb-4 mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <dl className={`${CARD} grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 p-5 text-sm`}>
          <dt className={SUBTLE}>ID</dt><dd className="font-mono text-xs">{customer.UUID}</dd>
          <dt className={SUBTLE}>Email</dt><dd className="break-all"><a className={LINK} href={`mailto:${customer.email}`}>{customer.email}</a></dd>
          <dt className={SUBTLE}>Phone</dt><dd>{customer.phone || '—'}</dd>
          <dt className={SUBTLE}>Address</dt><dd>{customer.address || '—'}</dd>
        </dl>
        <div className={`${CARD} p-5`}>
          <p className={`text-sm ${SUBTLE}`}>Total billed</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white" data-testid="total-billed">{formatMoneyMap(billed)}</p>
          <p className={`mt-1 text-xs ${SUBTLE}`}>Sent and paid invoices; drafts and voids excluded</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className={BTN_SECONDARY}>Edit customer</button>
        <button type="button" onClick={() => onNewInvoice(customer.UUID)} className={BTN_PRIMARY}>New invoice</button>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Invoice history</h2>
      {history.length === 0 ? (
        <p role="status" className={SUBTLE}>No invoices for this customer yet.</p>
      ) : (
        <div className={TABLE_WRAP}>
          <table className={TABLE}>
            <caption className="sr-only">Invoices for {customer.name}</caption>
            <thead className={THEAD}>
              <tr>
                {['Invoice #', 'Issued', 'Due', 'Status', 'Total'].map((h) => <th key={h} scope="col" className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody className={TBODY}>
              {history.map((inv) => {
                const st = displayStatus(inv, today);
                return (
                  <tr key={inv.id} onClick={() => onOpenInvoice(inv.id)} className={TR_CLICK}>
                    <td className={TD}>
                      <button type="button" className={`${ROW_BTN} font-mono text-xs`}>{inv.UUID}</button>
                    </td>
                    <td className={`${TD} whitespace-nowrap`}>{inv.issueDate ?? '—'}</td>
                    <td className={`${TD} whitespace-nowrap`}>{inv.dueDate ?? '—'}</td>
                    <td className={TD}><StatusPill status={st} /></td>
                    <td className={`${TD} whitespace-nowrap text-right font-medium tabular-nums`}>{formatMinor(invoiceTotals(inv).totalMinor, invoiceCurrency(inv))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
