import { describe, it, expect } from 'vitest';
import { djb2Hash } from '../hash';

describe('djb2Hash', () => {
  it('returns deterministic hash for same input', () => {
    const hash1 = djb2Hash('hello world');
    const hash2 = djb2Hash('hello world');
    expect(hash1).toBe(hash2);
  });

  it('returns different hashes for different inputs', () => {
    const hash1 = djb2Hash('hello');
    const hash2 = djb2Hash('world');
    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string', () => {
    const hash = djb2Hash('');
    expect(typeof hash).toBe('string');
    expect(hash).toBe('0');
  });

  it('handles unicode strings', () => {
    const hash1 = djb2Hash('日本語テスト');
    const hash2 = djb2Hash('日本語テスト');
    expect(hash1).toBe(hash2);
    // Different unicode strings produce different hashes
    const hash3 = djb2Hash('中文测试');
    expect(hash1).not.toBe(hash3);
  });

  it('handles strings with special characters', () => {
    const hash = djb2Hash('test\n\t\r special chars!@#$%');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('returns a string representation of a number', () => {
    const hash = djb2Hash('test');
    expect(hash).toMatch(/^-?\d+$/);
  });

  it('produces different hashes for similar strings', () => {
    const hash1 = djb2Hash('abc');
    const hash2 = djb2Hash('abd');
    expect(hash1).not.toBe(hash2);
  });

  it('handles very long strings', () => {
    const longStr = 'a'.repeat(10000);
    const hash = djb2Hash(longStr);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
});
