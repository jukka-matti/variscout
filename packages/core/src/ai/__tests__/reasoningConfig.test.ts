import { describe, it, expect } from 'vitest';
import { getCoScoutReasoningEffort } from '../reasoningConfig';

describe('getCoScoutReasoningEffort', () => {
  it('returns low for process surface', () => {
    expect(getCoScoutReasoningEffort('process')).toBe('low');
  });

  it('returns low for explore surface', () => {
    expect(getCoScoutReasoningEffort('explore')).toBe('low');
  });

  it('returns medium for analyze surface without staged data', () => {
    expect(getCoScoutReasoningEffort('analyze')).toBe('medium');
  });

  it('returns medium for analyze surface with hasStagedData = false', () => {
    expect(getCoScoutReasoningEffort('analyze', false)).toBe('medium');
  });

  it('returns high for analyze surface with staged data', () => {
    expect(getCoScoutReasoningEffort('analyze', true)).toBe('high');
  });

  it('returns low for report surface without staged data', () => {
    expect(getCoScoutReasoningEffort('report')).toBe('low');
  });

  it('returns low for report surface with staged data', () => {
    expect(getCoScoutReasoningEffort('report', true)).toBe('low');
  });

  it('returns low for undefined phase (default)', () => {
    expect(getCoScoutReasoningEffort()).toBe('low');
  });

  it('returns low as default for unknown phase', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getCoScoutReasoningEffort('unknown' as any)).toBe('low');
  });
});
