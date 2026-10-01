export interface Entry {
  id: string;
  UUID: string;
  name: string;
  companyname: string;
  email: string;
  phone: string;
  address: string;
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
