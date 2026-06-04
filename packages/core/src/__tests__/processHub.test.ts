import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROCESS_HUB,
  DEFAULT_PROCESS_HUB_ID,
  asProcessHubId,
  buildProcessHubRollups,
  isProcessHubId,
  normalizeProcessHubId,
} from '../processHub';
import type { ProcessHub } from '../index';
import type { ProcessHubAnalyzeMetadata } from '../processHub';
import type { EvidenceSnapshot } from '../evidenceSources';

function makeMetadata(
  overrides: Partial<ProcessHubAnalyzeMetadata> = {}
): ProcessHubAnalyzeMetadata {
  return {
    processHubId: DEFAULT_PROCESS_HUB_ID,
    analyzeStatus: 'scouting',
    ...overrides,
  };
}

describe('processHub defaults', () => {
  it('normalizes missing legacy hub ids to General / Unassigned', () => {
    expect(normalizeProcessHubId(undefined)).toBe(DEFAULT_PROCESS_HUB_ID);
    expect(normalizeProcessHubId('')).toBe(DEFAULT_PROCESS_HUB_ID);
    expect(DEFAULT_PROCESS_HUB.name).toBe('General / Unassigned');
  });
});

describe('buildProcessHubRollups', () => {
  it('synthesizes a friendly fallback name when an evidence snapshot references an unknown hub', () => {
    const evidenceSnapshots: EvidenceSnapshot[] = [
      {
        id: 'snap-orphan',
        hubId: 'process-hub-7f3a-deleted',
        sourceId: 'src-1',
        capturedAt: '2026-04-26T10:00:00.000Z',
        rowCount: 100,
        origin: 'fixture:orphan-hub-fallback',
        importedAt: 1745664000000,
        createdAt: 1745664000000,
        deletedAt: null,
        latestSignals: [],
      },
    ];

    const rollups = buildProcessHubRollups([], [], { evidenceSnapshots });
    const orphan = rollups.find(r => r.hub.id === 'process-hub-7f3a-deleted');

    expect(orphan).toBeDefined();
    expect(orphan?.hub.name).toBe('Unknown hub');
  });

  it('synthesizes a friendly fallback name when an analyze references an unknown hub', () => {
    const analyzes = [
      {
        id: 'orphan-analyze',
        name: 'Orphan analyze',
        updatedAt: 1777161600000,
        createdAt: 1777161600000,
        deletedAt: null,
        metadata: makeMetadata({ processHubId: 'deleted-hub-abc123' }),
      },
    ];

    const rollups = buildProcessHubRollups([], analyzes);
    const orphan = rollups.find(r => r.hub.id === 'deleted-hub-abc123');

    expect(orphan).toBeDefined();
    expect(orphan?.hub.name).toBe('Unknown hub');
  });

  it('groups analyzes under their hub and computes deterministic rollups', () => {
    const hubs: ProcessHub[] = [
      DEFAULT_PROCESS_HUB,
      { id: 'line-4', name: 'Line 4', createdAt: 1777075200000, deletedAt: null },
    ];
    const analyzes = [
      {
        id: 'legacy',
        name: 'Legacy analysis',
        updatedAt: 1776643200000,
        createdAt: 1776643200000,
        deletedAt: null,
        metadata: makeMetadata({ processHubId: undefined, analyzeStatus: 'scouting' }),
      },
      {
        id: 'line-4-a',
        name: 'Night shift overfill',
        updatedAt: 1776988800000,
        createdAt: 1776988800000,
        deletedAt: null,
        metadata: makeMetadata({
          processHubId: 'line-4',
          analyzeDepth: 'focused',
          analyzeStatus: 'investigating',
          actionCounts: { total: 2, completed: 0, overdue: 1 },
          currentUnderstandingSummary: 'Variation is concentrated on night shift.',
          problemConditionSummary: 'Cpk is below target on Heads 5-8.',
          nextMove: 'Inspect nozzle wear during night shift.',
        }),
      },
      {
        id: 'line-4-b',
        name: 'Label jam',
        updatedAt: 1776902400000,
        createdAt: 1776902400000,
        deletedAt: null,
        metadata: makeMetadata({
          processHubId: 'line-4',
          analyzeDepth: 'quick',
          analyzeStatus: 'verifying',
        }),
      },
    ];

    const rollups = buildProcessHubRollups(hubs, analyzes);

    expect(rollups).toHaveLength(2);
    expect(rollups[0].hub.id).toBe('line-4');
    expect(rollups[0].activeAnalyzeCount).toBe(2);
    expect(rollups[0].statusCounts).toEqual({ investigating: 1, verifying: 1 });
    expect(rollups[0].depthCounts).toEqual({ focused: 1, quick: 1 });
    expect(rollups[0].overdueActionCount).toBe(1);
    expect(rollups[0].latestActivity).toBe(1776988800000);
    expect(rollups[0].currentUnderstandingSummary).toBe(
      'Variation is concentrated on night shift.'
    );
    expect(rollups[0].problemConditionSummary).toBe('Cpk is below target on Heads 5-8.');
    expect(rollups[0].nextMove).toBe('Inspect nozzle wear during night shift.');

    expect(rollups[1].hub.id).toBe(DEFAULT_PROCESS_HUB_ID);
    expect(rollups[1].analyzes.map(i => i.id)).toEqual(['legacy']);
  });

  it('uses the newest available review signal for the hub rollup', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: 1777075200000, deletedAt: null },
    ];
    const analyzes = [
      {
        id: 'older',
        name: 'Older signal',
        updatedAt: 1776988800000,
        createdAt: 1776988800000,
        deletedAt: null,
        metadata: makeMetadata({
          processHubId: 'line-4',
          reviewSignal: {
            rowCount: 10,
            outcome: 'Weight',
            computedAt: '2026-04-24T00:00:00.000Z',
            topFocus: { factor: 'Shift', value: 'Night', variationPct: 22 },
            changeSignals: {
              total: 1,
              outOfControlCount: 1,
              nelsonRule2Count: 0,
              nelsonRule3Count: 0,
            },
          },
        }),
      },
      {
        id: 'newer-no-signal',
        name: 'Newer legacy project',
        updatedAt: 1777161600000,
        createdAt: 1777161600000,
        deletedAt: null,
        metadata: makeMetadata({ processHubId: 'line-4' }),
      },
      {
        id: 'newer-signal',
        name: 'Newer signal',
        updatedAt: 1777075200000,
        createdAt: 1777075200000,
        deletedAt: null,
        metadata: makeMetadata({
          processHubId: 'line-4',
          reviewSignal: {
            rowCount: 12,
            outcome: 'Weight',
            computedAt: '2026-04-25T00:00:00.000Z',
            topFocus: { factor: 'Machine', value: 'B', variationPct: 48 },
            changeSignals: {
              total: 2,
              outOfControlCount: 1,
              nelsonRule2Count: 1,
              nelsonRule3Count: 0,
            },
          },
        }),
      },
    ];

    const [rollup] = buildProcessHubRollups(hubs, analyzes);

    expect(rollup.reviewSignal?.topFocus).toEqual({
      factor: 'Machine',
      value: 'B',
      variationPct: 48,
    });
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
