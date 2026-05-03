// apps/pwa/src/db/hubRepository.ts
import type { ProcessHub } from '@variscout/core/processHub';
import { db } from './schema';

const HUB_ID = 'hub-of-one';
const OPT_IN_KEY = 'persistence.optIn';

export const hubRepository = {
  async getOptInFlag(): Promise<boolean> {
    const row = await db.meta.get(OPT_IN_KEY);
    return Boolean(row?.value);
  },

  async setOptInFlag(value: boolean): Promise<void> {
    await db.meta.put({ key: OPT_IN_KEY, value });
    if (!value) {
      await this.clearHub();
    }
  },

  async saveHub(hub: ProcessHub): Promise<void> {
    await db.hubs.put({ id: HUB_ID, hub, savedAt: new Date().toISOString() });
  },

  async loadHub(): Promise<ProcessHub | null> {
    const row = await db.hubs.get(HUB_ID);
    return row?.hub ?? null;
  },

  async clearHub(): Promise<void> {
    await db.hubs.delete(HUB_ID);
  },

  async clearAll(): Promise<void> {
    await db.hubs.clear();
    await db.meta.clear();
  },
};
