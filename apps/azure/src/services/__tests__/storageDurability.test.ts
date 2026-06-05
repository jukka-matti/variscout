import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetPersistRequestedForTests,
  formatStorageEstimate,
  getStorageEstimate,
  requestPersistentStorageOnce,
} from '../storageDurability';

function installStorageManager(overrides: Partial<StorageManager> = {}) {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: {
      persist: vi.fn().mockResolvedValue(true),
      persisted: vi.fn().mockResolvedValue(false),
      estimate: vi.fn().mockResolvedValue({ usage: 12_582_912, quota: 2_147_483_648 }),
      ...overrides,
    },
  });
}

beforeEach(() => {
  _resetPersistRequestedForTests();
});

afterEach(() => {
  Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });
});

describe('storageDurability (PO-8b — greenfield StorageManager wiring)', () => {
  it('requestPersistentStorageOnce asks once per session (the gesture guard)', async () => {
    installStorageManager();
    const first = await requestPersistentStorageOnce();
    const second = await requestPersistentStorageOnce();
    expect(first).toBe(true);
    expect(second).toBeNull(); // once-guard
    expect((navigator.storage.persist as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('already-persisted short-circuits without prompting', async () => {
    installStorageManager({ persisted: vi.fn().mockResolvedValue(true) });
    expect(await requestPersistentStorageOnce()).toBe(true);
    expect(navigator.storage.persist).not.toHaveBeenCalled();
  });

  it('absent API → null, never a throw (jsdom / older Safari)', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });
    expect(await requestPersistentStorageOnce()).toBeNull();
    expect(await getStorageEstimate()).toBeNull();
  });

  it('getStorageEstimate + formatter produce the human summary (structural numbers only)', async () => {
    installStorageManager({ persisted: vi.fn().mockResolvedValue(true) });
    const info = await getStorageEstimate();
    expect(info).toEqual({ usageBytes: 12_582_912, quotaBytes: 2_147_483_648, persisted: true });
    expect(formatStorageEstimate(info!)).toBe('Using 12.0 MB of 2.0 GB · persistent: yes');
  });
});
