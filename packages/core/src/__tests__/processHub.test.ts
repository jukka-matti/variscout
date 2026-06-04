import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROCESS_HUB,
  DEFAULT_PROCESS_HUB_ID,
  asProcessHubId,
  isProcessHubId,
  normalizeProcessHubId,
} from '../processHub';

describe('processHub defaults', () => {
  it('normalizes missing legacy hub ids to General / Unassigned', () => {
    expect(normalizeProcessHubId(undefined)).toBe(DEFAULT_PROCESS_HUB_ID);
    expect(normalizeProcessHubId('')).toBe(DEFAULT_PROCESS_HUB_ID);
    expect(DEFAULT_PROCESS_HUB.name).toBe('General / Unassigned');
  });
});

describe('asProcessHubId', () => {
  it('returns a ProcessHubId whose string value equals the input', () => {
    const id = asProcessHubId('valid-hub');
    expect(id).toBe('valid-hub');
  });

  it('trims surrounding whitespace and returns the trimmed value', () => {
    const id = asProcessHubId('  trimmed-id  ');
    expect(id).toBe('trimmed-id');
  });

  it('throws on empty string with a message referencing asProcessHubId', () => {
    expect(() => asProcessHubId('')).toThrow(/asProcessHubId/);
  });

  it('throws on whitespace-only string (blank is treated as invalid)', () => {
    expect(() => asProcessHubId('   ')).toThrow();
  });
});

describe('isProcessHubId', () => {
  it('returns true for a non-empty string', () => {
    expect(isProcessHubId('hub-1')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isProcessHubId('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isProcessHubId(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isProcessHubId(undefined)).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isProcessHubId(42)).toBe(false);
  });

  it('returns false for a plain object', () => {
    expect(isProcessHubId({})).toBe(false);
  });
});
