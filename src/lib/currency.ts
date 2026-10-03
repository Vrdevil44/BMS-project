// All money is an integer count of minor units (cents). No floats anywhere:
// parsing and formatting work on strings, and scaling uses integer division.
// Quantities are integer thousandths ("milli-units") so 1.5 hours = 1500.

export const QTY_SCALE = 1000;
export const BPS_SCALE = 10000; // tax rates are integer basis points: 8.25% = 825

const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', INR: '₹', JPY: '¥' };
const EXPONENTS: Record<string, number> = { JPY: 0 };

export const exponentFor = (currency: string): number => EXPONENTS[currency] ?? 2;

export function assertMinor(n: number, label = 'amount'): number {
  if (!Number.isSafeInteger(n)) throw new RangeError(`${label} must be a safe integer, got ${n}`);
  return n;
}

// Integer division rounding half away from zero. `d` must be a positive integer.
function divRound(n: number, d: number): number {
  const r = n % d; // exact for safe integers, unlike n - trunc(n / d) * d
  const q = (n - r) / d;
  if (Math.abs(r) * 2 >= d) return assertMinor(q + (n < 0 ? -1 : 1));
  return assertMinor(q);
}

function parseDecimalToScaled(input: string, exponent: number, allowNegative = false): number | null {
  const m = /^(-)?(\d{1,15})(?:\.(\d*))?$/.exec(input.trim().replace(/,/g, ''));
  if (!m) return null;
  const [, neg, whole, frac = ''] = m;
  if (neg && !allowNegative) return null;
  if (frac.length > exponent) return null; // never silently round user input
  const scaled = Number(whole) * 10 ** exponent + Number(frac.padEnd(exponent, '0') || '0');
  if (!Number.isSafeInteger(scaled)) return null;
  return neg ? -scaled : scaled;
}

/** "1,234.5" -> 123450. Returns null for anything that is not a plain decimal amount. */
export function parseAmountToMinor(input: string, currency = 'USD'): number | null {
  return parseDecimalToScaled(input, exponentFor(currency));
}

/** "1.5" -> 1500 milli-units. Up to 3 decimal places. */
export function parseQuantityToMilli(input: string): number | null {
  return parseDecimalToScaled(input, 3);
}

/** "8.25" (percent) -> 825 basis points. Up to 2 decimal places. */
export function parsePercentToBps(input: string): number | null {
  return parseDecimalToScaled(input, 2);
}

export function formatMinor(minor: number, currency = 'USD', locale = 'en-US'): string {
  assertMinor(minor);
  const exp = exponentFor(currency);
  const abs = Math.abs(minor);
  const unit = 10 ** exp;
  const whole = new Intl.NumberFormat(locale).format(Math.floor(abs / unit));
  const frac = exp > 0 ? `.${String(abs % unit).padStart(exp, '0')}` : '';
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return `${minor < 0 ? '-' : ''}${symbol}${whole}${frac}`;
}

/** quantity (milli-units) x unit rate (minor units), rounded half away from zero. */
export function lineTotalMinor(qtyMilli: number, rateMinor: number): number {
  assertMinor(qtyMilli, 'quantity');
  assertMinor(rateMinor, 'rate');
  return divRound(qtyMilli * rateMinor, QTY_SCALE);
}

export function sumMinor(values: readonly number[]): number {
  return values.reduce((acc, v) => assertMinor(acc + assertMinor(v)), 0);
}

export function taxMinor(subtotalMinor: number, rateBps: number): number {
  assertMinor(subtotalMinor, 'subtotal');
  assertMinor(rateBps, 'tax rate');
  return divRound(subtotalMinor * rateBps, BPS_SCALE);
}

export interface LineItem {
  qtyMilli: number;
  rateMinor: number;
}

export interface Totals {
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export function computeTotals(lines: readonly LineItem[], taxRateBps = 0): Totals {
  const subtotalMinor = sumMinor(lines.map((l) => lineTotalMinor(l.qtyMilli, l.rateMinor)));
  const tax = taxMinor(subtotalMinor, taxRateBps);
  return { subtotalMinor, taxMinor: tax, totalMinor: assertMinor(subtotalMinor + tax) };
}
