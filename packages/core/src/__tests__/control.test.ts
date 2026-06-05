import { describe, expect, it } from 'vitest';
import {
  applyControlTick,
  evaluateSustainmentSnapshot,
  isControlDue,
  isControlOverdue,
  nextDueFromCadence,
  selectControlBuckets,
  selectControlReviews,
  type ControlHandoff,
  type ControlHandoffSurface,
  type ControlHandoffStatus,
  type ControlRecord,
} from '../control';
import type { EvidenceSnapshot } from '../evidenceSources';
import type { ImprovementProject } from '../improvementProject';

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

// ── PR-PO-2: the control selectors are now keyed on ImprovementProject. ──────
// `makeProject` is the unit; `recordFor` joins via `improvementProjectId` and
// `makeHandoff` bridges via a shared `investigationId` (handoffs carry no
// project FK). The investigationId convention used below is `inv-<projectId>`.

function makeProject(
  id: string,
  status: ImprovementProject['status'] = 'active'
): ImprovementProject {
  return {
    id,
    hubId: 'hub-1',
    status,
    metadata: { title: `Project ${id}` },
    goal: { outcomeGoals: [] },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: 1777161600000,
    updatedAt: 1777161600000,
    deletedAt: null,
  };
}

function makeHandoff(
  projectId: string,
  retain: boolean,
  surface: ControlHandoffSurface = 'mes-recipe'
): ControlHandoff {
  return {
    id: `h-${projectId}`,
    investigationId: `inv-${projectId}`, // bridges to the project via its record
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

function recordForProject(
  projectId: string,
  nextReviewDue?: string,
  overrides: Partial<ControlRecord> = {}
): ControlRecord {
  return {
    id: `rec-${projectId}`,
    title: `Control record for ${projectId}`,
    investigationId: `inv-${projectId}`,
    improvementProjectId: projectId,
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

describe('selectControlReviews', () => {
  it('returns only projects with a due record', () => {
    const due = recordForProject('p-1', '2026-04-25T00:00:00.000Z');
    const future = recordForProject('p-2', '2026-05-25T00:00:00.000Z');
    const projects = [
      makeProject('p-1'),
      makeProject('p-2'),
      makeProject('p-3'), // active, no record → not eligible
    ];

    const result = selectControlReviews(
      projects,
      [due, future],
      [],
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result.map(r => r.project.id)).toEqual(['p-1']);
  });

  it('excludes controlled projects whose ControlHandoff.retainControlReview is false', () => {
    const due = recordForProject('p-1', '2026-04-25T00:00:00.000Z');
    const projects = [makeProject('p-1')];
    const handoffs: ControlHandoff[] = [makeHandoff('p-1', false)];

    const result = selectControlReviews(
      projects,
      [due],
      handoffs,
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result).toEqual([]);
  });

  it('keeps controlled projects whose handoff retains control review', () => {
    const due = recordForProject('p-1', '2026-04-25T00:00:00.000Z');
    const projects = [makeProject('p-1')];
    const handoffs: ControlHandoff[] = [makeHandoff('p-1', true)];

    const result = selectControlReviews(
      projects,
      [due],
      handoffs,
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result.map(r => r.project.id)).toEqual(['p-1']);
  });

  it('skips soft-deleted records (deletedAt !== null)', () => {
    const softDeleted = recordForProject('p-1', '2026-04-25T00:00:00.000Z', {
      deletedAt: 1745625600000, // 2026-04-26T00:00:00.000Z
    });
    const projects = [makeProject('p-1')];

    const result = selectControlReviews(
      projects,
      [softDeleted],
      [],
      new Date('2026-04-26T00:00:00.000Z')
    );

    expect(result).toEqual([]);
  });

  it("label-can't-lie: an active project with no record/handoff is not queued even if a (gone) status said resolved", () => {
    // The predicate gate replaces the analyzeStatus gate. No live artifact +
    // non-closed lifecycle status → not control-eligible → not queued.
    const projects = [makeProject('p-1', 'active')];
    const result = selectControlReviews(projects, [], [], new Date('2026-04-26T00:00:00.000Z'));
    expect(result).toEqual([]);
  });
});

describe('selectControlBuckets', () => {
  const NOW = new Date('2026-04-26T00:00:00.000Z');

  it('places due-but-not-overdue records in dueNow', () => {
    const project = makeProject('p-1');
    const record = recordForProject('p-1', '2026-04-26T00:00:00.000Z'); // exactly due, grace=0 → due, not overdue
    const result = selectControlBuckets([project], [record], [], NOW);
    expect(result.dueNow).toHaveLength(1);
    expect(result.dueNow[0]?.project.id).toBe('p-1');
    expect(result.overdue).toHaveLength(0);
    expect(result.recentlyReviewed).toHaveLength(0);
  });

  it('places strictly-past-due records in overdue with default graceDays=0', () => {
    const project = makeProject('p-1');
    const record = recordForProject('p-1', '2026-04-25T00:00:00.000Z'); // 1 day past due, grace=0 → overdue
    const result = selectControlBuckets([project], [record], [], NOW);
    expect(result.overdue).toHaveLength(1);
    expect(result.dueNow).toHaveLength(0);
  });

  it('honors graceDays — within grace counts as dueNow, past grace as overdue', () => {
    const p1 = makeProject('p-1');
    const p2 = makeProject('p-2');
    // Both due 7 days ago. With graceDays=7, p-1 is at exactly the grace cutoff (still dueNow);
    // p-2 due 8 days ago is past grace (overdue).
    const records = [
      recordForProject('p-1', '2026-04-19T00:00:00.000Z'),
      recordForProject('p-2', '2026-04-18T00:00:00.000Z'),
    ];
    const result = selectControlBuckets([p1, p2], records, [], NOW, { graceDays: 7 });
    expect(result.dueNow.map(r => r.project.id)).toEqual(['p-1']);
    expect(result.overdue.map(r => r.project.id)).toEqual(['p-2']);
  });

  it('places not-yet-due records with recent review in recentlyReviewed', () => {
    const project = makeProject('p-1');
    const record = recordForProject('p-1', '2026-05-15T00:00:00.000Z', {
      latestReviewAt: '2026-04-20T00:00:00.000Z', // 6 days before NOW (within default 14-day window)
      latestVerdict: 'holding',
    });
    const result = selectControlBuckets([project], [record], [], NOW);
    expect(result.recentlyReviewed).toHaveLength(1);
    expect(result.recentlyReviewed[0]?.project.id).toBe('p-1');
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it('drops records reviewed before the recent window from all buckets', () => {
    const project = makeProject('p-1');
    const record = recordForProject('p-1', '2026-05-15T00:00:00.000Z', {
      latestReviewAt: '2026-03-20T00:00:00.000Z', // 37 days back, default window = 14 → out
    });
    const result = selectControlBuckets([project], [record], [], NOW);
    expect(result.recentlyReviewed).toHaveLength(0);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it('respects custom recentReviewWindowDays', () => {
    const project = makeProject('p-1');
    const record = recordForProject('p-1', '2026-05-15T00:00:00.000Z', {
      latestReviewAt: '2026-04-15T00:00:00.000Z', // 11 days back
    });
    expect(
      selectControlBuckets([project], [record], [], NOW, { recentReviewWindowDays: 10 })
        .recentlyReviewed
    ).toHaveLength(0);
    expect(
      selectControlBuckets([project], [record], [], NOW, { recentReviewWindowDays: 30 })
        .recentlyReviewed
    ).toHaveLength(1);
  });

  it('excludes soft-deleted records from all buckets', () => {
    const project = makeProject('p-1');
    const record = recordForProject('p-1', '2026-04-25T00:00:00.000Z', {
      deletedAt: 1745020800000, // 2026-04-24T00:00:00.000Z
      latestReviewAt: '2026-04-20T00:00:00.000Z',
    });
    const result = selectControlBuckets([project], [record], [], NOW);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
    expect(result.recentlyReviewed).toHaveLength(0);
  });

  it('excludes controlled projects whose handoff opted out of control review', () => {
    const project = makeProject('p-1');
    const record = recordForProject('p-1', '2026-04-25T00:00:00.000Z');
    const handoffs = [makeHandoff('p-1', false)];
    const result = selectControlBuckets([project], [record], handoffs, NOW);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it("label-can't-lie: an active project with no live record/handoff is not bucketed", () => {
    // Predicate gate (isControlEligible) replaces the old analyzeStatus gate.
    const project = makeProject('p-1', 'active');
    const result = selectControlBuckets([project], [], [], NOW);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
    expect(result.recentlyReviewed).toHaveLength(0);
  });

  it('drops on-demand records with no latestReviewAt and no nextReviewDue from all buckets', () => {
    // on-demand cadence has no nextReviewDue (per nextDueFromCadence). Until first review,
    // there is nothing to bucket — the parent UI must surface these via a separate path.
    const project = makeProject('p-1');
    const record = recordForProject('p-1', undefined, { cadence: 'on-demand' });
    const result = selectControlBuckets([project], [record], [], NOW);
    expect(result.dueNow).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
    expect(result.recentlyReviewed).toHaveLength(0);
  });

  it('partitions multiple projects across all three buckets without double-counting', () => {
    const overdueP = makeProject('p-overdue');
    const dueP = makeProject('p-due');
    const reviewedP = makeProject('p-reviewed');
    const records = [
      recordForProject('p-overdue', '2026-04-19T00:00:00.000Z'), // 7 days past due, grace=0 → overdue
      recordForProject('p-due', '2026-04-26T00:00:00.000Z'), // exactly due → dueNow
      recordForProject('p-reviewed', '2026-05-26T00:00:00.000Z', {
        latestReviewAt: '2026-04-22T00:00:00.000Z', // 4 days back → recentlyReviewed
      }),
    ];
    const result = selectControlBuckets([overdueP, dueP, reviewedP], records, [], NOW);
    expect(result.overdue.map(r => r.project.id)).toEqual(['p-overdue']);
    expect(result.dueNow.map(r => r.project.id)).toEqual(['p-due']);
    expect(result.recentlyReviewed.map(r => r.project.id)).toEqual(['p-reviewed']);
    const totalLength =
      result.overdue.length + result.dueNow.length + result.recentlyReviewed.length;
    expect(totalLength).toBe(3);
  });
});
