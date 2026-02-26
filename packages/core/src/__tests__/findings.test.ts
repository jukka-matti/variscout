/**
 * Tests for findings utility functions
 */
import { describe, it, expect } from 'vitest';
import { filtersEqual, findDuplicateFinding } from '../findings';
import type { Finding } from '../findings';

describe('filtersEqual', () => {
  it('returns true for identical filters', () => {
    const a = { Machine: ['A', 'B'], Shift: ['Day'] };
    const b = { Machine: ['A', 'B'], Shift: ['Day'] };
    expect(filtersEqual(a, b)).toBe(true);
  });

  it('returns true when values are in different order', () => {
    const a = { Machine: ['B', 'A'] };
    const b = { Machine: ['A', 'B'] };
    expect(filtersEqual(a, b)).toBe(true);
  });

  it('returns true when keys are in different order', () => {
    const a = { Shift: ['Night'], Machine: ['A'] };
    const b = { Machine: ['A'], Shift: ['Night'] };
    expect(filtersEqual(a, b)).toBe(true);
  });

  it('returns false when values differ', () => {
    const a = { Machine: ['A'] };
    const b = { Machine: ['B'] };
    expect(filtersEqual(a, b)).toBe(false);
  });

  it('returns false when one has an extra key', () => {
    const a = { Machine: ['A'] };
    const b = { Machine: ['A'], Shift: ['Day'] };
    expect(filtersEqual(a, b)).toBe(false);
  });

  it('returns true for both empty', () => {
    expect(filtersEqual({}, {})).toBe(true);
  });

  it('handles numeric values (cast to string for comparison)', () => {
    const a = { Head: [1, 2, 3] };
    const b = { Head: [3, 1, 2] };
    expect(filtersEqual(a, b)).toBe(true);
  });

  it('returns false when value counts differ', () => {
    const a = { Machine: ['A', 'B'] };
    const b = { Machine: ['A'] };
    expect(filtersEqual(a, b)).toBe(false);
  });
});

describe('findDuplicateFinding', () => {
  const makeFinding = (
    id: string,
    activeFilters: Record<string, (string | number)[]>
  ): Finding => ({
    id,
    text: `Finding ${id}`,
    createdAt: Date.now(),
    context: { activeFilters, cumulativeScope: null },
  });

  it('returns matching finding when filters match', () => {
    const findings = [
      makeFinding('f-1', { Machine: ['A'] }),
      makeFinding('f-2', { Machine: ['B'], Shift: ['Night'] }),
    ];
    const result = findDuplicateFinding(findings, { Shift: ['Night'], Machine: ['B'] });
    expect(result).toBeDefined();
    expect(result!.id).toBe('f-2');
  });

  it('returns undefined when no match', () => {
    const findings = [makeFinding('f-1', { Machine: ['A'] })];
    const result = findDuplicateFinding(findings, { Machine: ['C'] });
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty findings', () => {
    const result = findDuplicateFinding([], { Machine: ['A'] });
    expect(result).toBeUndefined();
  });
});
