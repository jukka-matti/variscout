import { describe, it, expect } from 'vitest';
import type { ProcessHub } from '../processHub';
import type { ProcessMap } from '../frame/types';

describe('ProcessHub canonical map fields', () => {
  it('keeps the existing minimal shape', () => {
    const minimal: ProcessHub = {
      id: 'hub-1',
      name: 'Bottling Line A',
      createdAt: '2026-04-28T10:00:00.000Z',
    };
    expect(minimal.canonicalProcessMap).toBeUndefined();
    expect(minimal.canonicalMapVersion).toBeUndefined();
    expect(minimal.contextColumns).toBeUndefined();
  });

  it('accepts a hub with canonical map + version + context columns', () => {
    const map: ProcessMap = {
      version: 1,
      nodes: [{ id: 'n1', name: 'Fill', order: 0 }],
      tributaries: [],
      createdAt: '2026-04-28T10:00:00.000Z',
      updatedAt: '2026-04-28T10:00:00.000Z',
    };
    const hub: ProcessHub = {
      id: 'hub-1',
      name: 'Bottling Line A',
      createdAt: '2026-04-28T10:00:00.000Z',
      canonicalProcessMap: map,
      canonicalMapVersion: '2026-04-28T10:00:00Z',
      contextColumns: ['product', 'shift'],
    };
    expect(hub.canonicalProcessMap?.nodes).toHaveLength(1);
    expect(hub.canonicalMapVersion).toBe('2026-04-28T10:00:00Z');
    expect(hub.contextColumns).toEqual(['product', 'shift']);
  });
});
