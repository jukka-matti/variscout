import { describe, it, expect, vi } from 'vitest';
import { generateDeterministicId, type EntityBase } from './identity';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateDeterministicId', () => {
  it('returns RFC-4122-format UUIDs', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateDeterministicId()).toMatch(UUID_V4_REGEX);
    }
  });

  it('returns unique values across 1000 calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateDeterministicId());
    }
    expect(ids.size).toBe(1000);
  });

  it('throws when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    try {
      expect(() => generateDeterministicId()).toThrow('crypto.randomUUID unavailable');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('EntityBase type structure', () => {
  it('has the three required fields at runtime', () => {
    const makeEntity = (id: string, createdAt: number, deletedAt: number | null): EntityBase => ({
      id,
      createdAt,
      deletedAt,
    });

    const entity = makeEntity('abc-123', Date.now(), null);
    expect(typeof entity.id).toBe('string');
    expect(typeof entity.createdAt).toBe('number');
    expect(entity.deletedAt).toBeNull();

    const deleted = makeEntity('abc-456', Date.now(), Date.now());
    expect(typeof deleted.deletedAt).toBe('number');
  });
});
