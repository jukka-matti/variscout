/**
 * Tests for findings utility functions
 */
import { describe, it, expect } from 'vitest';
import {
  filtersEqual,
  findDuplicateFinding,
  findDuplicateBySource,
  createFinding,
  createFindingComment,
  createActionItem,
  createFindingOutcome,
  createQuestion,
  createImprovementIdea,
  getFindingStatus,
  groupFindingsByStatus,
  migrateFindingStatus,
  migrateFindings,
  migrateActionAssignee,
  FINDING_STATUSES,
  FINDING_STATUS_LABELS,
  FINDING_TAGS,
  FINDING_TAG_LABELS,
  PWA_STATUSES,
  computeRiskLevel,
} from '../findings';
import type { Finding, FindingAssignee, FindingStatus, FindingSource } from '../findings';
import { DEFAULT_TIME_LENS } from '../stats';

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

  it('groups findings correctly across 5 statuses', () => {
    const findings = [
      makeFinding('f-1', 'observed'),
      makeFinding('f-2', 'investigating'),
      makeFinding('f-3', 'analyzed'),
      makeFinding('f-4', 'improving'),
      makeFinding('f-5', 'resolved'),
      makeFinding('f-6', 'observed'),
    ];
    const groups = groupFindingsByStatus(findings);
    expect(groups.observed).toHaveLength(2);
    expect(groups.investigating).toHaveLength(1);
    expect(groups.analyzed).toHaveLength(1);
    expect(groups.improving).toHaveLength(1);
    expect(groups.resolved).toHaveLength(1);
  });

  it('returns empty arrays for empty input', () => {
    const groups = groupFindingsByStatus([]);
    expect(groups.observed).toEqual([]);
    expect(groups.investigating).toEqual([]);
    expect(groups.analyzed).toEqual([]);
    expect(groups.improving).toEqual([]);
    expect(groups.resolved).toEqual([]);
  });
});

describe('status constants', () => {
  it('FINDING_STATUSES has 5 statuses', () => {
    expect(FINDING_STATUSES).toEqual([
      'observed',
      'investigating',
      'analyzed',
      'improving',
      'resolved',
    ]);
  });

  it('FINDING_STATUS_LABELS matches statuses', () => {
    expect(FINDING_STATUS_LABELS.observed).toBe('Observed');
    expect(FINDING_STATUS_LABELS.investigating).toBe('Investigating');
    expect(FINDING_STATUS_LABELS.analyzed).toBe('Analyzed');
    expect(FINDING_STATUS_LABELS.improving).toBe('Improving');
    expect(FINDING_STATUS_LABELS.resolved).toBe('Resolved');
  });

  it('FINDING_TAGS has 2 tags', () => {
    expect(FINDING_TAGS).toEqual(['key-driver', 'low-impact']);
  });

  it('FINDING_TAG_LABELS matches tags', () => {
    expect(FINDING_TAG_LABELS['key-driver']).toBe('Key Driver');
    expect(FINDING_TAG_LABELS['low-impact']).toBe('Low Impact');
  });

  it('PWA_STATUSES is a subset of FINDING_STATUSES (first 3)', () => {
    expect(PWA_STATUSES).toEqual(['observed', 'investigating', 'analyzed']);
    for (const s of PWA_STATUSES) {
      expect(FINDING_STATUSES).toContain(s);
    }
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

// ============================================================================
// FindingSource Tests
// ============================================================================

describe('createFinding with source', () => {
  it('sets source field on the resulting finding', () => {
    const source: FindingSource = {
      chart: 'boxplot',
      category: 'Machine A',
      timeLens: DEFAULT_TIME_LENS,
    };
    const f = createFinding(
      'High spread on Machine A',
      { Machine: ['A'] },
      42,
      undefined,
      undefined,
      source
    );
    expect(f.source).toBeDefined();
    expect(f.source!.chart).toBe('boxplot');
    expect((f.source as { chart: 'boxplot'; category: string }).category).toBe('Machine A');
    expect(f.text).toBe('High spread on Machine A');
    expect(f.status).toBe('observed');
  });
});

describe('findDuplicateBySource', () => {
  const makeFindingWithSource = (id: string, source: FindingSource): Finding => ({
    id,
    text: `Finding ${id}`,
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    source,
  });

  it('finds duplicate by same chart + category', () => {
    const findings = [
      makeFindingWithSource('f-1', {
        chart: 'boxplot',
        category: 'Machine A',
        timeLens: DEFAULT_TIME_LENS,
      }),
      makeFindingWithSource('f-2', {
        chart: 'pareto',
        category: 'Shift B',
        timeLens: DEFAULT_TIME_LENS,
      }),
    ];
    const result = findDuplicateBySource(findings, {
      chart: 'boxplot',
      category: 'Machine A',
      timeLens: DEFAULT_TIME_LENS,
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe('f-1');
  });

  it('returns undefined for I-Chart (always unique)', () => {
    const findings = [
      makeFindingWithSource('f-1', {
        chart: 'ichart',
        anchorX: 0.5,
        anchorY: 0.3,
        timeLens: DEFAULT_TIME_LENS,
      }),
    ];
    const result = findDuplicateBySource(findings, {
      chart: 'ichart',
      anchorX: 0.5,
      anchorY: 0.3,
      timeLens: DEFAULT_TIME_LENS,
    });
    expect(result).toBeUndefined();
  });

  it('returns undefined when no match', () => {
    const findings = [
      makeFindingWithSource('f-1', {
        chart: 'boxplot',
        category: 'Machine A',
        timeLens: DEFAULT_TIME_LENS,
      }),
    ];
    const result = findDuplicateBySource(findings, {
      chart: 'boxplot',
      category: 'Machine B',
      timeLens: DEFAULT_TIME_LENS,
    });
    expect(result).toBeUndefined();
  });
});

// ============================================================================
// ActionItem Tests
// ============================================================================

describe('createActionItem', () => {
  it('creates an action item with text and timestamp', () => {
    const action = createActionItem('Replace gasket');
    expect(action.id).toBeTruthy();
    expect(action.text).toBe('Replace gasket');
    expect(action.createdAt).toBeGreaterThan(0);
    expect(action.assignee).toBeUndefined();
    expect(action.dueDate).toBeUndefined();
    expect(action.completedAt).toBeUndefined();
  });

  it('accepts optional assignee and dueDate', () => {
    const action = createActionItem(
      'Calibrate sensor',
      { upn: 'jane@co.com', displayName: 'Jane' },
      '2026-04-01'
    );
    expect(action.assignee).toEqual({ upn: 'jane@co.com', displayName: 'Jane' });
    expect(action.dueDate).toBe('2026-04-01');
  });

  it('generates unique ids', () => {
    const a1 = createActionItem('a');
    const a2 = createActionItem('b');
    expect(a1.id).not.toBe(a2.id);
  });
});

// ============================================================================
// FindingOutcome Tests
// ============================================================================

describe('createFindingOutcome', () => {
  it('creates an outcome with effectiveness and timestamp', () => {
    const outcome = createFindingOutcome('yes');
    expect(outcome.effective).toBe('yes');
    expect(outcome.verifiedAt).toBeGreaterThan(0);
    expect(outcome.notes).toBeUndefined();
    expect(outcome.cpkAfter).toBeUndefined();
  });

  it('accepts optional notes and cpkAfter', () => {
    const outcome = createFindingOutcome('partial', 'Improved but not fixed', 1.45);
    expect(outcome.effective).toBe('partial');
    expect(outcome.notes).toBe('Improved but not fixed');
    expect(outcome.cpkAfter).toBe(1.45);
  });

  it('accepts no effectiveness', () => {
    const outcome = createFindingOutcome('no', 'No change observed');
    expect(outcome.effective).toBe('no');
    expect(outcome.notes).toBe('No change observed');
  });
});

// ============================================================================
// Finding with 5-status fields
// ============================================================================

describe('Finding 5-status extensions', () => {
  it('Finding can have actions array', () => {
    const f = createFinding('Drift detected', {}, null);
    const action = createActionItem(
      'Replace part',
      { upn: 'bob@co.com', displayName: 'Bob' },
      '2026-04-15'
    );
    f.actions = [action];
    expect(f.actions).toHaveLength(1);
    expect(f.actions[0].text).toBe('Replace part');
  });

  it('Finding can have outcome', () => {
    const f = createFinding('OOS condition', {}, null);
    f.outcome = createFindingOutcome('yes', 'Cpk improved', 1.8);
    expect(f.outcome!.effective).toBe('yes');
    expect(f.outcome!.cpkAfter).toBe(1.8);
  });

  it('new fields default to undefined (backward compat)', () => {
    const f = createFinding('test', {}, null);
    expect(f.questionId).toBeUndefined();
    expect(f.actions).toBeUndefined();
    expect(f.outcome).toBeUndefined();
  });
});

// ============================================================================
// createHypothesis Tests
// ============================================================================

describe('createQuestion', () => {
  it('creates a question with required fields', () => {
    const q = createQuestion('Worn bearing on head 3');
    expect(q.id).toBeTruthy();
    expect(q.text).toBe('Worn bearing on head 3');
    expect(q.createdAt).toBeTruthy();
    expect(q.updatedAt).toBeTruthy();
    expect(q.linkedFindingIds).toEqual([]);
  });

  it('generates unique ids for each question', () => {
    const q1 = createQuestion('Cause A');
    const q2 = createQuestion('Cause B');
    expect(q1.id).not.toBe(q2.id);
  });

  it('accepts optional factor and level', () => {
    const q = createQuestion('Tool wear', 'Machine', 'A');
    expect(q.factor).toBe('Machine');
    expect(q.level).toBe('A');
  });

  it('defaults status to open', () => {
    const q = createQuestion('Vibration');
    expect(q.status).toBe('open');
  });
});

// ============================================================================
// FindingAssignee Tests
// ============================================================================

describe('FindingAssignee', () => {
  it('createFinding returns a finding without assignee by default', () => {
    const f = createFinding('test finding', { Machine: ['A'] }, 50);
    expect(f.assignee).toBeUndefined();
  });

  it('a finding can have assignee set after creation', () => {
    const f = createFinding('test finding', { Machine: ['A'] }, 50);
    const assignee = { upn: 'user@company.com', displayName: 'Jane Doe', userId: 'user-123' };
    f.assignee = assignee;
    expect(f.assignee).toBeDefined();
    expect(f.assignee!.upn).toBe('user@company.com');
    expect(f.assignee!.displayName).toBe('Jane Doe');
    expect(f.assignee!.userId).toBe('user-123');
  });

  it('assignee userId field is optional', () => {
    const f = createFinding('test finding', {}, null);
    const assignee = { upn: 'user@company.com', displayName: 'John Smith' };
    f.assignee = assignee;
    expect(f.assignee).toBeDefined();
    expect(f.assignee!.userId).toBeUndefined();
  });
});

// ============================================================================
// ImprovementIdea Tests
// ============================================================================

describe('createImprovementIdea', () => {
  it('creates idea with text and unique ID', () => {
    const idea = createImprovementIdea('Simplify setup with visual guides');
    expect(idea.id).toBeTruthy();
    expect(idea.text).toBe('Simplify setup with visual guides');
  });

  it('sets createdAt as ISO string', () => {
    const idea = createImprovementIdea('Reduce changeover time');
    expect(idea.createdAt).toBeTruthy();
    // ISO string format check
    expect(new Date(idea.createdAt).toISOString()).toBe(idea.createdAt);
  });

  it('no timeframe/projection/selected/notes by default', () => {
    const idea = createImprovementIdea('Add poka-yoke fixture');
    expect(idea.timeframe).toBeUndefined();
    expect(idea.projection).toBeUndefined();
    expect(idea.selected).toBeUndefined();
    expect(idea.notes).toBeUndefined();
    expect(idea.impactOverride).toBeUndefined();
  });

  it('generates unique ids', () => {
    const a = createImprovementIdea('Idea A');
    const b = createImprovementIdea('Idea B');
    expect(a.id).not.toBe(b.id);
  });
});

describe('computeRiskLevel', () => {
  it('returns correct levels for all 9 matrix cells', () => {
    // Row 1 (Small): low, medium, high
    expect(computeRiskLevel(1, 1)).toBe('low');
    expect(computeRiskLevel(1, 2)).toBe('medium');
    expect(computeRiskLevel(1, 3)).toBe('high');
    // Row 2 (Significant): medium, medium, high
    expect(computeRiskLevel(2, 1)).toBe('medium');
    expect(computeRiskLevel(2, 2)).toBe('medium');
    expect(computeRiskLevel(2, 3)).toBe('high');
    // Row 3 (Severe): high, high, very-high
    expect(computeRiskLevel(3, 1)).toBe('high');
    expect(computeRiskLevel(3, 2)).toBe('high');
    expect(computeRiskLevel(3, 3)).toBe('very-high');
  });
});

// ============================================================================
// migrateActionAssignee Tests
// ============================================================================

describe('migrateActionAssignee', () => {
  it('returns undefined for undefined input', () => {
    expect(migrateActionAssignee(undefined)).toBeUndefined();
  });

  it('converts a string assignee to FindingAssignee', () => {
    const result = migrateActionAssignee('Jane');
    expect(result).toEqual({ upn: 'Jane', displayName: 'Jane' });
  });

  it('passes through a FindingAssignee object unchanged', () => {
    const assignee: FindingAssignee = { upn: 'jane@co.com', displayName: 'Jane', userId: 'u-1' };
    const result = migrateActionAssignee(assignee);
    expect(result).toBe(assignee); // same reference
  });
});

// ============================================================================
// migrateFindings — action assignee migration
// ============================================================================

describe('migrateFindings action assignee migration', () => {
  it('migrates string assignees on actions to FindingAssignee', () => {
    const findings: Finding[] = [
      {
        id: 'f-1',
        text: 'Test',
        createdAt: 1000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'improving',
        comments: [],
        statusChangedAt: 1000,
        actions: [
          {
            id: 'a-1',
            text: 'Fix',
            assignee: 'Bob' as unknown as FindingAssignee,
            createdAt: 1000,
          },
        ],
      },
    ];
    const migrated = migrateFindings(findings);
    expect(migrated[0].actions![0].assignee).toEqual({ upn: 'Bob', displayName: 'Bob' });
  });

  it('does not alter actions without assignees', () => {
    const findings: Finding[] = [
      {
        id: 'f-1',
        text: 'Test',
        createdAt: 1000,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'improving',
        comments: [],
        statusChangedAt: 1000,
        actions: [{ id: 'a-1', text: 'Fix', createdAt: 1000 }],
      },
    ];
    const migrated = migrateFindings(findings);
    expect(migrated[0].actions![0].assignee).toBeUndefined();
  });
});
