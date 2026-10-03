import React, { useEffect, useMemo, useState } from 'react';
import RevenueChart from './RevenueChart';
import { store, Entry } from '../../data';
import { formatMinor } from '../../lib/currency';
import {
  dashboardStats, displayStatus, formatMoneyMap, invoiceCurrency, invoiceTotals, isoDate, monthlyRevenue, STATUS_STYLES,
} from '../../lib/invoice';

const Tile: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="bg-white/70 rounded-lg p-4 min-w-[11rem]">
    <p className="text-sm text-gray-700">{label}</p>
    <p className="text-xl font-semibold">{value}</p>
    {hint && <p className="text-xs text-gray-700">{hint}</p>}
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

  if (loading) return <p role="status" className="p-6 text-gray-800">Loading dashboard…</p>;
  if (loadError)
    return (
      <p role="alert" className="p-6 text-gray-800">
        Could not load the dashboard.{' '}
        <button type="button" className="underline" onClick={() => { setLoading(true); load(); }}>Try again</button>
      </p>
    );

  return (
    <div className="container mx-auto p-6 text-gray-800 min-w-[44rem]">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      {invoices.length === 0 ? (
        <p role="status">No invoices yet. Add one from the Invoices tab and it will show up here.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <Tile label="Outstanding" value={formatMoneyMap(stats.outstanding)} hint="Sent, not yet paid" />
            <Tile label="Paid this month" value={formatMoneyMap(stats.paidThisMonth)} />
            <Tile
              label="Overdue"
              value={String(stats.overdueCount)}
              hint={stats.overdueCount ? `${formatMoneyMap(stats.overdueTotal)} past due` : 'Nothing past due'}
            />
          </div>

          <section className="mb-6" aria-labelledby="rev-h">
            <div className="flex items-center justify-between mb-2">
              <h2 id="rev-h" className="text-lg font-semibold">Monthly revenue (paid)</h2>
              {currencies.length > 1 && (
                <>
                  <label htmlFor="chart-currency" className="sr-only">Chart currency</label>
                  <select id="chart-currency" className="p-1 border rounded text-gray-700" value={currency} onChange={(e) => setChartCurrency(e.target.value)}>
                    {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </>
              )}
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <RevenueChart data={revenue} currency={currency} />
            </div>
          </section>

          <section aria-labelledby="recent-h">
            <h2 id="recent-h" className="text-lg font-semibold mb-2">Recent invoices</h2>
            <table className="w-full border divide-y">
              <caption className="sr-only">Five most recent invoices</caption>
              <thead className="bg-gray-300">
                <tr>
                  {['Invoice #', 'Customer', 'Issued', 'Status', 'Total'].map((h) => <th key={h} scope="col" className="px-4 py-2 text-left font-bold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((inv) => {
                  const st = displayStatus(inv, today);
                  return (
                    <tr key={inv.id} onClick={() => onOpenInvoice(inv.id)} className="cursor-pointer transition duration-300 ease-in-out hover:bg-purple-100">
                      <td className="px-4 py-2">
                        <button type="button" className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded">{inv.UUID}</button>
                      </td>
                      <td className="px-4 py-2">{inv.name}</td>
                      <td className="px-4 py-2">{inv.issueDate ?? '—'}</td>
                      <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${STATUS_STYLES[st]}`}>{st}</span></td>
                      <td className="px-4 py-2 text-right">{formatMinor(invoiceTotals(inv).totalMinor, invoiceCurrency(inv))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
