import PocketBase from 'pocketbase';
import { DataStore, Entry } from './types';

// Optional self-hosted backend. Enable with NEXT_PUBLIC_BMS_BACKEND=pocketbase
// (see README). Schema lives in pb_migrations/.
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

export const pocketbaseStore: DataStore = {
  list: (c) => pb.collection(c).getFullList<Entry>({ sort: '-created' }),
  get: (c, id) => pb.collection(c).getOne<Entry>(id).catch(() => null),
  findByUUID: (c, uuid) =>
    pb.collection(c).getFirstListItem<Entry>(`UUID="${uuid.replace(/(["\\])/g, '\\$1')}"`).catch(() => null),
  create: (c, data) => pb.collection(c).create<Entry>(data),
  update: (c, id, data) => pb.collection(c).update<Entry>(id, data),
  remove: async (c, id) => {
    await pb.collection(c).delete(id);
  },
};
