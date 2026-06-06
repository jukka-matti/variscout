import { describe, it, expect, beforeEach } from 'vitest';
import { useUnsavedHubsStore } from '../unsavedHubsStore';
import type { ProcessHub } from '@variscout/core/processHub';

const hub = (id: string, name = 'Untitled hub'): ProcessHub => ({
  id,
  name,
  createdAt: 1,
  deletedAt: null,
  updatedAt: 1,
});

describe('unsavedHubsStore', () => {
  beforeEach(() => {
    useUnsavedHubsStore.setState(useUnsavedHubsStore.getInitialState(), true);
  });

  it('upsertHub adds a new hub and isUnsaved reports it', () => {
    useUnsavedHubsStore.getState().upsertHub(hub('h1'));
    expect(useUnsavedHubsStore.getState().hubs).toHaveLength(1);
    expect(useUnsavedHubsStore.getState().isUnsaved('h1')).toBe(true);
    expect(useUnsavedHubsStore.getState().isUnsaved('h2')).toBe(false);
  });

  it('upsertHub replaces an existing entry by id (no duplicates)', () => {
    useUnsavedHubsStore.getState().upsertHub(hub('h1', 'A'));
    useUnsavedHubsStore.getState().upsertHub(hub('h1', 'B'));
    const hubs = useUnsavedHubsStore.getState().hubs;
    expect(hubs).toHaveLength(1);
    expect(hubs[0].name).toBe('B');
  });

  it('removeHub removes exactly one entry by id', () => {
    useUnsavedHubsStore.getState().upsertHub(hub('h1'));
    useUnsavedHubsStore.getState().upsertHub(hub('h2'));
    useUnsavedHubsStore.getState().removeHub('h1');
    expect(useUnsavedHubsStore.getState().isUnsaved('h1')).toBe(false);
    expect(useUnsavedHubsStore.getState().isUnsaved('h2')).toBe(true);
  });
});
