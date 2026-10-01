import { localStore } from './localStore';
import { pocketbaseStore } from './pocketbaseStore';
import { DataStore } from './types';

export const store: DataStore =
  process.env.NEXT_PUBLIC_BMS_BACKEND === 'pocketbase' ? pocketbaseStore : localStore;

export { resetDemoData } from './localStore';
export type { Entry, CollectionName } from './types';
