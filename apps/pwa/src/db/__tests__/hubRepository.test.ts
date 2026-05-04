// apps/pwa/src/db/__tests__/hubRepository.test.ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { hubRepository } from '../hubRepository';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';

describe('hubRepository', () => {
  beforeEach(async () => {
    await hubRepository.clearAll();
  });

  it('getOptInFlag defaults to false on a fresh database', async () => {
    expect(await hubRepository.getOptInFlag()).toBe(false);
  });

  it('setOptInFlag(true) persists the flag', async () => {
    await hubRepository.setOptInFlag(true);
    expect(await hubRepository.getOptInFlag()).toBe(true);
  });

  it('saveHub + loadHub round-trip a Hub', async () => {
    const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'We mold barrels.' };
    await hubRepository.saveHub(hub);
    const loaded = await hubRepository.loadHub();
    expect(loaded?.processGoal).toBe('We mold barrels.');
  });

  it('saveHub overwrites the single row (Hub-of-one constraint)', async () => {
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'First' });
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'Second' });
    const loaded = await hubRepository.loadHub();
    expect(loaded?.processGoal).toBe('Second');
  });

  it('loadHub returns null when no Hub saved', async () => {
    expect(await hubRepository.loadHub()).toBeNull();
  });

  it('setOptInFlag(false) automatically clears the Hub', async () => {
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'X' });
    await hubRepository.setOptInFlag(true);
    await hubRepository.setOptInFlag(false);
    expect(await hubRepository.loadHub()).toBeNull();
  });

  it('clearHub removes the saved Hub but leaves opt-in flag', async () => {
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub({ ...DEFAULT_PROCESS_HUB, processGoal: 'X' });
    await hubRepository.clearHub();
    expect(await hubRepository.loadHub()).toBeNull();
    expect(await hubRepository.getOptInFlag()).toBe(true);
  });
});
