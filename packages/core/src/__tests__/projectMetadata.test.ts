import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildProjectMetadata } from '../projectMetadata';
import type { ProjectMetadata } from '../projectMetadata';
import { createFinding, createActionItem } from '../findings';
import type { Finding, ActionItem } from '../findings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  const base = createFinding('Test finding', {}, null);
  return { ...base, ...overrides };
}

function makeAction(overrides: Partial<ActionItem> = {}): ActionItem {
  const base = createActionItem('Test action');
  return { ...base, ...overrides };
}

// A fixed "now" so phase comparisons are deterministic
const FIXED_NOW = new Date('2026-01-15T12:00:00.000Z').getTime();

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

  it('returns "analyze" when findings exist but no actions', () => {
    const findings = [makeFinding(), makeFinding()];
    const result = buildProjectMetadata(findings, [], true, 'local');
    expect(result.phase).toBe('analyze');
  });

  it('returns "improve" when at least one finding has actions', () => {
    const withAction = makeFinding({ actions: [makeAction()] });
    const withoutAction = makeFinding();
    const result = buildProjectMetadata([withAction, withoutAction], [], true, 'local');
    expect(result.phase).toBe('improve');
  });

  it('returns "analyze" when finding has empty actions array', () => {
    const finding = makeFinding({ actions: [] });
    const result = buildProjectMetadata([finding], [], true, 'local');
    expect(result.phase).toBe('analyze');
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
// Question counts — ADR-085: always empty (Question entity retired)
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — questionCounts (retired ADR-085)', () => {
  it('always returns empty object regardless of 2nd arg (retained for shape stability)', () => {
    // The 2nd arg is accepted but ignored; questionCounts is always {}
    const result = buildProjectMetadata([], [], true, 'local');
    expect(result.questionCounts).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Work-item projections shed in PO-4
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — PO-4 shed fields', () => {
  it('does not write actionCounts / assignedTaskCount / hasOverdueTasks (shed in PO-4)', () => {
    const withAction = makeFinding({
      actions: [makeAction({ assignee: { upn: 'jane@contoso.com', displayName: 'Jane' } })],
    });
    const result = buildProjectMetadata(
      [withAction],
      [],
      true,
      'jane@contoso.com'
    ) as unknown as Record<string, unknown>;
    expect(result.actionCounts).toBeUndefined();
    expect(result.assignedTaskCount).toBeUndefined();
    expect(result.hasOverdueTasks).toBeUndefined();
  });

  it('does not write the narrative projection fields (shed in PO-4)', () => {
    const result = buildProjectMetadata([], [], true, 'local', undefined, {
      processHubId: 'line-4',
      currentUnderstanding: { summary: 'Variation concentrates on night shift.' },
      nextMove: 'Inspect nozzle wear during night shift.',
    }) as unknown as Record<string, unknown>;
    expect(result.analyzeStatus).toBeUndefined();
    expect(result.analyzeDepth).toBeUndefined();
    expect(result.currentUnderstandingSummary).toBeUndefined();
    expect(result.problemConditionSummary).toBeUndefined();
    expect(result.nextMove).toBeUndefined();
    expect(result.processDescription).toBeUndefined();
    expect(result.customerRequirementSummary).toBeUndefined();
    expect(result.processMapSummary).toBeUndefined();
    expect(result.surveyReadiness).toBeUndefined();
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
// Process Hub metadata (KEEP set)
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — Process Hub fields', () => {
  it('defaults legacy projects into General / Unassigned', () => {
    const result = buildProjectMetadata([], [], true, 'local');
    expect(result.processHubId).toBe('general-unassigned');
  });

  it('copies the KEEP-set investigation metadata from processContext', () => {
    const result = buildProjectMetadata([], [], true, 'local', undefined, {
      processHubId: 'line-4',
      nodeMappings: [{ nodeId: 'fill', measurementColumn: 'Weight' }],
      migrationDeclinedAt: '2026-04-28T10:00:00.000Z',
      processOwner: { displayName: 'Olivia Owner', upn: 'olivia@example.com' },
      investigationOwner: { displayName: 'Eeva Engineer', upn: 'eeva@example.com' },
      sponsor: { displayName: 'Sam Sponsor', upn: 'sam@example.com' },
      contributors: [{ displayName: 'Fiona Field', upn: 'fiona@example.com' }],
    });

    expect(result.processHubId).toBe('line-4');
    expect(result.nodeMappings).toEqual([{ nodeId: 'fill', measurementColumn: 'Weight' }]);
    expect(result.migrationDeclinedAt).toBe('2026-04-28T10:00:00.000Z');
    expect(result.processOwner?.displayName).toBe('Olivia Owner');
    expect(result.investigationOwner?.displayName).toBe('Eeva Engineer');
    expect(result.sponsor?.displayName).toBe('Sam Sponsor');
    expect(result.contributors?.[0]?.displayName).toBe('Fiona Field');
  });

  it('does not copy review signal (projection retired — reviewSignal removed from ProjectMetadata)', () => {
    const result = buildProjectMetadata([], [], true, 'local');

    // reviewSignal is no longer written to ProjectMetadata (PO-2 retirement).
    // Load-bearing: fails if the projection write is ever re-added.
    expect((result as unknown as Record<string, unknown>).reviewSignal).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Empty inputs — guard against crashes
// ---------------------------------------------------------------------------

describe('buildProjectMetadata — empty inputs', () => {
  it('handles empty findings without error', () => {
    const result: ProjectMetadata = buildProjectMetadata([], [], true, 'local');
    expect(result.phase).toBe('scout');
    expect(result.findingCounts).toEqual({});
    expect(result.questionCounts).toEqual({});
  });

  it('handles findings with undefined actions gracefully', () => {
    const finding = makeFinding({ actions: undefined });
    const result = buildProjectMetadata([finding], [], true, 'local');
    expect(result.findingCounts).toEqual({ observed: 1 });
  });
});
