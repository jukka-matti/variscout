import { describe, expect, it } from 'vitest';
import {
  applyControlTick,
  evaluateSustainmentSnapshot,
  isControlDue,
  isControlOverdue,
  nextDueFromCadence,
  type ControlHandoff,
  type ControlHandoffStatus,
  type ControlRecord,
} from '../control';
import type { EvidenceSnapshot } from '../evidenceSources';

describe('nextDueFromCadence', () => {
  it('adds 7 days for weekly cadence anchored to a known timestamp', () => {
    const result = nextDueFromCadence('weekly', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2026-05-03T00:00:00.000Z');
  });

  it('adds 14 days for biweekly cadence', () => {
    const result = nextDueFromCadence('biweekly', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2026-05-10T00:00:00.000Z');
  });

  it('adds 30 days for monthly cadence', () => {
    const result = nextDueFromCadence('monthly', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2026-05-26T00:00:00.000Z');
  });

  it('returns undefined for on-demand cadence', () => {
    const result = nextDueFromCadence('on-demand', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBeUndefined();
  });

  it('handles month-end overflow (Jan 31 + 1 month → Feb 28 in non-leap year)', () => {
    const result = nextDueFromCadence('monthly', new Date('2027-01-31T00:00:00.000Z'));
    expect(result).toBe('2027-02-28T00:00:00.000Z');
  });

  it('handles annual cadence with year rollover', () => {
    const result = nextDueFromCadence('annual', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2027-04-26T00:00:00.000Z');
  });

  it('handles quarterly cadence (3 months)', () => {
    const result = nextDueFromCadence('quarterly', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2026-07-26T00:00:00.000Z');
  });

  it('handles semiannual cadence (6 months)', () => {
    const result = nextDueFromCadence('semiannual', new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toBe('2026-10-26T00:00:00.000Z');
  });
});

describe('ControlHandoff V1 lifecycle shape', () => {
  it('supports pending, acknowledged, and operational lifecycle state', () => {
    const states: ControlHandoffStatus[] = ['pending', 'acknowledged', 'operational'];
    const handoff: ControlHandoff = {
      id: 'handoff-1',
      projectId: 'inv-1',
      hubId: 'hub-1',
      status: 'acknowledged',
      surface: 'qms-procedure',
      systemName: 'QMS-42',
      operationalOwner: { displayName: 'Process owner' },
      handoffDate: 1_746_352_800_000,
      description: 'Control transferred to operations.',
      retainControlReview: true,
      recordedBy: { displayName: 'Analyst' },
      acknowledgedAt: 1_746_352_900_000,
      ownerAcknowledgement: {
        acknowledgedBy: { displayName: 'Process owner' },
        notes: 'Accepted into daily control.',
      },
      escalationPath: 'Escalate misses to the production manager.',
      reactionPlan: 'Restore standard work and open a focused investigation if drift repeats.',
      createdAt: 1_746_352_800_000,
      deletedAt: null,
    };

    expect(states).toHaveLength(3);
    expect(handoff.status).toBe('acknowledged');
    expect(handoff.acknowledgedAt).toBe(1_746_352_900_000);
  });
});

function makeRecord(nextReviewDue?: string): ControlRecord {
  return {
    id: 'rec-1',
    title: 'Sustain fill-weight gains',
    projectId: 'inv-1',
    hubId: 'hub-1',
    cadence: 'monthly',
    status: 'pending',
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    nextReviewDue,
    createdAt: 1743465600000,
    updatedAt: 1743465600000,
    deletedAt: null,
  };
}

function makeSnapshot(overrides: Partial<EvidenceSnapshot> = {}): EvidenceSnapshot {
  return {
    id: 'snapshot-1',
    hubId: 'hub-1',
    sourceId: 'source-1',
    capturedAt: '2026-05-12T00:00:00.000Z',
    rowCount: 5,
    origin: 'paste',
    importedAt: 1_746_352_800_000,
    createdAt: 1_746_352_800_000,
    deletedAt: null,
    ...overrides,
  };
}

describe('evaluateSustainmentSnapshot', () => {
  it('returns inconclusive when the snapshot has no actionable latestSignals', () => {
    expect(evaluateSustainmentSnapshot(makeRecord(), makeSnapshot()).verdict).toBe('inconclusive');
    expect(
      evaluateSustainmentSnapshot(
        makeRecord(),
        makeSnapshot({
          latestSignals: [
            {
              id: 'signal-neutral',
              label: 'No target configured',
              value: 0,
              severity: 'neutral',
              capturedAt: '2026-05-12T00:00:00.000Z',
            },
          ],
        })
      ).verdict
    ).toBe('inconclusive');
  });

  it('returns drifting when any actionable signal is amber or red', () => {
    const result = evaluateSustainmentSnapshot(
      makeRecord(),
      makeSnapshot({
        latestSignals: [
          {
            id: 'signal-green',
            label: 'Cpk',
            value: 1.41,
            severity: 'green',
            capturedAt: '2026-05-12T00:00:00.000Z',
          },
          {
            id: 'signal-amber',
            label: 'Scrap',
            value: 0.08,
            severity: 'amber',
            capturedAt: '2026-05-12T00:00:00.000Z',
          },
        ],
      })
    );

    expect(result.verdict).toBe('drifting');
    expect(result.actionableSignalCount).toBe(2);
  });

  it('returns holding when all actionable signals are green', () => {
    const result = evaluateSustainmentSnapshot(
      makeRecord(),
      makeSnapshot({
        latestSignals: [
          {
            id: 'signal-green',
            label: 'Cpk',
            value: 1.41,
            severity: 'green',
            capturedAt: '2026-05-12T00:00:00.000Z',
          },
        ],
      })
    );

    expect(result.verdict).toBe('holding');
    expect(result.actionableSignalCount).toBe(1);
  });
});

describe('applyControlTick', () => {
  it('increments consecutiveOnTargetTicks and auto-confirms after four holding ticks', () => {
    const record = { ...makeRecord(), consecutiveOnTargetTicks: 3 };
    const snapshot = makeSnapshot({
      latestSignals: [
        {
          id: 'signal-green',
          label: 'Cpk',
          value: 1.41,
          severity: 'green',
          capturedAt: '2026-05-12T00:00:00.000Z',
        },
      ],
    });

    const result = applyControlTick(record, snapshot, 1_746_352_800_000);

    expect(result.record.consecutiveOnTargetTicks).toBe(4);
    expect(result.record.status).toBe('confirmed-sustained');
    expect(result.record.lastEvaluatedSnapshotId).toBe('snapshot-1');
    expect(result.review.verdict).toBe('holding');
    expect(result.review.snapshotId).toBe('snapshot-1');
  });

  it('does not auto-confirm when hasOverride is true', () => {
    const result = applyControlTick(
      { ...makeRecord(), consecutiveOnTargetTicks: 3, hasOverride: true },
      makeSnapshot({
        latestSignals: [
          {
            id: 'signal-green',
            label: 'Cpk',
            value: 1.41,
            severity: 'green',
            capturedAt: '2026-05-12T00:00:00.000Z',
          },
        ],
      }),
      1_746_352_800_000
    );

    expect(result.record.consecutiveOnTargetTicks).toBe(4);
    expect(result.record.status).toBe('pending');
  });

  it('resets the counter and marks confirmed records drifted on amber or red signals', () => {
    const result = applyControlTick(
      {
        ...makeRecord(),
        status: 'confirmed-sustained',
        consecutiveOnTargetTicks: 4,
      },
      makeSnapshot({
        latestSignals: [
          {
            id: 'signal-red',
            label: 'Defects',
            value: 3,
            severity: 'red',
            capturedAt: '2026-05-12T00:00:00.000Z',
          },
        ],
      }),
      1_746_352_800_000
    );

    expect(result.record.consecutiveOnTargetTicks).toBe(0);
    expect(result.record.status).toBe('drifted');
    expect(result.review.verdict).toBe('drifting');
  });

  it('leaves counter and status unchanged for inconclusive snapshots', () => {
    const result = applyControlTick(
      { ...makeRecord(), consecutiveOnTargetTicks: 2 },
      makeSnapshot({ latestSignals: [] }),
      1_746_352_800_000
    );

    expect(result.record.consecutiveOnTargetTicks).toBe(2);
    expect(result.record.status).toBe('pending');
    expect(result.review.verdict).toBe('inconclusive');
  });
});

describe('isControlDue', () => {
  it('returns false when nextReviewDue is undefined', () => {
    expect(isControlDue(makeRecord(), new Date('2026-04-26T00:00:00.000Z'))).toBe(false);
  });

  it('returns true when nextReviewDue is at or before now', () => {
    expect(
      isControlDue(makeRecord('2026-04-26T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(true);
    expect(
      isControlDue(makeRecord('2026-04-25T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(true);
  });

  it('returns false when nextReviewDue is in the future', () => {
    expect(
      isControlDue(makeRecord('2026-04-27T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(false);
  });

  it('returns false for soft-deleted records (deletedAt !== null)', () => {
    const record = {
      ...makeRecord('2026-04-01T00:00:00.000Z'),
      deletedAt: 1745107200000, // 2026-04-20T00:00:00.000Z
    };
    expect(isControlDue(record, new Date('2026-04-26T00:00:00.000Z'))).toBe(false);
  });
});

describe('isControlOverdue', () => {
  it('returns false within graceDays of nextReviewDue', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    expect(isControlOverdue(record, new Date('2026-04-26T00:00:00.000Z'), 0)).toBe(false);
    expect(isControlOverdue(record, new Date('2026-05-02T00:00:00.000Z'), 7)).toBe(false);
  });

  it('returns true past graceDays', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    expect(isControlOverdue(record, new Date('2026-04-27T00:00:00.000Z'), 0)).toBe(true);
    expect(isControlOverdue(record, new Date('2026-05-04T00:00:00.000Z'), 7)).toBe(true);
  });

  it('returns false for soft-deleted records even when past due', () => {
    const record = {
      ...makeRecord('2026-04-01T00:00:00.000Z'),
      deletedAt: 1745107200000, // 2026-04-20T00:00:00.000Z
    };
    expect(isControlOverdue(record, new Date('2026-04-26T00:00:00.000Z'), 0)).toBe(false);
  });

  it('returns false at the exact graceDays cutoff (exclusive boundary)', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    // 2026-04-26 + 7 days = 2026-05-03 — at the cutoff, NOT overdue
    expect(isControlOverdue(record, new Date('2026-05-03T00:00:00.000Z'), 7)).toBe(false);
    // 1ms past the cutoff — overdue
    expect(isControlOverdue(record, new Date('2026-05-03T00:00:00.001Z'), 7)).toBe(true);
  });

  it('clamps negative graceDays to 0 (cannot be more strict than strict)', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    // -7 graceDays would shrink the cliff inward; clamped to 0
    expect(isControlOverdue(record, new Date('2026-04-25T00:00:00.000Z'), -7)).toBe(false);
    expect(isControlOverdue(record, new Date('2026-04-26T00:00:00.000Z'), -7)).toBe(false);
    expect(isControlOverdue(record, new Date('2026-04-27T00:00:00.000Z'), -7)).toBe(true);
  });
});
