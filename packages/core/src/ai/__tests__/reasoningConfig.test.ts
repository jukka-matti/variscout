import { describe, it, expect } from 'vitest';
import { getCoScoutReasoningEffort } from '../reasoningConfig';

describe('getCoScoutReasoningEffort', () => {
  it('returns "none" for frame phase', () => {
    expect(getCoScoutReasoningEffort('frame')).toBe('none');
  });

  it('returns "low" for scout phase', () => {
    expect(getCoScoutReasoningEffort('scout')).toBe('low');
  });

  it('returns "medium" for investigate phase', () => {
    expect(getCoScoutReasoningEffort('investigate')).toBe('medium');
  });

  it('returns "low" for improve phase', () => {
    expect(getCoScoutReasoningEffort('improve')).toBe('low');
  });

  it('returns "low" as default when phase is undefined', () => {
    expect(getCoScoutReasoningEffort(undefined)).toBe('low');
  });

  it('returns "low" as default for unknown phase', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getCoScoutReasoningEffort('unknown' as any)).toBe('low');
  });
});
