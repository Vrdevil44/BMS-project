import React, { useEffect, useMemo, useState } from 'react';
import RevenueChart from './RevenueChart';
import {
  CARD, INPUT, LINK, LoadingBlock, PAGE_TITLE, ROW_BTN, StatusPill, SUBTLE, TABLE, TABLE_WRAP, TBODY, TD, TH, THEAD, TR_CLICK,
} from '../ui';
import { store, Entry } from '../../data';
import { formatMinor } from '../../lib/currency';
import {
  dashboardStats, displayStatus, formatMoneyMap, invoiceCurrency, invoiceTotals, isoDate, monthlyRevenue,
} from '../../lib/invoice';

const Tile: React.FC<{ label: string; value: string; hint?: string; accent?: string }> = ({ label, value, hint, accent }) => (
  <div className={`${CARD} animate-fade-in p-5`}>
    <p className={`text-sm ${SUBTLE}`}>{label}</p>
    <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
    {hint && <p className={`mt-1 text-xs ${SUBTLE}`}>{hint}</p>}
  </div>
);

const Dashboard: React.FC<{ onOpenInvoice: (id: string) => void }> = ({ onOpenInvoice }) => {
  const [invoices, setInvoices] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [chartCurrency, setChartCurrency] = useState<string | null>(null);
  const today = isoDate(new Date());

  const load = () => {
    store
      .list('invoicebook')
      .then((r) => { setInvoices(r); setLoadError(false); })
      .catch((e) => { console.error('Fetch error:', e); setLoadError(true); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const stats = useMemo(() => dashboardStats(invoices, today), [invoices, today]);
  const currencies = useMemo(() => {
    const paid = new Set(invoices.filter((i) => i.status === 'paid').map(invoiceCurrency));
    return paid.size ? Array.from(paid).sort() : ['USD'];
  }, [invoices]);
  const currency = chartCurrency && currencies.includes(chartCurrency) ? chartCurrency : currencies.includes('USD') ? 'USD' : currencies[0];
  const revenue = useMemo(() => monthlyRevenue(invoices, currency, today), [invoices, currency, today]);

  if (loading) return <LoadingBlock label="Loading dashboard…" />;
  if (loadError)
    return (
      <p role="alert" className={SUBTLE}>
        Could not load the dashboard.{' '}
        <button type="button" className={LINK} onClick={() => { setLoading(true); load(); }}>Try again</button>
      </p>
    );

  return (
    <div>
      <h1 className={`${PAGE_TITLE} mb-4`}>Dashboard</h1>
      {invoices.length === 0 ? (
        <p role="status" className={SUBTLE}>No invoices yet. Add one from the Invoices tab and it will show up here.</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Tile label="Outstanding" value={formatMoneyMap(stats.outstanding)} hint="Sent, not yet paid" />
            <Tile label="Paid this month" value={formatMoneyMap(stats.paidThisMonth)} accent="text-emerald-600 dark:text-emerald-400" />
            <Tile
              label="Overdue"
              value={String(stats.overdueCount)}
              accent={stats.overdueCount ? 'text-red-600 dark:text-red-400' : undefined}
              hint={stats.overdueCount ? `${formatMoneyMap(stats.overdueTotal)} past due` : 'Nothing past due'}
            />
          </div>

          <section className="mb-6" aria-labelledby="rev-h">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="rev-h" className="text-lg font-semibold text-slate-900 dark:text-white">Monthly revenue (paid)</h2>
              {currencies.length > 1 && (
                <>
                  <label htmlFor="chart-currency" className="sr-only">Chart currency</label>
                  <select id="chart-currency" className={`${INPUT} w-auto`} value={currency} onChange={(e) => setChartCurrency(e.target.value)}>
                    {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </>
              )}
            </div>
            <div className={`${CARD} p-4`}>
              <RevenueChart data={revenue} currency={currency} />
            </div>
          </section>

          <section aria-labelledby="recent-h">
            <h2 id="recent-h" className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Recent invoices</h2>
            <div className={TABLE_WRAP}>
              <table className={TABLE}>
                <caption className="sr-only">Five most recent invoices</caption>
                <thead className={THEAD}>
                  <tr>
                    {['Invoice #', 'Customer', 'Issued', 'Status', 'Total'].map((h) => <th key={h} scope="col" className={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody className={TBODY}>
                  {stats.recent.map((inv) => {
                    const st = displayStatus(inv, today);
                    return (
                      <tr key={inv.id} onClick={() => onOpenInvoice(inv.id)} className={TR_CLICK}>
                        <td className={TD}>
                          <button type="button" className={`${ROW_BTN} font-mono text-xs`}>{inv.UUID}</button>
                        </td>
                        <td className={TD}>{inv.name}</td>
                        <td className={`${TD} whitespace-nowrap`}>{inv.issueDate ?? '—'}</td>
                        <td className={TD}><StatusPill status={st} /></td>
                        <td className={`${TD} whitespace-nowrap text-right font-medium tabular-nums`}>{formatMinor(invoiceTotals(inv).totalMinor, invoiceCurrency(inv))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
