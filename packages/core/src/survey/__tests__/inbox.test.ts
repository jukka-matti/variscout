import { describe, expect, it } from 'vitest';
import { surveyInboxRules } from '../inbox';
import type { ImprovementProject } from '../../improvementProject';
import type { ControlHandoff, ControlRecord } from '../../control';

const NOW = Date.UTC(2026, 4, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

const controlRecord = (overrides: Partial<ControlRecord>): ControlRecord =>
  ({
    id: 'sr-1',
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'pending',
    title: 'Mix temperature control',
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'weekly',
    createdAt: NOW - 10 * DAY_MS,
    deletedAt: null,
    updatedAt: NOW - DAY_MS,
    ...overrides,
  }) as ControlRecord;

const improvementProject = (overrides: Partial<ImprovementProject>): ImprovementProject =>
  ({
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'closed',
    metadata: { title: 'Reduce mix temperature drift' },
    goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }] },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: NOW - 45 * DAY_MS,
    deletedAt: null,
    updatedAt: NOW - 45 * DAY_MS,
    ...overrides,
  }) as ImprovementProject;

const controlHandoff = (overrides: Partial<ControlHandoff>): ControlHandoff =>
  ({
    id: 'handoff-1',
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'pending',
    surface: 'qms-procedure',
    systemName: 'QMS',
    operationalOwner: { displayName: 'Ops owner' },
    handoffDate: NOW - 8 * DAY_MS,
    description: 'Update procedure controls',
    retainControlReview: true,
    recordedBy: { displayName: 'Investigator' },
    createdAt: NOW - 8 * DAY_MS,
    deletedAt: null,
    ...overrides,
  }) as ControlHandoff;

describe('surveyInboxRules', () => {
  it('aggregates sustainment hints into inbox prompts sorted by severity then message and id', () => {
    const prompts = surveyInboxRules({
      improvementProjects: [
        improvementProject({ id: 'ip-old', metadata: { title: 'A closed project' } }),
      ],
      controlRecords: [
        controlRecord({ id: 'sr-info', title: 'B progress', consecutiveOnTargetTicks: 3 }),
        controlRecord({ id: 'sr-critical', title: 'C drift', status: 'drifted' }),
      ],
      now: NOW,
    });

    expect(prompts.map(prompt => prompt.severity)).toEqual(['critical', 'warning', 'info']);
    expect(prompts.map(prompt => prompt.sourceHint.surface)).toEqual(['inbox', 'inbox', 'inbox']);
    expect(prompts.map(prompt => prompt.id)).toEqual([
      'inbox:drift-detection:sr-critical',
      'inbox:lifecycle-gap:ip-old',
      'inbox:drift-detection:sr-info',
    ]);
    expect(prompts[0]).toMatchObject({
      action: {
        label: 'Open sustainment record',
        opensSurface: 'sustainment',
        opensId: 'sr-critical',
      },
      sourceHint: {
        kind: 'drift-detection',
        surface: 'inbox',
        targetEntityId: 'sr-critical',
      },
    });
  });

  it('aggregates handoff lifecycle gaps into inbox prompts', () => {
    const prompts = surveyInboxRules({
      controlHandoffs: [controlHandoff({ id: 'handoff-stale' })],
      now: NOW,
    });

    expect(prompts).toEqual([
      expect.objectContaining({
        id: 'inbox:lifecycle-gap:handoff-stale',
        severity: 'warning',
        action: {
          label: 'Open handoff',
          opensSurface: 'sustainment',
          opensId: 'handoff-stale',
        },
        sourceHint: expect.objectContaining({
          kind: 'lifecycle-gap',
          surface: 'inbox',
          targetEntityId: 'handoff-stale',
        }),
      }),
    ]);
  });
});
