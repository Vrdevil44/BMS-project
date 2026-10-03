import React from 'react';
import { formatMinor } from '../../lib/currency';
import { MonthRevenue } from '../../lib/invoice';

const W = 480;
const H = 180;
const PAD = { top: 12, right: 8, bottom: 24, left: 8 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Hand-rolled SVG bars. The <table> alternative keeps the data readable by
// assistive tech (the SVG itself is a labelled image).
const RevenueChart: React.FC<{ data: MonthRevenue[]; currency: string }> = ({ data, currency }) => {
  const max = Math.max(...data.map((d) => d.totalMinor), 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = slot * 0.6;
  const label = (m: string) => MONTHS[Number(m.slice(5)) - 1];
  const summary = data.map((d) => `${label(d.month)} ${formatMinor(d.totalMinor, currency)}`).join(', ');

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Paid revenue by month in ${currency}: ${summary}`} className="w-full h-auto">
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="stroke-slate-300 dark:stroke-slate-600" />
        {data.map((d, i) => {
          const h = (d.totalMinor / max) * innerH;
          const x = PAD.left + i * slot + (slot - barW) / 2;
          return (
            <g key={d.month}>
              <title>{`${label(d.month)} ${d.month.slice(0, 4)}: ${formatMinor(d.totalMinor, currency)}`}</title>
              <rect
                x={x} y={H - PAD.bottom - h} width={barW} height={h} rx={2}
                className="animate-bar-grow fill-indigo-600 dark:fill-indigo-400"
                style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
              />
              {d.totalMinor > 0 && (
                <text x={x + barW / 2} y={H - PAD.bottom - h - 4} textAnchor="middle" fontSize="10" className="fill-slate-700 dark:fill-slate-300">
                  {formatMinor(d.totalMinor, currency)}
                </text>
              )}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" className="fill-slate-500 dark:fill-slate-400">{label(d.month)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">Paid revenue per month, {currency}</figcaption>
    </figure>
  );
};

export default RevenueChart;
