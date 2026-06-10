import { describe, expect, it } from 'vitest';
import { surveyHandoffRules } from '../handoff';
import type { ControlHandoff, ControlRecord } from '../../control';

const NOW = Date.UTC(2026, 4, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

const controlRecord = (overrides: Partial<ControlRecord>): ControlRecord =>
  ({
    id: 'sr-1',
    projectId: 'inv-1',
    hubId: 'hub-1',
    status: 'confirmed-sustained',
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
    ladderStep: 2,
    lastEvaluatedSnapshotId: 'snapshot-1',
    createdAt: NOW - 50 * DAY_MS,
    deletedAt: null,
    updatedAt: NOW - 50 * DAY_MS,
    ...overrides,
  }) as ControlRecord;

const controlHandoff = (overrides: Partial<ControlHandoff>): ControlHandoff =>
  ({
    id: 'handoff-1',
    projectId: 'inv-1',
    hubId: 'hub-1',
    surface: 'qms-procedure',
    systemName: 'QMS',
    operationalOwner: { displayName: 'Ops owner' },
    handoffDate: NOW - 8 * DAY_MS,
    description: 'Update procedure controls',
    recordedBy: { displayName: 'Investigator' },
    createdAt: NOW - 8 * DAY_MS,
    deletedAt: null,
    ...overrides,
  }) as ControlHandoff;

describe('surveyHandoffRules', () => {
  it('prompts for handoff when confirmed sustainment is older than 6 weeks without live handoff', () => {
    const hints = surveyHandoffRules({
      controlRecords: [controlRecord({ id: 'sr-old', projectId: 'inv-old' })],
      controlHandoffs: [],
      now: NOW,
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: 'lifecycle-gap',
        surface: 'sustainment',
        targetEntityId: 'sr-old',
        severity: 'warning',
        action: {
          label: 'Record control handoff',
          opensSurface: 'sustainment',
          opensId: 'sr-old',
        },
      }),
    ]);
    expect(hints[0].message).toContain('Mix temperature control');
  });

  it('does not prompt for old confirmed sustainment when a linked live handoff exists', () => {
    const hints = surveyHandoffRules({
      controlRecords: [
        controlRecord({
          id: 'sr-linked',
          projectId: 'inv-linked',
          controlHandoffId: 'handoff-linked',
        }),
      ],
      controlHandoffs: [
        controlHandoff({
          id: 'handoff-linked',
          projectId: 'inv-linked',
          deletedAt: null,
        }),
      ],
      now: NOW,
    });

    expect(hints).toHaveLength(0);
  });

  it('does not prompt on handoff age alone because owner acceptance is a closure input', () => {
    const hints = surveyHandoffRules({
      controlHandoffs: [controlHandoff({ id: 'handoff-stale' })],
      now: NOW,
    });

    expect(hints).toHaveLength(0);
  });

  it('does not prompt for archived or recent handoffs', () => {
    const hints = surveyHandoffRules({
      controlHandoffs: [
        controlHandoff({ id: 'handoff-archived', deletedAt: NOW - DAY_MS }),
        controlHandoff({ id: 'handoff-recent', createdAt: NOW - 6 * DAY_MS }),
      ],
      now: NOW,
    });

    expect(hints).toHaveLength(0);
  });
});
