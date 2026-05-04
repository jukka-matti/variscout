import { describe, expect, it } from 'vitest';
import {
  buildProcessHubCadence,
  buildProcessHubRollups,
  DEFAULT_PROCESS_HUB_ID,
} from '../processHub';
import { buildCurrentProcessState } from '../processState';
import type { EvidenceSnapshot, ProcessHub, ProjectMetadata } from '../index';
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

const hubs: ProcessHub[] = [
  { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
];

describe('buildCurrentProcessState', () => {
  it('routes current process signals into lenses and response paths', () => {
    const now = new Date('2026-04-26T12:00:00.000Z');
    const investigations = [
      {
        id: 'signal-1',
        name: 'Night shift overfill',
        modified: '2026-04-26T10:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'focused',
          investigationStatus: 'investigating',
          processDescription: 'Line 4 filling process.',
          customerRequirementSummary: 'Fill weight inside spec.',
          reviewSignal: {
            rowCount: 90,
            outcome: 'Weight',
            computedAt: '2026-04-26T10:00:00.000Z',
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
        id: 'quick-1',
        name: 'Label jam after changeover',
        modified: '2026-04-26T09:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'quick',
          investigationStatus: 'scouting',
          processDescription: 'Line 4 filling process.',
          customerRequirementSummary: 'Fill weight inside spec.',
        }),
      },
      {
        id: 'chartered-1',
        name: 'Reduce recurring scrap',
        modified: '2026-04-26T08:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'chartered',
          investigationStatus: 'ready-to-improve',
          processDescription: 'Line 4 filling process.',
          customerRequirementSummary: 'Fill weight inside spec.',
        }),
      },
      {
        id: 'readiness-1',
        name: 'Frame missing process context',
        modified: '2026-04-26T07:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'focused',
          investigationStatus: 'framing',
        }),
      },
      {
        id: 'verify-1',
        name: 'Post-action shift check',
        modified: '2026-04-26T06:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'quick',
          investigationStatus: 'verifying',
          processDescription: 'Line 4 filling process.',
          customerRequirementSummary: 'Fill weight inside spec.',
        }),
      },
      {
        id: 'action-1',
        name: 'Overdue valve action',
        modified: '2026-04-26T05:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationDepth: 'quick',
          investigationStatus: 'improving',
          processDescription: 'Line 4 filling process.',
          customerRequirementSummary: 'Fill weight inside spec.',
          actionCounts: { total: 2, completed: 0, overdue: 2 },
        }),
      },
      {
        id: 'resolved-1',
        name: 'Nozzle replacement verified',
        modified: '2026-04-26T04:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'resolved',
          processDescription: 'Line 4 filling process.',
          customerRequirementSummary: 'Fill weight inside spec.',
        }),
      },
      {
        id: 'controlled-1',
        name: 'Inspection checklist updated',
        modified: '2026-04-26T03:00:00.000Z',
        metadata: makeMetadata({
          processHubId: 'line-4',
          investigationStatus: 'controlled',
          processDescription: 'Line 4 filling process.',
          customerRequirementSummary: 'Fill weight inside spec.',
        }),
      },
    ];
    const evidenceSnapshots: EvidenceSnapshot[] = [
      {
        id: 'snap-red',
        hubId: 'line-4',
        sourceId: 'src-agent-log',
        capturedAt: '2026-04-26T11:00:00.000Z',
        rowCount: 100,
        origin: 'fixture:process-state-cadence',
        importedAt: '2026-04-26T11:00:00.000Z',
        latestSignals: [
          {
            id: 'sig-red',
            label: 'False green',
            value: 12,
            severity: 'red',
            capturedAt: '2026-04-26T11:00:00.000Z',
          },
        ],
      },
    ];
    const sustainmentRecords: SustainmentRecord[] = [
      {
        id: 'rec-1',
        investigationId: 'resolved-1',
        hubId: 'line-4',
        cadence: 'monthly',
        nextReviewDue: '2026-04-25T00:00:00.000Z',
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-04-25T00:00:00.000Z',
      },
    ];
    const controlHandoffs: ControlHandoff[] = [];
    const [rollup] = buildProcessHubRollups(hubs, investigations, {
      evidenceSnapshots,
      sustainmentRecords,
      controlHandoffs,
    });
    const cadence = buildProcessHubCadence(rollup, now);

    const state = buildCurrentProcessState(rollup, cadence, now);

    expect(state.overallSeverity).toBe('red');
    expect(state.lensCounts).toMatchObject({
      outcome: 1,
      conversion: expect.any(Number),
      measurement: expect.any(Number),
      sustainment: expect.any(Number),
    });
    expect(state.responsePathCounts['focused-investigation']).toBeGreaterThan(0);
    expect(state.responsePathCounts['measurement-system-work']).toBeGreaterThan(0);
    expect(state.responsePathCounts['sustainment-review']).toBe(1);
    expect(state.responsePathCounts['control-handoff']).toBe(1);
    expect(state.responsePathCounts['quick-action']).toBeGreaterThan(0);
    expect(state.responsePathCounts['chartered-project']).toBe(1);
    expect(state.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'capability-gap',
          lens: 'outcome',
          severity: 'red',
          responsePath: 'focused-investigation',
          metric: {
            cpk: 0.82,
            cpkTarget: 1.33,
            cpkGap: 0.51,
            outOfSpecPercentage: 4.8,
          },
        }),
        expect.objectContaining({
          id: 'evidence:sig-red',
          lens: 'measurement',
          severity: 'red',
          responsePath: 'measurement-system-work',
          sourceId: 'sig-red',
        }),
        expect.objectContaining({
          id: 'readiness',
          lens: 'measurement',
          severity: 'amber',
          responsePath: 'measurement-system-work',
        }),
        expect.objectContaining({
          id: 'sustainment',
          lens: 'sustainment',
          responsePath: 'sustainment-review',
        }),
        expect.objectContaining({
          id: 'control-handoff',
          lens: 'sustainment',
          responsePath: 'control-handoff',
        }),
        expect.objectContaining({
          id: 'active:quick',
          responsePath: 'quick-action',
        }),
        expect.objectContaining({
          id: 'active:focused',
          responsePath: 'focused-investigation',
        }),
        expect.objectContaining({
          id: 'active:chartered',
          responsePath: 'chartered-project',
        }),
      ])
    );
  });

  it('orders evidence state by severity before weaker signals', () => {
    const evidenceSnapshots: EvidenceSnapshot[] = [
      {
        id: 'snap-green',
        hubId: 'line-4',
        sourceId: 'src-1',
        capturedAt: '2026-04-26T10:00:00.000Z',
        rowCount: 100,
        origin: 'fixture:evidence-state-ordering',
        importedAt: '2026-04-26T10:00:00.000Z',
        latestSignals: [
          {
            id: 'sig-green',
            label: 'Safe green',
            value: 98,
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
        origin: 'fixture:evidence-state-ordering',
        importedAt: '2026-04-25T10:00:00.000Z',
        latestSignals: [
          {
            id: 'sig-red',
            label: 'False green',
            value: 12,
            severity: 'red',
            capturedAt: '2026-04-25T10:00:00.000Z',
          },
        ],
      },
    ];
    const [rollup] = buildProcessHubRollups(hubs, [], { evidenceSnapshots });
    const cadence = buildProcessHubCadence(rollup);

    const state = buildCurrentProcessState(rollup, cadence);

    expect(
      state.items.filter(item => item.id.startsWith('evidence:')).map(item => item.id)
    ).toEqual(['evidence:sig-red', 'evidence:sig-green']);
  });

  it('returns a stable empty state for a quiet hub', () => {
    const [rollup] = buildProcessHubRollups(hubs, []);
    const cadence = buildProcessHubCadence(rollup);

    const state = buildCurrentProcessState(rollup, cadence, new Date('2026-04-26T12:00:00.000Z'));

    expect(state).toMatchObject({
      hub: { id: 'line-4', name: 'Line 4' },
      assessedAt: '2026-04-26T12:00:00.000Z',
      overallSeverity: 'neutral',
      items: [],
      lensCounts: {
        outcome: 0,
        flow: 0,
        conversion: 0,
        measurement: 0,
        sustainment: 0,
      },
      responsePathCounts: {},
    });
  });
});
