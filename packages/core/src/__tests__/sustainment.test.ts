import { describe, expect, it } from 'vitest';
import {
  isSustainmentDue,
  isSustainmentOverdue,
  nextDueFromCadence,
  selectControlHandoffCandidates,
  selectSustainmentBuckets,
  selectSustainmentReviews,
  type ControlHandoff,
  type ControlHandoffSurface,
  type SustainmentCadence,
  type SustainmentRecord,
  type SustainmentVerdict,
} from '../sustainment';
import type { ProcessHubInvestigation } from '../processHub';

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

function makeRecord(nextReviewDue?: string): SustainmentRecord {
  return {
    id: 'rec-1',
    investigationId: 'inv-1',
    hubId: 'hub-1',
    cadence: 'monthly',
    nextReviewDue,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  };
}

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

  it('returns false for tombstoned records', () => {
    const record = {
      ...makeRecord('2026-04-01T00:00:00.000Z'),
      tombstoneAt: '2026-04-20T00:00:00.000Z',
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

  it('returns false for tombstoned records even when past due', () => {
    const record = {
      ...makeRecord('2026-04-01T00:00:00.000Z'),
      tombstoneAt: '2026-04-20T00:00:00.000Z',
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
  status: NonNullable<ProcessHubInvestigation['metadata']>['investigationStatus'],
  sustainmentProjection?: {
    recordId: string;
    cadence: SustainmentCadence;
    nextReviewDue?: string;
    latestVerdict?: SustainmentVerdict;
  }
): ProcessHubInvestigation {
  return {
    id,
    name: id,
    modified: '2026-04-26T00:00:00.000Z',
    metadata: {
      findingCounts: {},
      questionCounts: {},
      actionCounts: { total: 0, completed: 0, overdue: 0 },
      processHubId: 'hub-1',
      investigationStatus: status,
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
    surface,
    systemName: 'System',
    operationalOwner: { userId: 'u-1', displayName: 'Op' },
    handoffDate: '2026-04-26T00:00:00.000Z',
    description: '',
    retainSustainmentReview: retain,
    recordedAt: '2026-04-26T00:00:00.000Z',
    recordedBy: { userId: 'u-1', displayName: 'Op' },
  };
}

describe('selectSustainmentReviews', () => {
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

    const result = selectSustainmentReviews(
      investigations,
      [due, future],
      [],
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result.map(r => r.investigation.id)).toEqual(['inv-1']);
  });

  it('excludes controlled investigations whose ControlHandoff.retainSustainmentReview is false', () => {
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

    const result = selectSustainmentReviews(
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

    const result = selectSustainmentReviews(
      investigations,
      [due],
      handoffs,
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result.map(r => r.investigation.id)).toEqual(['inv-1']);
  });

  it('skips tombstoned records', () => {
    const tombstoned = {
      ...makeRecord('2026-04-25T00:00:00.000Z'),
      id: 'rec-1',
      investigationId: 'inv-1',
      tombstoneAt: '2026-04-26T00:00:00.000Z',
    };
    const investigations = [
      makeInvestigation('inv-1', 'resolved', {
        recordId: 'rec-1',
        cadence: 'monthly',
        nextReviewDue: tombstoned.nextReviewDue,
      }),
    ];

    const result = selectSustainmentReviews(
      investigations,
      [tombstoned],
      [],
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result).toEqual([]);
  });
});

describe('selectControlHandoffCandidates', () => {
  it('returns controlled investigations with no handoff record', () => {
    const investigations = [
      makeInvestigation('inv-1', 'controlled'),
      makeInvestigation('inv-2', 'resolved'),
      makeInvestigation('inv-3', 'controlled'),
    ];
    const handoffs: ControlHandoff[] = [makeHandoff('inv-3', true, 'qms-procedure')];

    const result = selectControlHandoffCandidates(investigations, handoffs);

    expect(result.map(r => r.investigation.id)).toEqual(['inv-1']);
  });

  it('returns empty when all controlled investigations have handoffs', () => {
    const investigations = [makeInvestigation('inv-1', 'controlled')];
    const handoffs: ControlHandoff[] = [makeHandoff('inv-1', true)];

    const result = selectControlHandoffCandidates(investigations, handoffs);

    expect(result).toEqual([]);
  });
});

describe('selectSustainmentBuckets', () => {
  const NOW = new Date('2026-04-26T00:00:00.000Z');

  function recordFor(
    investigationId: string,
    nextReviewDue?: string,
    overrides: Partial<SustainmentRecord> = {}
  ): SustainmentRecord {
    return {
      id: `rec-${investigationId}`,
      investigationId,
      hubId: 'hub-1',
      cadence: 'monthly',
      nextReviewDue,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
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
    expect(result.dueNow[0]?.investigation.id).toBe('inv-1');
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
    expect(result.dueNow.map(r => r.investigation.id)).toEqual(['inv-1']);
    expect(result.overdue.map(r => r.investigation.id)).toEqual(['inv-2']);
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
    expect(result.recentlyReviewed[0]?.investigation.id).toBe('inv-1');
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

  it('excludes tombstoned records from all buckets', () => {
    const inv = makeInvestigation('inv-1', 'controlled', {
      recordId: 'rec-inv-1',
      cadence: 'monthly',
    });
    const record = recordFor('inv-1', '2026-04-25T00:00:00.000Z', {
      tombstoneAt: '2026-04-24T00:00:00.000Z',
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
    expect(result.overdue.map(r => r.investigation.id)).toEqual(['inv-overdue']);
    expect(result.dueNow.map(r => r.investigation.id)).toEqual(['inv-due']);
    expect(result.recentlyReviewed.map(r => r.investigation.id)).toEqual(['inv-reviewed']);
    const totalLength =
      result.overdue.length + result.dueNow.length + result.recentlyReviewed.length;
    expect(totalLength).toBe(3);
  });
});
