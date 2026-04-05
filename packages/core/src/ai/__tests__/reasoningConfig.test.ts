import { describe, it, expect } from 'vitest';
import { getCoScoutReasoningEffort } from '../reasoningConfig';

describe('getCoScoutReasoningEffort', () => {
  it('returns low for frame phase', () => {
    expect(getCoScoutReasoningEffort('frame')).toBe('low');
  });

  it('returns low for scout phase', () => {
    expect(getCoScoutReasoningEffort('scout')).toBe('low');
  });

  it('returns low for investigate phase with undefined sub-phase', () => {
    expect(getCoScoutReasoningEffort('investigate')).toBe('low');
  });

  it('returns low for investigate phase with initial sub-phase', () => {
    expect(getCoScoutReasoningEffort('investigate', 'initial')).toBe('low');
  });

  it('returns low for investigate phase with diverging sub-phase', () => {
    expect(getCoScoutReasoningEffort('investigate', 'diverging')).toBe('low');
  });

  it('returns medium for investigate phase with validating sub-phase', () => {
    expect(getCoScoutReasoningEffort('investigate', 'validating')).toBe('medium');
  });

  it('returns high for investigate phase with converging sub-phase', () => {
    expect(getCoScoutReasoningEffort('investigate', 'converging')).toBe('high');
  });

  it('returns low for improve phase without staged data', () => {
    expect(getCoScoutReasoningEffort('improve')).toBe('low');
  });

  it('returns low for improve phase with hasStagedData = false', () => {
    expect(getCoScoutReasoningEffort('improve', undefined, false)).toBe('low');
  });

  it('returns high for improve phase with staged data', () => {
    expect(getCoScoutReasoningEffort('improve', undefined, true)).toBe('high');
  });

  it('returns low for undefined phase (default)', () => {
    expect(getCoScoutReasoningEffort()).toBe('low');
  });

  it('returns low as default for unknown phase', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getCoScoutReasoningEffort('unknown' as any)).toBe('low');
  });
});
