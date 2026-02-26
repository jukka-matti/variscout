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
  migrateFindingStatus,
  migrateFindings,
  FINDING_STATUSES,
  FINDING_STATUS_LABELS,
  FINDING_TAGS,
  FINDING_TAG_LABELS,
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
    const f = createFinding('test', {}, null, undefined, 'analyzed');
    expect(f.status).toBe('analyzed');
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
      status: 'analyzed',
      comments: [],
      statusChangedAt: 1000,
    };
    expect(getFindingStatus(f)).toBe('analyzed');
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
      makeFinding('f-3', 'analyzed'),
      makeFinding('f-4', 'analyzed'),
      makeFinding('f-5', 'observed'),
    ];
    const groups = groupFindingsByStatus(findings);
    expect(groups.observed).toHaveLength(2);
    expect(groups.investigating).toHaveLength(1);
    expect(groups.analyzed).toHaveLength(2);
  });

  it('returns empty arrays for empty input', () => {
    const groups = groupFindingsByStatus([]);
    expect(groups.observed).toEqual([]);
    expect(groups.investigating).toEqual([]);
    expect(groups.analyzed).toEqual([]);
  });
});

describe('status constants', () => {
  it('FINDING_STATUSES has 3 statuses', () => {
    expect(FINDING_STATUSES).toEqual(['observed', 'investigating', 'analyzed']);
  });

  it('FINDING_STATUS_LABELS matches statuses', () => {
    expect(FINDING_STATUS_LABELS.observed).toBe('Observed');
    expect(FINDING_STATUS_LABELS.investigating).toBe('Investigating');
    expect(FINDING_STATUS_LABELS.analyzed).toBe('Analyzed');
  });

  it('FINDING_TAGS has 2 tags', () => {
    expect(FINDING_TAGS).toEqual(['key-driver', 'low-impact']);
  });

  it('FINDING_TAG_LABELS matches tags', () => {
    expect(FINDING_TAG_LABELS['key-driver']).toBe('Key Driver');
    expect(FINDING_TAG_LABELS['low-impact']).toBe('Low Impact');
  });
});

describe('migrateFindingStatus', () => {
  const makeOldFinding = (status: string, tag?: string): Finding => ({
    id: 'f-1',
    text: 'Test',
    createdAt: 1000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: status as FindingStatus,
    tag: tag as Finding['tag'],
    comments: [],
    statusChangedAt: 1000,
  });

  it('migrates confirmed → analyzed + key-driver', () => {
    const f = migrateFindingStatus(makeOldFinding('confirmed'));
    expect(f.status).toBe('analyzed');
    expect(f.tag).toBe('key-driver');
  });

  it('migrates dismissed → analyzed + low-impact', () => {
    const f = migrateFindingStatus(makeOldFinding('dismissed'));
    expect(f.status).toBe('analyzed');
    expect(f.tag).toBe('low-impact');
  });

  it('preserves existing tag on confirmed finding', () => {
    const f = migrateFindingStatus(makeOldFinding('confirmed', 'low-impact'));
    expect(f.status).toBe('analyzed');
    expect(f.tag).toBe('low-impact');
  });

  it('passes through observed unchanged', () => {
    const original = makeOldFinding('observed');
    const f = migrateFindingStatus(original);
    expect(f.status).toBe('observed');
    expect(f).toBe(original); // same reference
  });

  it('passes through investigating unchanged', () => {
    const original = makeOldFinding('investigating');
    const f = migrateFindingStatus(original);
    expect(f.status).toBe('investigating');
    expect(f).toBe(original);
  });

  it('passes through analyzed unchanged', () => {
    const original = makeOldFinding('analyzed');
    const f = migrateFindingStatus(original);
    expect(f.status).toBe('analyzed');
    expect(f).toBe(original);
  });
});

describe('migrateFindings', () => {
  it('migrates an array of findings with mixed statuses', () => {
    const findings: Finding[] = [
      {
        id: 'f-1',
        text: 'A',
        createdAt: 1000,
        status: 'observed' as FindingStatus,
        context: { activeFilters: {}, cumulativeScope: null },
        comments: [],
        statusChangedAt: 1000,
      },
      {
        id: 'f-2',
        text: 'B',
        createdAt: 2000,
        status: 'confirmed' as FindingStatus,
        context: { activeFilters: {}, cumulativeScope: null },
        comments: [],
        statusChangedAt: 2000,
      },
      {
        id: 'f-3',
        text: 'C',
        createdAt: 3000,
        status: 'dismissed' as FindingStatus,
        context: { activeFilters: {}, cumulativeScope: null },
        comments: [],
        statusChangedAt: 3000,
      },
    ];
    const migrated = migrateFindings(findings);
    expect(migrated[0].status).toBe('observed');
    expect(migrated[1].status).toBe('analyzed');
    expect(migrated[1].tag).toBe('key-driver');
    expect(migrated[2].status).toBe('analyzed');
    expect(migrated[2].tag).toBe('low-impact');
  });
});
