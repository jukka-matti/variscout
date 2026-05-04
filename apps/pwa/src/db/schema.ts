// apps/pwa/src/db/schema.ts
import Dexie, { type Table } from 'dexie';
import type { ProcessHub } from '@variscout/core/processHub';

export interface MetaRow {
  key: string;
  value: unknown;
}

export interface HubRow {
  id: string; // always 'hub-of-one' (single-row constraint)
  hub: ProcessHub;
  savedAt: string;
}

export class PwaDatabase extends Dexie {
  hubs!: Table<HubRow, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('variscout-pwa');
    this.version(1).stores({
      hubs: '&id',
      meta: '&key',
    });
  }
}

export const db = new PwaDatabase();
