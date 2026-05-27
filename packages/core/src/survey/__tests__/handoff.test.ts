import { describe, expect, it } from 'vitest';
import { surveyHandoffRules } from '../handoff';
import type { ControlHandoff, ControlRecord } from '../../control';

const NOW = Date.UTC(2026, 4, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

const controlRecord = (overrides: Partial<ControlRecord>): ControlRecord =>
  ({
    id: 'sr-1',
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'confirmed-sustained',
    title: 'Mix temperature control',
    consecutiveOnTargetTicks: 4,
    hasOverride: false,
    lastEvaluatedSnapshotId: 'snapshot-1',
    cadence: 'weekly',
    createdAt: NOW - 50 * DAY_MS,
    deletedAt: null,
    updatedAt: NOW - 50 * DAY_MS,
    ...overrides,
  }) as ControlRecord;

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

describe('surveyHandoffRules', () => {
  it('prompts for handoff when confirmed sustainment is older than 6 weeks without live handoff', () => {
    const hints = surveyHandoffRules({
      controlRecords: [controlRecord({ id: 'sr-old', investigationId: 'inv-old' })],
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
          investigationId: 'inv-linked',
          controlHandoffId: 'handoff-linked',
        }),
      ],
      controlHandoffs: [
        controlHandoff({
          id: 'handoff-linked',
          investigationId: 'inv-linked',
          status: 'acknowledged',
          acknowledgedAt: NOW - 7 * DAY_MS,
          deletedAt: null,
        }),
      ],
      now: NOW,
    });

    expect(hints).toHaveLength(0);
  });

  it('prompts when pending handoff awaits owner acknowledgement for 7 days', () => {
    const hints = surveyHandoffRules({
      controlHandoffs: [controlHandoff({ id: 'handoff-stale' })],
      now: NOW,
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: 'lifecycle-gap',
        surface: 'sustainment',
        targetEntityId: 'handoff-stale',
        severity: 'warning',
        action: {
          label: 'Open handoff',
          opensSurface: 'sustainment',
          opensId: 'handoff-stale',
        },
      }),
    ]);
    expect(hints[0].message).toContain('Ops owner');
  });

  it('does not prompt for archived or recently pending handoffs', () => {
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
