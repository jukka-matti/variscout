import { describe, expect, it } from 'vitest';
import { surveySustainmentRules } from '../control';
import type { ImprovementProject } from '../../improvementProject';
import type { ControlRecord } from '../../control';

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
    expect(hints[0].message).toContain('drift');
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
          status: 'pending',
          consecutiveOnTargetTicks: 3,
          deletedAt: NOW - DAY_MS,
        }),
      ],
      now: NOW,
    });

    expect(hints).toHaveLength(0);
  });

  it('emits a warning drift hint for records whose latest verdict is drifting', () => {
    const hints = surveySustainmentRules({
      controlRecords: [
        controlRecord({ id: 'sr-verdict', status: 'pending', latestVerdict: 'drifting' }),
      ],
      now: NOW,
    });

    expect(hints).toHaveLength(1);
    expect(hints[0]).toMatchObject({
      kind: 'drift-detection',
      surface: 'sustainment',
      targetEntityId: 'sr-verdict',
      severity: 'warning',
    });
  });

  it('emits a 3-of-4 progress prompt for pending records with three on-target ticks', () => {
    const hints = surveySustainmentRules({
      controlRecords: [
        controlRecord({
          id: 'sr-progress',
          status: 'pending',
          consecutiveOnTargetTicks: 3,
          latestVerdict: 'holding',
        }),
      ],
      now: NOW,
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: 'drift-detection',
        surface: 'sustainment',
        targetEntityId: 'sr-progress',
        severity: 'info',
        message: '3 of 4 ticks confirmed',
      }),
    ]);
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
          status: 'pending',
          improvementProjectId: 'ip-linked',
          deletedAt: null,
        }),
      ],
      now: NOW,
    });

    expect(hints.filter(hint => hint.kind === 'lifecycle-gap')).toHaveLength(0);
  });
});
