import { describe, expect, it } from 'vitest';
import {
  applySustainmentTick,
  evaluateSustainmentSnapshot,
  isSustainmentDue,
  isSustainmentOverdue,
  nextDueFromCadence,
  selectSustainmentBuckets,
  selectControlReviews,
  type ControlHandoff,
  type ControlHandoffSurface,
  type ControlHandoffStatus,
  type ControlCadence,
  type ControlRecord,
  type ControlVerdict,
} from '../control';
import type { EvidenceSnapshot } from '../evidenceSources';
import type { ProcessHubAnalyze } from '../processHub';

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
  it('supports pending, acknowledged, and operational lifecycle state plus signoff metadata', () => {
    const states: ControlHandoffStatus[] = ['pending', 'acknowledged', 'operational'];
    const handoff: ControlHandoff = {
      id: 'handoff-1',
      investigationId: 'inv-1',
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
      signoff: {
        requestedAt: 1_746_353_000_000,
        approvedAt: 1_746_353_100_000,
        approvedBy: { displayName: 'Sponsor' },
      },
      createdAt: 1_746_352_800_000,
      deletedAt: null,
    };

    expect(states).toHaveLength(3);
    expect(handoff.status).toBe('acknowledged');
    expect(handoff.signoff?.approvedBy?.displayName).toBe('Sponsor');
  });
});

function makeRecord(nextReviewDue?: string): ControlRecord {
  return {
    id: 'rec-1',
    title: 'Sustain fill-weight gains',
    investigationId: 'inv-1',
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

describe('applySustainmentTick', () => {
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

    const result = applySustainmentTick(record, snapshot, 1_746_352_800_000);

    expect(result.record.consecutiveOnTargetTicks).toBe(4);
    expect(result.record.status).toBe('confirmed-sustained');
    expect(result.record.lastEvaluatedSnapshotId).toBe('snapshot-1');
    expect(result.review.verdict).toBe('holding');
    expect(result.review.snapshotId).toBe('snapshot-1');
  });

  it('does not auto-confirm when hasOverride is true', () => {
    const result = applySustainmentTick(
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
    const result = applySustainmentTick(
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
    const result = applySustainmentTick(
      { ...makeRecord(), consecutiveOnTargetTicks: 2 },
      makeSnapshot({ latestSignals: [] }),
      1_746_352_800_000
    );

    expect(result.record.consecutiveOnTargetTicks).toBe(2);
    expect(result.record.status).toBe('pending');
    expect(result.review.verdict).toBe('inconclusive');
  });
});

describe('isSustainmentDue', () => {
  it('returns false when nextReviewDue is undefined', () => {
    expect(isSustainmentDue(makeRecord(), new Date('2026-04-26T00:00:00.000Z'))).toBe(false);
  });

  it('returns true when nextReviewDue is at or before now', () => {
    expect(
      isSustainmentDue(makeRecord('2026-04-26T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(true);
    expect(
      isSustainmentDue(makeRecord('2026-04-25T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(true);
  });

  it('returns false when nextReviewDue is in the future', () => {
    expect(
      isSustainmentDue(makeRecord('2026-04-27T00:00:00.000Z'), new Date('2026-04-26T00:00:00.000Z'))
    ).toBe(false);
  });

  it('returns false for soft-deleted records (deletedAt !== null)', () => {
    const record = {
      ...makeRecord('2026-04-01T00:00:00.000Z'),
      deletedAt: 1745107200000, // 2026-04-20T00:00:00.000Z
    };
    expect(isSustainmentDue(record, new Date('2026-04-26T00:00:00.000Z'))).toBe(false);
  });
});

describe('isSustainmentOverdue', () => {
  it('returns false within graceDays of nextReviewDue', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    expect(isSustainmentOverdue(record, new Date('2026-04-26T00:00:00.000Z'), 0)).toBe(false);
    expect(isSustainmentOverdue(record, new Date('2026-05-02T00:00:00.000Z'), 7)).toBe(false);
  });

  it('returns true past graceDays', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    expect(isSustainmentOverdue(record, new Date('2026-04-27T00:00:00.000Z'), 0)).toBe(true);
    expect(isSustainmentOverdue(record, new Date('2026-05-04T00:00:00.000Z'), 7)).toBe(true);
  });

  it('returns false for soft-deleted records even when past due', () => {
    const record = {
      ...makeRecord('2026-04-01T00:00:00.000Z'),
      deletedAt: 1745107200000, // 2026-04-20T00:00:00.000Z
    };
    expect(isSustainmentOverdue(record, new Date('2026-04-26T00:00:00.000Z'), 0)).toBe(false);
  });

  it('returns false at the exact graceDays cutoff (exclusive boundary)', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    // 2026-04-26 + 7 days = 2026-05-03 — at the cutoff, NOT overdue
    expect(isSustainmentOverdue(record, new Date('2026-05-03T00:00:00.000Z'), 7)).toBe(false);
    // 1ms past the cutoff — overdue
    expect(isSustainmentOverdue(record, new Date('2026-05-03T00:00:00.001Z'), 7)).toBe(true);
  });

  it('clamps negative graceDays to 0 (cannot be more strict than strict)', () => {
    const record = makeRecord('2026-04-26T00:00:00.000Z');
    // -7 graceDays would shrink the cliff inward; clamped to 0
    expect(isSustainmentOverdue(record, new Date('2026-04-25T00:00:00.000Z'), -7)).toBe(false);
    expect(isSustainmentOverdue(record, new Date('2026-04-26T00:00:00.000Z'), -7)).toBe(false);
    expect(isSustainmentOverdue(record, new Date('2026-04-27T00:00:00.000Z'), -7)).toBe(true);
  });
});

function makeInvestigation(
  id: string,
  status: NonNullable<ProcessHubAnalyze['metadata']>['analyzeStatus'],
  sustainmentProjection?: {
    recordId: string;
    cadence: ControlCadence;
    nextReviewDue?: string;
    latestVerdict?: ControlVerdict;
  }
): ProcessHubAnalyze {
  return {
    id,
    name: id,
    createdAt: 1777161600000,
    updatedAt: 1777161600000,
    deletedAt: null,
    metadata: {
      findingCounts: {},
      questionCounts: {},
      actionCounts: { total: 0, completed: 0, overdue: 0 },
      processHubId: 'hub-1',
      analyzeStatus: status,
      sustainment: sustainmentProjection,
    },
  };
}

function makeHandoff(
  investigationId: string,
  retain: boolean,
  surface: ControlHandoffSurface = 'mes-recipe'
): ControlHandoff {
  return {
    id: `h-${investigationId}`,
    investigationId,
    hubId: 'hub-1',
    status: 'operational',
    surface,
    systemName: 'System',
    operationalOwner: { userId: 'u-1', displayName: 'Op' },
    handoffDate: 1745625600000, // 2026-04-26T00:00:00.000Z
    description: '',
    retainControlReview: retain,
    createdAt: 1745625600000, // 2026-04-26T00:00:00.000Z (formerly recordedAt)
    recordedBy: { userId: 'u-1', displayName: 'Op' },
    deletedAt: null,
  };
}

describe('selectControlReviews', () => {
  it('returns only investigations with a due record', () => {
    const due = {
      ...makeRecord('2026-04-25T00:00:00.000Z'),
      id: 'rec-due',
      investigationId: 'inv-1',
    };
    const future = {
      ...makeRecord('2026-05-25T00:00:00.000Z'),
      id: 'rec-future',
      investigationId: 'inv-2',
    };
    const investigations = [
      makeInvestigation('inv-1', 'resolved', {
        recordId: due.id,
        cadence: 'monthly',
        nextReviewDue: due.nextReviewDue,
      }),
      makeInvestigation('inv-2', 'controlled', {
        recordId: future.id,
        cadence: 'monthly',
        nextReviewDue: future.nextReviewDue,
      }),
      makeInvestigation('inv-3', 'investigating'),
    ];

    const result = selectControlReviews(
      investigations,
      [due, future],
      [],
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result.map(r => r.analyze.id)).toEqual(['inv-1']);
  });

  it('excludes controlled investigations whose ControlHandoff.retainControlReview is false', () => {
    const due = {
      ...makeRecord('2026-04-25T00:00:00.000Z'),
      id: 'rec-1',
      investigationId: 'inv-1',
    };
    const investigations = [
      makeInvestigation('inv-1', 'controlled', {
        recordId: 'rec-1',
        cadence: 'monthly',
        nextReviewDue: due.nextReviewDue,
      }),
    ];
    const handoffs: ControlHandoff[] = [makeHandoff('inv-1', false)];

    const result = selectControlReviews(
      investigations,
      [due],
      handoffs,
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result).toEqual([]);
  });

  it('keeps controlled investigations whose handoff retains sustainment review', () => {
    const due = {
      ...makeRecord('2026-04-25T00:00:00.000Z'),
      id: 'rec-1',
      investigationId: 'inv-1',
    };
    const investigations = [
      makeInvestigation('inv-1', 'controlled', {
        recordId: 'rec-1',
        cadence: 'monthly',
        nextReviewDue: due.nextReviewDue,
      }),
    ];
    const handoffs: ControlHandoff[] = [makeHandoff('inv-1', true)];

    const result = selectControlReviews(
      investigations,
      [due],
      handoffs,
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result.map(r => r.analyze.id)).toEqual(['inv-1']);
  });

  it('skips soft-deleted records (deletedAt !== null)', () => {
    const softDeleted = {
      ...makeRecord('2026-04-25T00:00:00.000Z'),
      id: 'rec-1',
      investigationId: 'inv-1',
      deletedAt: 1745625600000, // 2026-04-26T00:00:00.000Z
    };
    const investigations = [
      makeInvestigation('inv-1', 'resolved', {
        recordId: 'rec-1',
        cadence: 'monthly',
        nextReviewDue: softDeleted.nextReviewDue,
      }),
    ];

    const result = selectControlReviews(
      investigations,
      [softDeleted],
      [],
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result).toEqual([]);
  });
});

describe('selectSustainmentBuckets', () => {
  const NOW = new Date('2026-04-26T00:00:00.000Z');

  function recordFor(
    investigationId: string,
    nextReviewDue?: string,
    overrides: Partial<ControlRecord> = {}
  ): ControlRecord {
    return {
      id: `rec-${investigationId}`,
      title: `Control record for ${investigationId}`,
      investigationId,
      hubId: 'hub-1',
      cadence: 'monthly',
      status: 'pending',
      consecutiveOnTargetTicks: 0,
      hasOverride: false,
      lastEvaluatedSnapshotId: undefined,
      nextReviewDue,
      createdAt: 1740787200000, // 2026-03-01T00:00:00.000Z
      updatedAt: 1743465600000, // 2026-04-01T00:00:00.000Z
      deletedAt: null,
      ...overrides,
    };
  }

  it('places due-but-not-overdue records in dueNow', () => {
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-04-26T00:00:00.000Z'); // exactly due, grace=0 → due, not overdue
    const result = selectSustainmentBuckets([inv], [record], [], NOW);
    expect(result.dueNow).toHaveLength(1);
    expect(result.dueNow[0]?.analyze.id).toBe('inv-1');
    expect(result.overdue).toHaveLength(0);
    expect(result.recentlyReviewed).toHaveLength(0);
  });

  it('places strictly-past-due records in overdue with default graceDays=0', () => {
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-04-25T00:00:00.000Z'); // 1 day past due, grace=0 → overdue
    const result = selectSustainmentBuckets([inv], [record], [], NOW);
    expect(result.overdue).toHaveLength(1);
    expect(result.dueNow).toHaveLength(0);
  });

  it('honors graceDays — within grace counts as dueNow, past grace as overdue', () => {
    const inv1 = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'weekly',
    });
    const inv2 = makeInvestigation('inv-2', 'controlled', {
      recordId: 'rec-inv-2',
      cadence: 'weekly',
    });
    // Both due 7 days ago. With graceDays=7, inv-1 is at exactly the grace cutoff (still dueNow);
    // inv-2 due 8 days ago is past grace (overdue).
    const records = [
      recordFor('inv-1', '2026-04-19T00:00:00.000Z'),
      recordFor('inv-2', '2026-04-18T00:00:00.000Z'),
    ];
    const result = selectSustainmentBuckets([inv1, inv2], records, [], NOW, { graceDays: 7 });
    expect(result.dueNow.map(r => r.analyze.id)).toEqual(['inv-1']);
    expect(result.overdue.map(r => r.analyze.id)).toEqual(['inv-2']);
  });

  it('places not-yet-due records with recent review in recentlyReviewed', () => {
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-05-15T00:00:00.000Z', {
      latestReviewAt: '2026-04-20T00:00:00.000Z', // 6 days before NOW (within default 14-day window)
      latestVerdict: 'holding',
    });
    const result = selectSustainmentBuckets([inv], [record], [], NOW);
    expect(result.recentlyReviewed).toHaveLength(1);
    expect(result.recentlyReviewed[0]?.analyze.id).toBe('inv-1');
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it('drops records reviewed before the recent window from all buckets', () => {
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-05-15T00:00:00.000Z', {
      latestReviewAt: '2026-03-20T00:00:00.000Z', // 37 days back, default window = 14 → out
    });
    const result = selectSustainmentBuckets([inv], [record], [], NOW);
    expect(result.recentlyReviewed).toHaveLength(0);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it('respects custom recentReviewWindowDays', () => {
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-05-15T00:00:00.000Z', {
      latestReviewAt: '2026-04-15T00:00:00.000Z', // 11 days back
    });
    expect(
      selectSustainmentBuckets([inv], [record], [], NOW, { recentReviewWindowDays: 10 })
        .recentlyReviewed
    ).toHaveLength(0);
    expect(
      selectSustainmentBuckets([inv], [record], [], NOW, { recentReviewWindowDays: 30 })
        .recentlyReviewed
    ).toHaveLength(1);
  });

  it('excludes soft-deleted records from all buckets', () => {
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-04-25T00:00:00.000Z', {
      deletedAt: 1745020800000, // 2026-04-24T00:00:00.000Z
      latestReviewAt: '2026-04-20T00:00:00.000Z',
    });
    const result = selectSustainmentBuckets([inv], [record], [], NOW);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
    expect(result.recentlyReviewed).toHaveLength(0);
  });

  it('excludes controlled investigations whose handoff opted out of sustainment review', () => {
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-04-25T00:00:00.000Z');
    const handoffs = [makeHandoff('inv-1', false)];
    const result = selectSustainmentBuckets([inv], [record], handoffs, NOW);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it('skips investigations whose status is not resolved or controlled', () => {
    const inv = makeInvestigation('inv-1', 'investigating', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-04-25T00:00:00.000Z');
    const result = selectSustainmentBuckets([inv], [record], [], NOW);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
    expect(result.recentlyReviewed).toHaveLength(0);
  });

  it('drops on-demand records with no latestReviewAt and no nextReviewDue from all buckets', () => {
    // on-demand cadence has no nextReviewDue (per nextDueFromCadence). Until first review,
    // there is nothing to bucket — the parent UI must surface these via a separate path.
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'on-demand',
    });
    const record = recordFor('inv-1', undefined, { cadence: 'on-demand' });
    const result = selectSustainmentBuckets([inv], [record], [], NOW);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
    expect(result.recentlyReviewed).toHaveLength(0);
  });

  it('partitions multi-record hubs across all three buckets without double-counting', () => {
    const overdueInv = makeInvestigation('inv-overdue', 'controlled', {
      recordId: 'rec-overdue',
      cadence: 'monthly',
    });
    const dueInv = makeInvestigation('inv-due', 'controlled', {
      recordId: 'rec-due',
      cadence: 'monthly',
    });
    const reviewedInv = makeInvestigation('inv-reviewed', 'resolved', {
      recordId: 'rec-reviewed',
      cadence: 'monthly',
    });
    const records = [
      recordFor('inv-overdue', '2026-04-19T00:00:00.000Z'), // 7 days past due, grace=0 → overdue
      recordFor('inv-due', '2026-04-26T00:00:00.000Z'), // exactly due → dueNow
      recordFor('inv-reviewed', '2026-05-26T00:00:00.000Z', {
        latestReviewAt: '2026-04-22T00:00:00.000Z', // 4 days back → recentlyReviewed
      }),
    ];
    const result = selectSustainmentBuckets([overdueInv, dueInv, reviewedInv], records, [], NOW);
    expect(result.overdue.map(r => r.analyze.id)).toEqual(['inv-overdue']);
    expect(result.dueNow.map(r => r.analyze.id)).toEqual(['inv-due']);
    expect(result.recentlyReviewed.map(r => r.analyze.id)).toEqual(['inv-reviewed']);
    const totalLength =
      result.overdue.length + result.dueNow.length + result.recentlyReviewed.length;
    expect(totalLength).toBe(3);
  });
});
