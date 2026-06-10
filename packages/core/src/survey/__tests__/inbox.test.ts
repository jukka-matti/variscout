import { describe, expect, it } from 'vitest';
import { surveyInboxRules } from '../inbox';
import type { ImprovementProject } from '../../improvementProject';
import type { ControlRecord } from '../../control';

const NOW = Date.UTC(2026, 4, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

const controlRecord = (overrides: Partial<ControlRecord>): ControlRecord =>
  ({
    id: 'sr-1',
    projectId: 'inv-1',
    hubId: 'hub-1',
    status: 'verifying',
    title: 'Mix temperature control',
    improvementDate: '2026-05-01T00:00:00.000Z',
    baseline: {
      capturedAt: NOW - 20 * DAY_MS,
      window: {
        startISO: '2026-04-01T00:00:00.000Z',
        endISO: '2026-04-30T23:59:59.999Z',
      },
      measure: 'mix_temperature',
      n: 30,
      mean: 62,
      sigma: 1.2,
    },
    ladder: [7, 30, 90],
    ladderStep: 0,
    lastEvaluatedSnapshotId: undefined,
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
      approach: {},
      outcomeReference: {},
    },
    createdAt: NOW - 45 * DAY_MS,
    deletedAt: null,
    updatedAt: NOW - 45 * DAY_MS,
    ...overrides,
  }) as ImprovementProject;

describe('surveyInboxRules', () => {
  it('aggregates sustainment hints into inbox prompts sorted by severity then message and id', () => {
    const prompts = surveyInboxRules({
      improvementProject: improvementProject({
        id: 'ip-old',
        metadata: { title: 'A closed project' },
      }),
      controlRecords: [
        controlRecord({
          id: 'sr-info',
          title: 'B progress',
          nextCheckSuggestedAt: new Date(NOW - DAY_MS).toISOString(),
        }),
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

  it('aggregates missing handoff lifecycle gaps into inbox prompts', () => {
    const prompts = surveyInboxRules({
      controlRecords: [
        controlRecord({
          id: 'sr-stale',
          projectId: 'inv-stale',
          title: 'Stale verified control',
          status: 'confirmed-sustained',
          updatedAt: NOW - 50 * DAY_MS,
        }),
      ],
      controlHandoffs: [],
      now: NOW,
    });

    expect(prompts).toEqual([
      expect.objectContaining({
        id: 'inbox:lifecycle-gap:sr-stale',
        severity: 'warning',
        action: {
          label: 'Record control handoff',
          opensSurface: 'sustainment',
          opensId: 'sr-stale',
        },
        sourceHint: expect.objectContaining({
          kind: 'lifecycle-gap',
          surface: 'inbox',
          targetEntityId: 'sr-stale',
        }),
      }),
    ]);
  });
});
