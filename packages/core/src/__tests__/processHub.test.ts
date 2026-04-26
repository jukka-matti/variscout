import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROCESS_HUB,
  DEFAULT_PROCESS_HUB_ID,
  buildProcessHubCadence,
  buildProcessHubContext,
  buildProcessHubReview,
  buildProcessHubRollups,
  normalizeProcessHubId,
} from '../processHub';
import type { ProcessHub, ProjectMetadata } from '../index';
import type { EvidenceSnapshot } from '../evidenceSources';
import type { ControlHandoff, SustainmentRecord } from '../sustainment';

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

  it('groups active cadence work by depth and resolved work into sustainment review', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const [rollup] = buildProcessHubRollups(hubs, [
      {
        id: 'quick-check',
        name: 'Label jam after changeover',
        modified: '2026-04-26T09:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'quick',
          investigationStatus: 'scouting',
        }),
      },
      {
        id: 'focused-check',
        name: 'Night shift overfill',
        modified: '2026-04-26T08:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'focused',
          investigationStatus: 'investigating',
        }),
      },
      {
        id: 'chartered-check',
        name: 'Reduce scrap from 4.2%',
        modified: '2026-04-26T07:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'chartered',
          investigationStatus: 'ready-to-improve',
        }),
      },
      {
        id: 'resolved-check',
        name: 'Nozzle replacement verified',
        modified: '2026-04-26T06:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'focused',
          investigationStatus: 'resolved',
          nextMove: 'Review the result during next weekly hub cadence.',
        }),
      },
      {
        id: 'controlled-check',
        name: 'Inspection checklist updated',
        modified: '2026-04-26T05:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'quick',
          investigationStatus: 'controlled',
        }),
      },
    ]);

    const review = buildProcessHubReview(rollup);

    expect(review.depthQueues.quick.map(item => item.investigation.id)).toEqual(['quick-check']);
    expect(review.depthQueues.focused.map(item => item.investigation.id)).toEqual([
      'focused-check',
    ]);
    expect(review.depthQueues.chartered.map(item => item.investigation.id)).toEqual([
      'chartered-check',
    ]);
    expect(review.sustainmentQueue.map(item => item.investigation.id)).toEqual([
      'resolved-check',
      'controlled-check',
    ]);
  });

  it('surfaces readiness gaps separately from focus and action queues', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const [rollup] = buildProcessHubRollups(hubs, [
      {
        id: 'legacy-context',
        name: 'Legacy context setup',
        modified: '2026-04-26T10:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'framing',
          surveyReadiness: {
            possibilityStatus: 'ask-for-next',
            powerStatus: 'can-do-with-caution',
            trustStatus: 'ask-for-next',
            recommendationCount: 2,
            topRecommendations: ['Map one customer-felt outcome.'],
          },
        }),
      },
      {
        id: 'verify-gap',
        name: 'Verification missing after action',
        modified: '2026-04-26T09:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'verifying',
          processDescription: 'Bottle filling line from rinse to palletizing.',
          customerRequirementSummary: 'Fill weight must stay inside customer specs.',
        }),
      },
      {
        id: 'sustainment-candidate',
        name: 'Nozzle change sustained',
        modified: '2026-04-26T08:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'resolved',
          processDescription: 'Bottle filling line from rinse to palletizing.',
          customerRequirementSummary: 'Fill weight must stay inside customer specs.',
        }),
      },
    ]);

    const review = buildProcessHubReview(rollup);

    expect(review.readinessQueue.map(item => item.investigation.id)).toEqual([
      'legacy-context',
      'verify-gap',
      'sustainment-candidate',
    ]);
    expect(review.readinessQueue[0].readinessReasons).toEqual([
      'missing-process-context',
      'missing-customer-requirement',
      'survey-gap',
    ]);
    expect(review.readinessQueue[1].readinessReasons).toEqual(['verification-gap']);
    expect(review.readinessQueue[2].readinessReasons).toEqual(['sustainment-candidate']);
  });
});

describe('buildProcessHubCadence', () => {
  it('builds snapshot counts and truncated cadence queues from a hub rollup', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const investigations = [
      {
        id: 'signal-1',
        name: 'Newest change signal',
        modified: '2026-04-26T10:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'investigating',
          processDescription: 'Bottle filling line.',
          customerRequirementSummary: 'Fill weight inside spec.',
          reviewSignal: {
            rowCount: 90,
            outcome: 'Weight',
            computedAt: '2026-04-26T10:00:00.000Z',
            topFocus: { factor: 'Head', value: '5', variationPct: 44 },
            capability: { cpk: 0.9, cpkTarget: 1.33, outOfSpecPercentage: 2 },
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
        id: 'ready-1',
        name: 'Missing process context 1',
        modified: '2026-04-26T09:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'framing',
        }),
      },
      {
        id: 'ready-2',
        name: 'Missing process context 2',
        modified: '2026-04-26T08:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'framing',
        }),
      },
      {
        id: 'ready-3',
        name: 'Missing process context 3',
        modified: '2026-04-26T07:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'framing',
        }),
      },
      {
        id: 'ready-4',
        name: 'Missing process context 4',
        modified: '2026-04-26T06:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'framing',
        }),
      },
      {
        id: 'ready-5',
        name: 'Missing process context 5',
        modified: '2026-04-26T05:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'framing',
        }),
      },
      {
        id: 'verify-1',
        name: 'Waiting verification',
        modified: '2026-04-26T04:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'verifying',
          processDescription: 'Bottle filling line.',
          customerRequirementSummary: 'Fill weight inside spec.',
        }),
      },
      {
        id: 'actions-1',
        name: 'Overdue action',
        modified: '2026-04-26T03:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'improving',
          processDescription: 'Bottle filling line.',
          customerRequirementSummary: 'Fill weight inside spec.',
          actionCounts: { total: 2, completed: 0, overdue: 2 },
        }),
      },
      {
        id: 'sustain-1',
        name: 'Sustainment candidate',
        modified: '2026-04-26T02:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'resolved',
          processDescription: 'Bottle filling line.',
          customerRequirementSummary: 'Fill weight inside spec.',
        }),
      },
    ];
    const sustainmentRecords: SustainmentRecord[] = [
      {
        id: 'rec-sustain-1',
        investigationId: 'sustain-1',
        hubId: 'line-4',
        cadence: 'monthly',
        nextReviewDue: '2026-04-25T00:00:00.000Z',
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-04-25T00:00:00.000Z',
      },
    ];
    const now = new Date('2026-04-26T12:00:00.000Z');
    const [rollup] = buildProcessHubRollups(hubs, investigations, {
      sustainmentRecords,
      controlHandoffs: [],
    });

    const cadence = buildProcessHubCadence(rollup, now);

    expect(cadence.snapshot).toEqual({
      active: 8,
      readiness: 7,
      verification: 1,
      overdueActions: 2,
      sustainment: 1,
      latestSignals: 1,
      nextMoves: 0,
    });
    expect(cadence.readiness.totalCount).toBe(7);
    expect(cadence.readiness.hiddenCount).toBe(3);
    expect(cadence.readiness.items.map(item => item.investigation.id)).toEqual([
      'ready-1',
      'ready-2',
      'ready-3',
      'ready-4',
    ]);
    expect(cadence.latestSignals.items.map(item => item.investigation.id)).toEqual(['signal-1']);
    expect(cadence.verification.items.map(item => item.investigation.id)).toEqual(['verify-1']);
    expect(cadence.actions.items.map(item => item.investigation.id)).toEqual(['actions-1']);
    expect(cadence.sustainment.items.map(item => item.investigation.id)).toEqual(['sustain-1']);
  });

  it('orders evidence signals by severity (red > amber > green > neutral) over capturedAt', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const evidenceSnapshots: EvidenceSnapshot[] = [
      {
        id: 'snap-green',
        hubId: 'line-4',
        sourceId: 'src-1',
        capturedAt: '2026-04-26T10:00:00.000Z',
        rowCount: 100,
        latestSignals: [
          {
            id: 'sig-green',
            label: 'Green today',
            value: 0,
            severity: 'green',
            capturedAt: '2026-04-26T10:00:00.000Z',
          },
        ],
      },
      {
        id: 'snap-red',
        hubId: 'line-4',
        sourceId: 'src-1',
        capturedAt: '2026-04-25T10:00:00.000Z',
        rowCount: 100,
        latestSignals: [
          {
            id: 'sig-red',
            label: 'Red yesterday',
            value: 12,
            severity: 'red',
            capturedAt: '2026-04-25T10:00:00.000Z',
          },
        ],
      },
      {
        id: 'snap-amber',
        hubId: 'line-4',
        sourceId: 'src-1',
        capturedAt: '2026-04-24T10:00:00.000Z',
        rowCount: 100,
        latestSignals: [
          {
            id: 'sig-amber',
            label: 'Amber two days ago',
            value: 6,
            severity: 'amber',
            capturedAt: '2026-04-24T10:00:00.000Z',
          },
        ],
      },
      {
        id: 'snap-neutral',
        hubId: 'line-4',
        sourceId: 'src-1',
        capturedAt: '2026-04-26T11:00:00.000Z',
        rowCount: 100,
        latestSignals: [
          {
            id: 'sig-neutral',
            label: 'Neutral newest',
            value: 0,
            severity: 'neutral',
            capturedAt: '2026-04-26T11:00:00.000Z',
          },
        ],
      },
    ];

    const [rollup] = buildProcessHubRollups(hubs, [], { evidenceSnapshots });
    const cadence = buildProcessHubCadence(rollup);

    expect(cadence.latestEvidenceSignals.items.map(s => s.id)).toEqual([
      'sig-red',
      'sig-amber',
      'sig-green',
      'sig-neutral',
    ]);
  });

  it('breaks severity ties with capturedAt newest first', () => {
    const hubs: ProcessHub[] = [
      { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const evidenceSnapshots: EvidenceSnapshot[] = [
      {
        id: 'snap-red-old',
        hubId: 'line-4',
        sourceId: 'src-1',
        capturedAt: '2026-04-24T10:00:00.000Z',
        rowCount: 100,
        latestSignals: [
          {
            id: 'sig-red-old',
            label: 'Red older',
            value: 8,
            severity: 'red',
            capturedAt: '2026-04-24T10:00:00.000Z',
          },
        ],
      },
      {
        id: 'snap-red-new',
        hubId: 'line-4',
        sourceId: 'src-1',
        capturedAt: '2026-04-26T10:00:00.000Z',
        rowCount: 100,
        latestSignals: [
          {
            id: 'sig-red-new',
            label: 'Red newer',
            value: 12,
            severity: 'red',
            capturedAt: '2026-04-26T10:00:00.000Z',
          },
        ],
      },
    ];

    const [rollup] = buildProcessHubRollups(hubs, [], { evidenceSnapshots });
    const cadence = buildProcessHubCadence(rollup);

    expect(cadence.latestEvidenceSignals.items.map(s => s.id)).toEqual([
      'sig-red-new',
      'sig-red-old',
    ]);
  });
});

describe('buildProcessHubCadence — sustainment lane', () => {
  it('populates the sustainment queue from due records and excludes future-due ones', () => {
    const hubs: ProcessHub[] = [
      { id: 'hub-1', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const now = new Date('2026-04-26T00:00:00.000Z');
    const investigations = [
      {
        id: 'inv-due',
        name: 'Due review',
        modified: '2026-04-26T00:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'hub-1',
          investigationStatus: 'resolved',
        }),
      },
      {
        id: 'inv-future',
        name: 'Not yet due',
        modified: '2026-04-26T00:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'hub-1',
          investigationStatus: 'resolved',
        }),
      },
    ];
    const sustainmentRecords: SustainmentRecord[] = [
      {
        id: 'rec-due',
        investigationId: 'inv-due',
        hubId: 'hub-1',
        cadence: 'monthly',
        nextReviewDue: '2026-04-25T00:00:00.000Z',
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-04-25T00:00:00.000Z',
      },
      {
        id: 'rec-future',
        investigationId: 'inv-future',
        hubId: 'hub-1',
        cadence: 'monthly',
        nextReviewDue: '2026-05-25T00:00:00.000Z',
        createdAt: '2026-04-25T00:00:00.000Z',
        updatedAt: '2026-04-25T00:00:00.000Z',
      },
    ];
    const controlHandoffs: ControlHandoff[] = [];

    const [rollup] = buildProcessHubRollups(hubs, investigations, {
      sustainmentRecords,
      controlHandoffs,
    });
    const cadence = buildProcessHubCadence(rollup, now);

    expect(cadence.sustainment.totalCount).toBe(1);
    expect(cadence.sustainment.items[0].investigation.id).toBe('inv-due');
  });

  it('includes controlled investigations missing a ControlHandoff in the sustainment lane', () => {
    const hubs: ProcessHub[] = [
      { id: 'hub-1', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
    ];
    const now = new Date('2026-04-26T00:00:00.000Z');
    const investigations = [
      {
        id: 'inv-controlled',
        name: 'Needs handoff',
        modified: '2026-04-26T00:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'hub-1',
          investigationStatus: 'controlled',
        }),
      },
    ];

    const [rollup] = buildProcessHubRollups(hubs, investigations, {
      sustainmentRecords: [],
      controlHandoffs: [],
    });
    const cadence = buildProcessHubCadence(rollup, now);

    expect(cadence.sustainment.totalCount).toBe(1);
    expect(cadence.sustainment.items[0].investigation.id).toBe('inv-controlled');
    expect(cadence.sustainment.items[0].reasons).toContain('control-handoff-missing');
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
        latestSignals: [],
      },
    ];

    const rollups = buildProcessHubRollups([], [], { evidenceSnapshots });
    const orphan = rollups.find(r => r.hub.id === 'process-hub-7f3a-deleted');

    expect(orphan).toBeDefined();
    expect(orphan?.hub.name).toBe('Unknown hub');
  });

  it('synthesizes a friendly fallback name when an investigation references an unknown hub', () => {
    const investigations = [
      {
        id: 'orphan-investigation',
        name: 'Orphan investigation',
        modified: '2026-04-26T00:00:00.000Z',
        metadata: makeMetadata({ processHubId: 'deleted-hub-abc123' }),
      },
    ];

    const rollups = buildProcessHubRollups([], investigations);
    const orphan = rollups.find(r => r.hub.id === 'deleted-hub-abc123');

    expect(orphan).toBeDefined();
    expect(orphan?.hub.name).toBe('Unknown hub');
  });

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

  it('builds a deterministic process context contract from hub investigations', () => {
    const hubs: ProcessHub[] = [
      {
        id: 'line-4',
        name: 'Line 4',
        description: 'High-volume bottle filling process.',
        createdAt: '2026-04-25T00:00:00.000Z',
        processOwner: { displayName: 'Pat Process', upn: 'pat@example.com' },
      },
    ];
    const [rollup] = buildProcessHubRollups(hubs, [
      {
        id: 'line-4-a',
        name: 'Night shift overfill',
        modified: '2026-04-26T08:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'focused',
          investigationStatus: 'investigating',
          processDescription: 'Bottle filling from rinse through palletizing.',
          customerRequirementSummary: 'Fill weight must stay within 9-15 g.',
          processMapSummary: {
            stepCount: 4,
            tributaryCount: 6,
            ctsColumn: 'Weight',
            subgroupAxisCount: 1,
            hunchCount: 2,
          },
          findingCounts: { analyzed: 2, resolved: 1 },
          questionCounts: { open: 1, answered: 2, 'ruled-out': 1 },
          currentUnderstandingSummary: 'Variation is concentrated on night shift.',
          problemConditionSummary: 'Cpk is below target on Heads 5-8.',
          nextMove: 'Inspect nozzle wear during night shift.',
          reviewSignal: {
            rowCount: 125,
            outcome: 'Weight',
            computedAt: '2026-04-26T09:00:00.000Z',
            topFocus: { factor: 'Machine', value: 'B', variationPct: 48 },
            capability: { cpk: 0.82, cpkTarget: 1.33, outOfSpecPercentage: 4.8 },
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
        id: 'line-4-b',
        name: 'Post-action shift check',
        modified: '2026-04-25T08:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'quick',
          investigationStatus: 'verifying',
          actionCounts: { total: 2, completed: 1, overdue: 1 },
          currentUnderstandingSummary: 'Post-action data is ready for comparison.',
        }),
      },
    ]);

    const context = buildProcessHubContext(rollup);

    expect(context).toMatchObject({
      schemaVersion: 1,
      hub: {
        id: 'line-4',
        name: 'Line 4',
        description: 'High-volume bottle filling process.',
        processOwner: { displayName: 'Pat Process', upn: 'pat@example.com' },
      },
      process: {
        description: 'Bottle filling from rinse through palletizing.',
        customerRequirement: 'Fill weight must stay within 9-15 g.',
        map: {
          stepCount: 4,
          tributaryCount: 6,
          ctsColumn: 'Weight',
          subgroupAxisCount: 1,
          hunchCount: 2,
        },
      },
      questions: { open: 1, answered: 2, ruledOut: 1, evidenceGaps: 1 },
      findings: { total: 3, confirmed: 3 },
      actions: { total: 2, completed: 1, overdue: 1 },
      verification: { waiting: 1 },
      sustainment: { candidates: 0 },
    });
    expect(context.investigations.map(investigation => investigation.id)).toEqual([
      'line-4-a',
      'line-4-b',
    ]);
    expect(context.metrics).toEqual([
      {
        name: 'Weight',
        sourceInvestigationId: 'line-4-a',
        rowCount: 125,
        cpk: 0.82,
        cpkTarget: 1.33,
      },
    ]);
    expect(context.variationConcentrations).toEqual([
      {
        factor: 'Machine',
        value: 'B',
        variationPct: 48,
        sourceInvestigationId: 'line-4-a',
      },
    ]);
    expect(context.readinessReasons).toEqual(['verification-gap']);
  });
});
