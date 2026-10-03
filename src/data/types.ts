export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

/** Invoice line: quantity in milli-units, rate in minor units (see src/lib/currency.ts). */
export interface InvoiceLine {
  description: string;
  qtyMilli: number;
  rateMinor: number;
}

export interface Entry {
  id: string;
  UUID: string;
  name: string;
  companyname: string;
  email: string;
  phone: string;
  address: string;
  // Invoice-only fields (optional so customers and pre-Phase-2 invoices stay valid).
  // name/companyname/email/phone/address on an invoice are the bill-to snapshot.
  customerUUID?: string;
  lines?: InvoiceLine[];
  taxRateBps?: number;
  currency?: string;
  issueDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  paymentTerms?: string;
  notes?: string;
  status?: InvoiceStatus;
  paidDate?: string; // YYYY-MM-DD, set when status becomes paid
}

export type EntryInput = Omit<Entry, 'id' | 'UUID'> & { UUID?: string };

export type CollectionName = 'addressbook' | 'invoicebook';

// Same shape as PocketBase's collection API, so either backend plugs in.
export interface DataStore {
  list(collection: CollectionName): Promise<Entry[]>;
  get(collection: CollectionName, id: string): Promise<Entry | null>;
  findByUUID(collection: CollectionName, uuid: string): Promise<Entry | null>;
  create(collection: CollectionName, data: EntryInput): Promise<Entry>;
  update(collection: CollectionName, id: string, data: Partial<EntryInput>): Promise<Entry>;
  remove(collection: CollectionName, id: string): Promise<void>;
}
