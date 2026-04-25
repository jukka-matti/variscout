import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildProjectMetadata } from '../projectMetadata';
import type { ProjectMetadata } from '../projectMetadata';
import { createFinding, createQuestion, createActionItem } from '../findings';
import type { Finding, Question, ActionItem } from '../findings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  const base = createFinding('Test finding', {}, null);
  return { ...base, ...overrides };
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  const base = createQuestion('Test question');
  return { ...base, ...overrides };
}

function makeAction(overrides: Partial<ActionItem> = {}): ActionItem {
  const base = createActionItem('Test action');
  return { ...base, ...overrides };
}

// A fixed "now" so overdue comparisons are deterministic
const FIXED_NOW = new Date('2026-01-15T12:00:00.000Z').getTime();
const PAST_DATE = '2026-01-10'; // 5 days before FIXED_NOW
const FUTURE_DATE = '2026-01-20'; // 5 days after FIXED_NOW

// ---------------------------------------------------------------------------
// Phase detection
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — phase detection', () => {
  beforeEach(() => {
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "frame" when hasData is false', () => {
    const result = buildProjectMetadata([], [], false, 'local');
    expect(result.phase).toBe('frame');
  });

  it('returns "scout" when hasData and no findings', () => {
    const result = buildProjectMetadata([], [], true, 'local');
    expect(result.phase).toBe('scout');
  });

  it('returns "investigate" when findings exist but no actions', () => {
    const findings = [makeFinding(), makeFinding()];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(result.phase).toBe('investigate');
  });

  it('returns "improve" when at least one finding has actions', () => {
    const withAction = makeFinding({ actions: [makeAction()] });
    const withoutAction = makeFinding();
    const result = buildProjectMetadata([withAction, withoutAction], [], true, 'local');
    expect(result.phase).toBe('improve');
  });

  it('returns "investigate" when finding has empty actions array', () => {
    const finding = makeFinding({ actions: [] });
    const result = buildProjectMetadata([finding], [], true, 'local');
    expect(result.phase).toBe('investigate');
  });
});

// ---------------------------------------------------------------------------
// Finding counts by status
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — findingCounts', () => {
  it('returns empty counts when no findings', () => {
    const result = buildProjectMetadata([], [], true, 'local');
    expect(result.findingCounts).toEqual({});
  });

  it('counts findings correctly by status', () => {
    const findings = [
      makeFinding({ status: 'observed' }),
      makeFinding({ status: 'observed' }),
      makeFinding({ status: 'investigating' }),
      makeFinding({ status: 'analyzed' }),
      makeFinding({ status: 'improving' }),
      makeFinding({ status: 'resolved' }),
    ];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(result.findingCounts).toEqual({
      observed: 2,
      investigating: 1,
      analyzed: 1,
      improving: 1,
      resolved: 1,
    });
  });

  it('only counts statuses that appear (no zero-count keys)', () => {
    const findings = [makeFinding({ status: 'observed' })];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(Object.keys(result.findingCounts)).toEqual(['observed']);
  });
});

// ---------------------------------------------------------------------------
// Question counts by status (root only)
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — questionCounts', () => {
  it('returns empty counts when no questions', () => {
    const result = buildProjectMetadata([], [], true, 'local');
    expect(result.questionCounts).toEqual({});
  });

  it('counts root questions by status', () => {
    const questions = [
      makeQuestion({ status: 'open' }),
      makeQuestion({ status: 'answered' }),
      makeQuestion({ status: 'answered' }),
      makeQuestion({ status: 'ruled-out' }),
    ];
    const result = buildProjectMetadata([], questions, true, 'local');
    expect(result.questionCounts).toEqual({
      open: 1,
      answered: 2,
      'ruled-out': 1,
    });
  });

  it('excludes sub-questions (parentId set)', () => {
    const root = makeQuestion({ status: 'open' });
    const child = makeQuestion({ status: 'answered', parentId: root.id });
    const result = buildProjectMetadata([], [root, child], true, 'local');
    // Only root should be counted
    expect(result.questionCounts).toEqual({ open: 1 });
  });

  it('counts only root questions when mix of root and child', () => {
    const root1 = makeQuestion({ status: 'answered' });
    const root2 = makeQuestion({ status: 'investigating' });
    const child1 = makeQuestion({ status: 'open', parentId: root1.id });
    const child2 = makeQuestion({ status: 'ruled-out', parentId: root2.id });
    const result = buildProjectMetadata([], [root1, root2, child1, child2], true, 'local');
    expect(result.questionCounts).toEqual({ answered: 1, investigating: 1 });
  });
});

// ---------------------------------------------------------------------------
// Action counts: total, completed, overdue
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — actionCounts', () => {
  beforeEach(() => {
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zeros when no findings', () => {
    const result = buildProjectMetadata([], [], true, 'local');
    expect(result.actionCounts).toEqual({ total: 0, completed: 0, overdue: 0 });
  });

  it('returns zeros when findings have no actions', () => {
    const findings = [makeFinding(), makeFinding()];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(result.actionCounts).toEqual({ total: 0, completed: 0, overdue: 0 });
  });

  it('counts total actions across all findings', () => {
    const findings = [
      makeFinding({ actions: [makeAction(), makeAction()] }),
      makeFinding({ actions: [makeAction()] }),
    ];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(result.actionCounts.total).toBe(3);
  });

  it('counts completed actions (have completedAt)', () => {
    const findings = [
      makeFinding({
        actions: [
          makeAction({ completedAt: FIXED_NOW - 1000 }),
          makeAction(), // not completed
        ],
      }),
    ];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(result.actionCounts.completed).toBe(1);
  });

  it('counts overdue actions (dueDate in past, not completed)', () => {
    const findings = [
      makeFinding({
        actions: [
          makeAction({ dueDate: PAST_DATE }), // overdue
          makeAction({ dueDate: FUTURE_DATE }), // not overdue
          makeAction({ dueDate: PAST_DATE, completedAt: FIXED_NOW - 500 }), // past due but completed
        ],
      }),
    ];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(result.actionCounts.overdue).toBe(1);
  });

  it('handles actions with no dueDate (not counted as overdue)', () => {
    const findings = [makeFinding({ actions: [makeAction()] })];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(result.actionCounts.overdue).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Assigned task count for a specific userId
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — assignedTaskCount', () => {
  beforeEach(() => {
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 when no findings', () => {
    const result = buildProjectMetadata([], [], true, 'jane@contoso.com');
    expect(result.assignedTaskCount).toBe(0);
  });

  it('counts actions assigned to matching UPN', () => {
    const action1 = makeAction({ assignee: { upn: 'jane@contoso.com', displayName: 'Jane' } });
    const action2 = makeAction({ assignee: { upn: 'john@contoso.com', displayName: 'John' } });
    const action3 = makeAction({ assignee: { upn: 'jane@contoso.com', displayName: 'Jane' } });
    const findings = [
      makeFinding({ actions: [action1, action2] }),
      makeFinding({ actions: [action3] }),
    ];
    const result = buildProjectMetadata(findings, [], true, 'jane@contoso.com');
    expect(result.assignedTaskCount).toBe(2);
  });

  it('counts actions assigned to matching userId (Azure AD object ID)', () => {
    const action = makeAction({
      assignee: { upn: 'jane@contoso.com', displayName: 'Jane', userId: 'aad-1234' },
    });
    const findings = [makeFinding({ actions: [action] })];
    const result = buildProjectMetadata(findings, [], true, 'aad-1234');
    expect(result.assignedTaskCount).toBe(1);
  });

  it('returns 0 when userId does not match any assignee', () => {
    const action = makeAction({ assignee: { upn: 'other@contoso.com', displayName: 'Other' } });
    const findings = [makeFinding({ actions: [action] })];
    const result = buildProjectMetadata(findings, [], true, 'jane@contoso.com');
    expect(result.assignedTaskCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// hasOverdueTasks flag
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — hasOverdueTasks', () => {
  beforeEach(() => {
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is false when user has no assigned tasks', () => {
    const result = buildProjectMetadata([], [], true, 'jane@contoso.com');
    expect(result.hasOverdueTasks).toBe(false);
  });

  it('is false when assigned tasks are not overdue', () => {
    const action = makeAction({
      assignee: { upn: 'jane@contoso.com', displayName: 'Jane' },
      dueDate: FUTURE_DATE,
    });
    const findings = [makeFinding({ actions: [action] })];
    const result = buildProjectMetadata(findings, [], true, 'jane@contoso.com');
    expect(result.hasOverdueTasks).toBe(false);
  });

  it('is true when user has an overdue assigned task', () => {
    const action = makeAction({
      assignee: { upn: 'jane@contoso.com', displayName: 'Jane' },
      dueDate: PAST_DATE,
    });
    const findings = [makeFinding({ actions: [action] })];
    const result = buildProjectMetadata(findings, [], true, 'jane@contoso.com');
    expect(result.hasOverdueTasks).toBe(true);
  });

  it('is false when overdue task is already completed', () => {
    const action = makeAction({
      assignee: { upn: 'jane@contoso.com', displayName: 'Jane' },
      dueDate: PAST_DATE,
      completedAt: FIXED_NOW - 1000,
    });
    const findings = [makeFinding({ actions: [action] })];
    const result = buildProjectMetadata(findings, [], true, 'jane@contoso.com');
    expect(result.hasOverdueTasks).toBe(false);
  });

  it('is false when overdue task belongs to a different user', () => {
    const action = makeAction({
      assignee: { upn: 'other@contoso.com', displayName: 'Other' },
      dueDate: PAST_DATE,
    });
    const findings = [makeFinding({ actions: [action] })];
    const result = buildProjectMetadata(findings, [], true, 'jane@contoso.com');
    expect(result.hasOverdueTasks).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// lastViewedAt — preserve existing, don't modify
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — lastViewedAt', () => {
  it('returns empty object when no existing lastViewedAt', () => {
    const result = buildProjectMetadata([], [], false, 'local');
    expect(result.lastViewedAt).toEqual({});
  });

  it('preserves existing lastViewedAt unchanged', () => {
    const existing = { 'jane@contoso.com': 1700000000000, local: 1699000000000 };
    const result = buildProjectMetadata([], [], false, 'local', existing);
    expect(result.lastViewedAt).toEqual(existing);
  });

  it('does not mutate the existing lastViewedAt object', () => {
    const existing = { 'jane@contoso.com': 1700000000000 };
    const snapshot = { ...existing };
    buildProjectMetadata([], [], false, 'local', existing);
    expect(existing).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// Process Hub metadata
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — Process Hub fields', () => {
  it('defaults legacy projects into General / Unassigned', () => {
    const result = buildProjectMetadata([], [], true, 'local');
    expect(result.processHubId).toBe('general-unassigned');
    expect(result.investigationStatus).toBe('scouting');
  });

  it('copies investigation metadata and summaries from processContext', () => {
    const result = buildProjectMetadata([], [], true, 'local', undefined, {
      processHubId: 'line-4',
      investigationDepth: 'focused',
      investigationStatus: 'investigating',
      processOwner: { displayName: 'Olivia Owner', upn: 'olivia@example.com' },
      investigationOwner: { displayName: 'Eeva Engineer', upn: 'eeva@example.com' },
      sponsor: { displayName: 'Sam Sponsor', upn: 'sam@example.com' },
      contributors: [{ displayName: 'Fiona Field', upn: 'fiona@example.com' }],
      currentUnderstanding: { summary: 'Variation concentrates on night shift.' },
      problemCondition: { summary: 'Cpk is below target on Heads 5-8.' },
      nextMove: 'Inspect nozzle wear during night shift.',
    });

    expect(result.processHubId).toBe('line-4');
    expect(result.investigationDepth).toBe('focused');
    expect(result.investigationStatus).toBe('investigating');
    expect(result.processOwner?.displayName).toBe('Olivia Owner');
    expect(result.investigationOwner?.displayName).toBe('Eeva Engineer');
    expect(result.sponsor?.displayName).toBe('Sam Sponsor');
    expect(result.contributors?.[0]?.displayName).toBe('Fiona Field');
    expect(result.currentUnderstandingSummary).toBe('Variation concentrates on night shift.');
    expect(result.problemConditionSummary).toBe('Cpk is below target on Heads 5-8.');
    expect(result.nextMove).toBe('Inspect nozzle wear during night shift.');
  });
});

// ---------------------------------------------------------------------------
// Empty inputs — guard against crashes
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — empty inputs', () => {
  it('handles empty findings and questions without error', () => {
    const result: ProjectMetadata = buildProjectMetadata([], [], true, 'local');
    expect(result.phase).toBe('scout');
    expect(result.findingCounts).toEqual({});
    expect(result.questionCounts).toEqual({});
    expect(result.actionCounts).toEqual({ total: 0, completed: 0, overdue: 0 });
    expect(result.assignedTaskCount).toBe(0);
    expect(result.hasOverdueTasks).toBe(false);
  });

  it('handles findings with undefined actions gracefully', () => {
    const finding = makeFinding({ actions: undefined });
    const result = buildProjectMetadata([finding], [], true, 'local');
    expect(result.actionCounts.total).toBe(0);
  });
});
