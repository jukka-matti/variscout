import { describe, expect, it } from 'vitest';
import { createEmptyMap } from '../factories';

describe('createEmptyMap', () => {
  it('returns a v1 ProcessMap with no nodes or tributaries', () => {
    const map = createEmptyMap();
    expect(map.version).toBe(1);
    expect(map.nodes).toEqual([]);
    expect(map.tributaries).toEqual([]);
  });

  it('stamps createdAt and updatedAt with the same ISO timestamp', () => {
    const map = createEmptyMap();
    expect(map.createdAt).toBe(map.updatedAt);
    expect(() => new Date(map.createdAt).toISOString()).not.toThrow();
  });

  it('produces independent instances on each call', () => {
    const a = createEmptyMap();
    const b = createEmptyMap();
    expect(a).not.toBe(b);
    expect(a.nodes).not.toBe(b.nodes);
    expect(a.tributaries).not.toBe(b.tributaries);
  });
});
