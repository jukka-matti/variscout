import { describe, expect, it } from 'vitest';
import { createEmptyMap } from '../factories';
import type { ProcessMapNode } from '../types';

describe('createEmptyMap', () => {
  it('returns a v1 ProcessMap with no nodes, tributaries, assignments, or arrows', () => {
    const map = createEmptyMap();
    expect(map.version).toBe(1);
    expect(map.nodes).toEqual([]);
    expect(map.tributaries).toEqual([]);
    expect(map.assignments).toEqual({});
    expect(map.arrows).toEqual([]);
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
    expect(a.assignments).not.toBe(b.assignments);
    expect(a.arrows).not.toBe(b.arrows);
  });

  it('allows nodes to reference a parent sub-step', () => {
    const child: ProcessMapNode = {
      id: 'seal-check',
      name: 'Seal check',
      order: 1,
      parentStepId: 'seal',
    };
    const topLevel: ProcessMapNode = {
      id: 'pack',
      name: 'Pack',
      order: 2,
      parentStepId: null,
    };

    expect(child.parentStepId).toBe('seal');
    expect(topLevel.parentStepId).toBeNull();
  });
});
