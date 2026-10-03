export interface EntryValues {
  name: string;
  companyname: string;
  email: string;
  phone: string;
  address: string;
}

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS_RE = /^\+?[\d\s().-]+$/;
const MAX_LEN = 200;

export const isValidEmail = (v: string) => v.length <= 254 && EMAIL_RE.test(v);

export function isValidPhone(v: string): boolean {
  if (!PHONE_CHARS_RE.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

export function validateEntry(values: EntryValues): FieldErrors<keyof EntryValues> {
  const errors: FieldErrors<keyof EntryValues> = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (!name) errors.name = 'Name is required.';
  else if (name.length > MAX_LEN) errors.name = `Name must be ${MAX_LEN} characters or fewer.`;

  if (!email) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address, like name@example.com.';

  if (phone && !isValidPhone(phone)) errors.phone = 'Enter a valid phone number (7–15 digits).';

  if (values.companyname.trim().length > MAX_LEN) errors.companyname = `Company must be ${MAX_LEN} characters or fewer.`;
  if (values.address.trim().length > MAX_LEN) errors.address = `Address must be ${MAX_LEN} characters or fewer.`;
  return errors;
}

// ---- Amount / date checks, for forms that carry money and dates ----

/** Value is a minor-unit integer (already parsed), or null if the input did not parse. */
export function validatePositiveMinor(minor: number | null): string | null {
  if (minor === null) return 'Enter a valid amount, like 125.00.';
  if (minor <= 0) return 'Amount must be greater than zero.';
  return null;
}

export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

/** Strict YYYY-MM-DD that is a real calendar date within a sane year range. */
export function validateIsoDate(v: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return 'Enter a date as YYYY-MM-DD.';
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return 'That date does not exist.';
  if (y < MIN_YEAR || y > MAX_YEAR) return `Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`;
  return null;
}

/** Due date must not be before the issue date. ISO strings compare correctly as text. */
export function validateDueAfterIssue(issue: string, due: string): string | null {
  return due < issue ? 'Due date cannot be before the issue date.' : null;
}
