import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROCESS_HUB,
  DEFAULT_PROCESS_HUB_ID,
  buildProcessHubReview,
  buildProcessHubRollups,
  normalizeProcessHubId,
} from '../processHub';
import type { ProcessHub, ProjectMetadata } from '../index';

function makeMetadata(overrides: Partial<ProjectMetadata> = {}): ProjectMetadata {
  return {
    phase: 'scout',
    findingCounts: {},
    questionCounts: {},
    actionCounts: { total: 0, completed: 0, overdue: 0 },
    assignedTaskCount: 0,
    hasOverdueTasks: false,
    lastViewedAt: {},
    processHubId: DEFAULT_PROCESS_HUB_ID,
    investigationStatus: 'scouting',
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

describe('buildProcessHubReview', () => {
  it('projects focus, verification, overdue action, and next-move queues from a hub rollup', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const [rollup] = buildProcessHubRollups(hubs, [
      {
        id: 'change-signal',
        name: 'Heads 5-8 drift',
        modified: '2026-04-26T08:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'investigating',
          nextMove: 'Inspect nozzle wear during night shift.',
          reviewSignal: {
            rowCount: 125,
            outcome: 'Weight',
            computedAt: '2026-04-26T09:00:00.000Z',
            topFocus: { factor: 'Head', value: '5', variationPct: 42 },
            capability: { cpk: 0.82, cpkTarget: 1.33, outOfSpecPercentage: 4.8 },
            changeSignals: {
              total: 3,
              outOfControlCount: 1,
              nelsonRule2Count: 1,
              nelsonRule3Count: 1,
            },
          },
        }),
      },
      {
        id: 'verify',
        name: 'Check post-action shift',
        modified: '2026-04-25T12:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'verifying',
          actionCounts: { total: 2, completed: 1, overdue: 1 },
          nextMove: 'Compare post-action Cpk after next batch.',
        }),
      },
    ]);

    const review = buildProcessHubReview(rollup);

    expect(review.whereToFocus.map(item => item.investigation.id)).toEqual(['change-signal']);
    expect(review.whereToFocus[0]).toMatchObject({
      changeSignalCount: 3,
      cpkGap: 0.51,
      topFocusVariationPct: 42,
      reasons: ['change-signals', 'capability-gap', 'top-focus'],
    });
    expect(review.verificationQueue.map(item => item.investigation.id)).toEqual(['verify']);
    expect(review.overdueActionQueue.map(item => item.investigation.id)).toEqual(['verify']);
    expect(review.nextMoveQueue.map(item => item.investigation.id)).toEqual([
      'change-signal',
      'verify',
    ]);
  });

  it('sorts focus items by change signals, Cpk gap, top focus, then modified time', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const [rollup] = buildProcessHubRollups(hubs, [
      {
        id: 'recent',
        name: 'Recent smaller issue',
        modified: '2026-04-26T10:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          reviewSignal: {
            rowCount: 30,
            outcome: 'Weight',
            computedAt: '2026-04-26T10:00:00.000Z',
            topFocus: { factor: 'Shift', value: 'Night', variationPct: 80 },
            capability: { cpk: 1.2, cpkTarget: 1.33, outOfSpecPercentage: 1 },
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
        id: 'largest-gap',
        name: 'Largest capability gap',
        modified: '2026-04-24T10:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          reviewSignal: {
            rowCount: 50,
            outcome: 'Weight',
            computedAt: '2026-04-24T10:00:00.000Z',
            topFocus: { factor: 'Machine', value: 'B', variationPct: 20 },
            capability: { cpk: 0.7, cpkTarget: 1.33, outOfSpecPercentage: 6 },
            changeSignals: {
              total: 2,
              outOfControlCount: 1,
              nelsonRule2Count: 1,
              nelsonRule3Count: 0,
            },
          },
        }),
      },
      {
        id: 'same-signals-lower-gap',
        name: 'Lower capability gap',
        modified: '2026-04-25T10:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          reviewSignal: {
            rowCount: 40,
            outcome: 'Weight',
            computedAt: '2026-04-25T10:00:00.000Z',
            topFocus: { factor: 'Machine', value: 'A', variationPct: 90 },
            capability: { cpk: 1.1, cpkTarget: 1.33, outOfSpecPercentage: 2 },
            changeSignals: {
              total: 2,
              outOfControlCount: 2,
              nelsonRule2Count: 0,
              nelsonRule3Count: 0,
            },
          },
        }),
      },
    ]);

    const review = buildProcessHubReview(rollup);

    expect(review.whereToFocus.map(item => item.investigation.id)).toEqual([
      'largest-gap',
      'same-signals-lower-gap',
      'recent',
    ]);
  });

  it('returns empty queues when a hub has no attention metadata', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const [rollup] = buildProcessHubRollups(hubs, [
      {
        id: 'quiet',
        name: 'Quiet investigation',
        modified: '2026-04-26T10:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'scouting',
        }),
      },
    ]);

    const review = buildProcessHubReview(rollup);

    expect(review.whereToFocus).toEqual([]);
    expect(review.verificationQueue).toEqual([]);
    expect(review.overdueActionQueue).toEqual([]);
    expect(review.nextMoveQueue).toEqual([]);
  });
});

describe('buildProcessHubRollups', () => {
  it('groups investigations under their hub and computes deterministic rollups', () => {
    const hubs: ProcessHub[] = [
      DEFAULT_PROCESS_HUB,
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const investigations = [
      {
        id: 'legacy',
        name: 'Legacy analysis',
        modified: '2026-04-20T00:00:00.000Z',
        metadata: makeMetadata({ processHubId: undefined, investigationStatus: 'scouting' }),
      },
      {
        id: 'line-4-a',
        name: 'Night shift overfill',
        modified: '2026-04-24T00:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'focused',
          investigationStatus: 'investigating',
          actionCounts: { total: 2, completed: 0, overdue: 1 },
          currentUnderstandingSummary: 'Variation is concentrated on night shift.',
          problemConditionSummary: 'Cpk is below target on Heads 5-8.',
          nextMove: 'Inspect nozzle wear during night shift.',
        }),
      },
      {
        id: 'line-4-b',
        name: 'Label jam',
        modified: '2026-04-23T00:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'quick',
          investigationStatus: 'verifying',
        }),
      },
    ];

    const rollups = buildProcessHubRollups(hubs, investigations);

    expect(rollups).toHaveLength(2);
    expect(rollups[0].hub.id).toBe('line-4');
    expect(rollups[0].activeInvestigationCount).toBe(2);
    expect(rollups[0].statusCounts).toEqual({ investigating: 1, verifying: 1 });
    expect(rollups[0].depthCounts).toEqual({ focused: 1, quick: 1 });
    expect(rollups[0].overdueActionCount).toBe(1);
    expect(rollups[0].latestActivity).toBe('2026-04-24T00:00:00.000Z');
    expect(rollups[0].currentUnderstandingSummary).toBe(
      'Variation is concentrated on night shift.'
    );
    expect(rollups[0].problemConditionSummary).toBe('Cpk is below target on Heads 5-8.');
    expect(rollups[0].nextMove).toBe('Inspect nozzle wear during night shift.');

    expect(rollups[1].hub.id).toBe(DEFAULT_PROCESS_HUB_ID);
    expect(rollups[1].investigations.map(i => i.id)).toEqual(['legacy']);
  });

  it('uses the newest available review signal for the hub rollup', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const investigations = [
      {
        id: 'older',
        name: 'Older signal',
        modified: '2026-04-24T00:00:00.000Z',
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
        modified: '2026-04-26T00:00:00.000Z',
        metadata: makeMetadata({ processHubId: 'line-4' }),
      },
      {
        id: 'newer-signal',
        name: 'Newer signal',
        modified: '2026-04-25T00:00:00.000Z',
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

    const [rollup] = buildProcessHubRollups(hubs, investigations);

    expect(rollup.reviewSignal?.topFocus).toEqual({
      factor: 'Machine',
      value: 'B',
      variationPct: 48,
    });
  });
});
