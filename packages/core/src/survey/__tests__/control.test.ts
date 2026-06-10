import { describe, expect, it } from 'vitest';
import { surveySustainmentRules } from '../control';
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

describe('surveySustainmentRules', () => {
  it('emits a critical drift hint for drifted sustainment records', () => {
    const hints = surveySustainmentRules({
      controlRecords: [controlRecord({ id: 'sr-drifted', status: 'drifted' })],
      now: NOW,
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: 'drift-detection',
        surface: 'sustainment',
        targetEntityId: 'sr-drifted',
        severity: 'critical',
        action: {
          label: 'Open sustainment record',
          opensSurface: 'sustainment',
          opensId: 'sr-drifted',
        },
      }),
    ]);
    expect(hints[0].message).toBe('Mix temperature control has an analyst-recorded drift verdict');
  });

  it('does not emit drift or progress hints for archived sustainment records', () => {
    const hints = surveySustainmentRules({
      controlRecords: [
        controlRecord({
          id: 'sr-archived-drift',
          status: 'drifted',
          deletedAt: NOW - DAY_MS,
        }),
        controlRecord({
          id: 'sr-archived-progress',
          status: 'verifying',
          nextCheckSuggestedAt: new Date(NOW - DAY_MS).toISOString(),
          deletedAt: NOW - DAY_MS,
        }),
      ],
      now: NOW,
    });

    expect(hints).toHaveLength(0);
  });

  it('emits a soft ladder prompt when the next verification is suggested', () => {
    const hints = surveySustainmentRules({
      controlRecords: [
        controlRecord({
          id: 'sr-recheck',
          status: 'verifying',
          ladderStep: 1,
          nextCheckSuggestedAt: new Date(NOW - DAY_MS).toISOString(),
        }),
      ],
      now: NOW,
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: 'drift-detection',
        surface: 'sustainment',
        targetEntityId: 'sr-recheck',
        severity: 'info',
        message: '2nd verification suggested - re-ingest recent data',
      }),
    ]);
  });

  it('does not emit a ladder prompt before the suggested verification date', () => {
    const hints = surveySustainmentRules({
      controlRecords: [
        controlRecord({
          id: 'sr-future',
          status: 'verifying',
          ladderStep: 2,
          nextCheckSuggestedAt: new Date(NOW + DAY_MS).toISOString(),
        }),
      ],
      now: NOW,
    });

    expect(hints).toHaveLength(0);
  });

  it('does not emit a ladder prompt after sustainment is confirmed', () => {
    const hints = surveySustainmentRules({
      controlRecords: [
        controlRecord({
          id: 'sr-confirmed',
          status: 'confirmed-sustained',
          ladderStep: 2,
          nextCheckSuggestedAt: new Date(NOW - DAY_MS).toISOString(),
        }),
      ],
      now: NOW,
    });

    expect(hints).toHaveLength(0);
  });

  it('does not write status or verdict while deriving survey hints', () => {
    const record = controlRecord({
      id: 'sr-negative-control',
      status: 'verifying',
      ladderStep: 1,
      nextCheckSuggestedAt: new Date(NOW - DAY_MS).toISOString(),
    });

    surveySustainmentRules({ controlRecords: [record], now: NOW });

    expect(record.status).toBe('verifying');
    expect('verdict' in record).toBe(false);
  });

  it('emits a lifecycle gap for closed improvement projects older than 30 days without live sustainment', () => {
    const hints = surveySustainmentRules({
      improvementProject: improvementProject({ id: 'ip-old' }),
      controlRecords: [],
      now: NOW,
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: 'lifecycle-gap',
        surface: 'inbox',
        targetEntityId: 'ip-old',
        severity: 'warning',
        action: { label: 'Set up sustainment', opensSurface: 'sustainment', opensId: 'ip-old' },
      }),
    ]);
    expect(hints[0].message).toContain('Reduce mix temperature drift');
  });

  it('emits a lifecycle gap when a closed improvement project reaches 30 days without live sustainment', () => {
    const hints = surveySustainmentRules({
      improvementProject: improvementProject({
        id: 'ip-threshold',
        createdAt: NOW - 30 * DAY_MS,
        updatedAt: NOW - 30 * DAY_MS,
      }),
      controlRecords: [],
      now: NOW,
    });

    expect(hints.filter(hint => hint.kind === 'lifecycle-gap')).toHaveLength(1);
  });

  it('does not emit lifecycle gaps for archived improvement projects', () => {
    const hints = surveySustainmentRules({
      improvementProject: improvementProject({ id: 'ip-archived', deletedAt: NOW - DAY_MS }),
      controlRecords: [],
      now: NOW,
    });

    expect(hints.filter(hint => hint.kind === 'lifecycle-gap')).toHaveLength(0);
  });

  it('does not emit a lifecycle gap when the closed project has linked live sustainment', () => {
    const hints = surveySustainmentRules({
      improvementProject: improvementProject({ id: 'ip-linked' }),
      controlRecords: [
        controlRecord({
          id: 'sr-linked',
          status: 'verifying',
          improvementProjectId: 'ip-linked',
          deletedAt: null,
        }),
      ],
      now: NOW,
    });

    expect(hints.filter(hint => hint.kind === 'lifecycle-gap')).toHaveLength(0);
  });
});
