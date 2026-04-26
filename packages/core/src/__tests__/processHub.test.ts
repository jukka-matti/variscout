import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROCESS_HUB,
  DEFAULT_PROCESS_HUB_ID,
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
});
