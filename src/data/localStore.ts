import { SEED } from './seed';
import { CollectionName, DataStore, Entry, EntryInput } from './types';

export const STORAGE_KEY = 'bms-demo-v1';
const PREFIX: Record<CollectionName, string> = { addressbook: 'CUST', invoicebook: 'INV' };

type Db = Record<CollectionName, Entry[]>;

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// Seeds only when the key is absent; never overwrites existing data.
function load(): Db {
  if (!hasStorage()) return clone(SEED);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    const seeded = clone(SEED);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Db;
  } catch {
    return clone(SEED);
  }
}

function save(db: Db) {
  if (hasStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

const newId = () => Math.random().toString(36).slice(2, 12);

export function resetDemoData() {
  if (hasStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clone(SEED)));
}

export const localStore: DataStore = {
  async list(c) {
    return [...load()[c]].reverse(); // newest first, like PocketBase '-created'
  },
  async get(c, id) {
    return load()[c].find((e) => e.id === id) ?? null;
  },
  async findByUUID(c, uuid) {
    return load()[c].find((e) => e.UUID === uuid) ?? null;
  },
  async create(c, data) {
    const db = load();
    const entry: Entry = {
      ...data,
      id: newId(),
      UUID: data.UUID || `${PREFIX[c]}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    db[c].push(entry);
    save(db);
    return entry;
  },
  async update(c, id, data) {
    const db = load();
    const i = db[c].findIndex((e) => e.id === id);
    if (i < 0) throw new Error(`${c}/${id} not found`);
    db[c][i] = { ...db[c][i], ...data } as Entry;
    save(db);
    return db[c][i];
  },
  async remove(c, id) {
    const db = load();
    db[c] = db[c].filter((e) => e.id !== id);
    save(db);
  },
};

export type { EntryInput };
