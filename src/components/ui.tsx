import React from 'react';
import { DisplayStatus } from '../lib/invoice';

// Shared look: one place for the class strings every view reuses.
export const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900';

const BTN = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 ${FOCUS}`;
export const BTN_PRIMARY = `${BTN} bg-indigo-600 text-white hover:bg-indigo-700`;
export const BTN_SECONDARY = `${BTN} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700`;
export const BTN_DANGER = `${BTN} bg-red-600 text-white hover:bg-red-700`;

export const INPUT = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 aria-[invalid=true]:border-red-500`;

export const CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
export const PAGE_TITLE = 'text-2xl font-semibold tracking-tight text-slate-900 dark:text-white';
export const SUBTLE = 'text-slate-500 dark:text-slate-400';
export const LINK = `rounded text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400 ${FOCUS}`;

export const TABLE_WRAP = `${CARD} overflow-x-auto`;
export const TABLE = 'w-full min-w-[40rem] text-left text-sm';
export const THEAD = 'bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400';
export const TH = 'px-4 py-3 font-semibold';
export const TBODY = 'divide-y divide-slate-100 dark:divide-slate-800';
export const TR_CLICK = 'animate-fade-in cursor-pointer transition-colors hover:bg-indigo-50/60 dark:hover:bg-slate-800/70';
export const TD = 'px-4 py-3';
export const ROW_BTN = `rounded text-left font-medium text-slate-900 dark:text-slate-100 ${FOCUS}`;

export const ERROR_BOX = 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300';

const PILL: Record<DisplayStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  void: 'bg-slate-200 text-slate-600 line-through dark:bg-slate-700 dark:text-slate-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200',
};

export const StatusPill: React.FC<{ status: DisplayStatus }> = ({ status }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${PILL[status]}`}>{status}</span>
);

// Loading state: accessible status text plus a shimmer skeleton.
export const LoadingBlock: React.FC<{ label: string }> = ({ label }) => (
  <div role="status" className="animate-fade-in space-y-3">
    <span className={`text-sm ${SUBTLE}`}>{label}</span>
    <div className="skeleton h-10 w-full" />
    <div className="skeleton h-10 w-full" />
    <div className="skeleton h-10 w-2/3" />
  </div>
);
