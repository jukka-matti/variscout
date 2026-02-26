/**
 * Tests for findings utility functions
 */
import { describe, it, expect } from 'vitest';
import {
  filtersEqual,
  findDuplicateFinding,
  createFinding,
  createFindingComment,
  getFindingStatus,
  groupFindingsByStatus,
} from '../findings';
import type { Finding, FindingStatus } from '../findings';

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
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
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

describe('createFinding', () => {
  it('creates a finding with observed status by default', () => {
    const f = createFinding('test', { Machine: ['A'] }, 50);
    expect(f.status).toBe('observed');
    expect(f.comments).toEqual([]);
    expect(f.statusChangedAt).toBeGreaterThan(0);
    expect(f.id).toBeTruthy();
    expect(f.text).toBe('test');
  });

  it('accepts custom status', () => {
    const f = createFinding('test', {}, null, undefined, 'confirmed');
    expect(f.status).toBe('confirmed');
  });
});

describe('createFindingComment', () => {
  it('creates a comment with id, text, and timestamp', () => {
    const c = createFindingComment('Checked operator logs');
    expect(c.id).toBeTruthy();
    expect(c.text).toBe('Checked operator logs');
    expect(c.createdAt).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const c1 = createFindingComment('a');
    const c2 = createFindingComment('b');
    expect(c1.id).not.toBe(c2.id);
  });
});

describe('getFindingStatus', () => {
  it('returns the finding status', () => {
    const f: Finding = {
      id: 'f-1',
      text: 'Test',
      createdAt: 1000,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'confirmed',
      comments: [],
      statusChangedAt: 1000,
    };
    expect(getFindingStatus(f)).toBe('confirmed');
  });
});

describe('groupFindingsByStatus', () => {
  const makeFinding = (id: string, status: FindingStatus): Finding => ({
    id,
    text: `Finding ${id}`,
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    status,
    comments: [],
    statusChangedAt: Date.now(),
  });

  it('groups findings correctly', () => {
    const findings = [
      makeFinding('f-1', 'observed'),
      makeFinding('f-2', 'investigating'),
      makeFinding('f-3', 'confirmed'),
      makeFinding('f-4', 'dismissed'),
      makeFinding('f-5', 'observed'),
    ];
    const groups = groupFindingsByStatus(findings);
    expect(groups.observed).toHaveLength(2);
    expect(groups.investigating).toHaveLength(1);
    expect(groups.confirmed).toHaveLength(1);
    expect(groups.dismissed).toHaveLength(1);
  });

  it('returns empty arrays for empty input', () => {
    const groups = groupFindingsByStatus([]);
    expect(groups.observed).toEqual([]);
    expect(groups.investigating).toEqual([]);
    expect(groups.confirmed).toEqual([]);
    expect(groups.dismissed).toEqual([]);
  });
});
