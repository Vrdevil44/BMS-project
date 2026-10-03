// Invoice numbers look like INV-2026-0001 and come from a per-year counter in
// localStorage. A number is consumed when handed out and never given back, so a
// failed save or a deleted invoice leaves a gap rather than a reused number.
// Best-effort only: two tabs racing could collide, which is fine for a
// single-browser demo.

export const COUNTER_KEY = 'bms-invoice-counter-v1';
const NUMBER_RE = /^INV-(\d{4})-(\d{4,})$/;

type Counters = Record<string, number>;

export const formatInvoiceNumber = (year: number, seq: number): string =>
  `INV-${year}-${String(seq).padStart(4, '0')}`;

export function parseInvoiceNumber(v: string): { year: number; seq: number } | null {
  const m = NUMBER_RE.exec(v);
  return m ? { year: Number(m[1]), seq: Number(m[2]) } : null;
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readCounters(s: Storage | null): Counters {
  if (!s) return {};
  try {
    const parsed: unknown = JSON.parse(s.getItem(COUNTER_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Counters) : {};
  } catch {
    return {};
  }
}

let memoryFallback: Counters = {};

/**
 * Reserve and return the next invoice number for `year`.
 * `existing` (numbers already on invoices) guards against a cleared or stale counter.
 */
export function nextInvoiceNumber(existing: readonly string[] = [], year = new Date().getFullYear()): string {
  const s = storage();
  const counters = s ? readCounters(s) : memoryFallback;
  const stored = Number.isSafeInteger(counters[year]) ? counters[year] : 0;
  const highestExisting = existing.reduce((max, n) => {
    const p = parseInvoiceNumber(n);
    return p && p.year === year ? Math.max(max, p.seq) : max;
  }, 0);
  const seq = Math.max(stored, highestExisting) + 1;
  const updated = { ...counters, [year]: seq };
  if (s) {
    try {
      s.setItem(COUNTER_KEY, JSON.stringify(updated));
    } catch {
      memoryFallback = updated;
    }
  } else {
    memoryFallback = updated;
  }
  return formatInvoiceNumber(year, seq);
}

/** Test helper. */
export function _resetMemoryCounters() {
  memoryFallback = {};
}
