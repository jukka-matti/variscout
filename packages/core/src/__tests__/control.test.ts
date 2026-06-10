import { describe, expect, it } from 'vitest';
import {
  advanceLadder,
  isCheckSuggested,
  resetLadder,
  type ControlHandoff,
  type ControlRecord,
  type ControlReview,
} from '../control';
import type { ControlBaseline } from '../control/comparison';

const capturedAt = 1_746_352_800_000;

function makeBaseline(overrides: Partial<ControlBaseline> = {}): ControlBaseline {
  return {
    capturedAt,
    window: {
      startISO: '2026-04-01T00:00:00.000Z',
      endISO: '2026-05-31T23:59:59.999Z',
    },
    measure: 'fill_weight',
    n: 42,
    mean: 100.2,
    sigma: 0.8,
    cpk: 1.42,
    specsSnapshot: { lsl: 98, usl: 102, target: 100 },
    ...overrides,
  };
}

function makeRecord(overrides: Partial<ControlRecord> = {}): ControlRecord {
  return {
    id: 'rec-1',
    title: 'Sustain fill-weight gains',
    projectId: 'inv-1',
    hubId: 'hub-1',
    status: 'verifying',
    improvementDate: '2026-06-01T00:00:00.000Z',
    baseline: makeBaseline(),
    ladder: [7, 30, 90],
    ladderStep: 0,
    nextCheckSuggestedAt: '2026-06-08T00:00:00.000Z',
    createdAt: 1_743_465_600_000,
    updatedAt: 1_743_465_600_000,
    deletedAt: null,
    ...overrides,
  };
}

describe('ControlRecord model shape', () => {
  it('carries the baseline anchor, widening ladder, and narrowed status', () => {
    const record = makeRecord({ status: 'confirmed-sustained', ladderStep: 2 });

    expect(record.baseline.measure).toBe('fill_weight');
    expect(record.improvementDate).toBe('2026-06-01T00:00:00.000Z');
    expect(record.ladder).toEqual([7, 30, 90]);
    expect(record.status).toBe('confirmed-sustained');
  });
});

describe('ControlReview model shape', () => {
  it('captures analyst verdict, now-stats, and data stamp on the re-check', () => {
    const review: ControlReview = {
      id: 'review-1',
      recordId: 'rec-1',
      projectId: 'inv-1',
      hubId: 'hub-1',
      reviewedAt: 1_746_352_800_000,
      reviewer: { displayName: 'Analyst' },
      verdict: 'drifted',
      nowStats: {
        window: {
          startISO: '2026-06-01T00:00:00.000Z',
          endISO: '2026-06-30T23:59:59.999Z',
        },
        n: 12,
        mean: 101.1,
        sigma: 1.4,
        cpk: 0.92,
      },
      dataStamp: {
        rowCount: 64,
        rowTimestampRange: {
          startISO: '2026-06-01T00:00:00.000Z',
          endISO: '2026-06-30T23:59:59.999Z',
        },
        snapshotId: 'snapshot-1',
      },
      observation: 'Capability drifted after the latest run.',
      createdAt: 1_746_352_800_000,
      deletedAt: null,
    };

    expect(review.verdict).toBe('drifted');
    expect(review.nowStats.n).toBe(12);
    expect(review.dataStamp.snapshotId).toBe('snapshot-1');
  });
});

describe('ControlHandoff model shape', () => {
  it('keeps the operating-system handoff fields without lifecycle acknowledgement state', () => {
    const handoff: ControlHandoff = {
      id: 'handoff-1',
      projectId: 'inv-1',
      hubId: 'hub-1',
      surface: 'qms-procedure',
      systemName: 'QMS-42',
      operationalOwner: { displayName: 'Process owner' },
      handoffDate: 1_746_352_800_000,
      description: 'Control transferred to operations.',
      referenceUri: 'https://example.test/qms-42',
      reactionPlan: 'Restore standard work and open a focused investigation if drift repeats.',
      escalationPath: 'Escalate misses to the production manager.',
      recordedBy: { displayName: 'Analyst' },
      createdAt: 1_746_352_800_000,
      deletedAt: null,
    };

    expect(handoff.systemName).toBe('QMS-42');
    expect(handoff.operationalOwner.displayName).toBe('Process owner');
  });
});

describe('isCheckSuggested', () => {
  it('returns true when the soft suggestion timestamp is at or before now', () => {
    expect(isCheckSuggested(makeRecord(), new Date('2026-06-08T00:00:00.000Z'))).toBe(true);
    expect(isCheckSuggested(makeRecord(), new Date('2026-06-09T00:00:00.000Z'))).toBe(true);
  });

  it('returns false for future, missing, invalid, or soft-deleted suggestions', () => {
    expect(isCheckSuggested(makeRecord(), new Date('2026-06-07T23:59:59.999Z'))).toBe(false);
    expect(
      isCheckSuggested(
        makeRecord({ nextCheckSuggestedAt: undefined }),
        new Date('2026-06-09T00:00:00.000Z')
      )
    ).toBe(false);
    expect(
      isCheckSuggested(
        makeRecord({ nextCheckSuggestedAt: 'not-a-date' }),
        new Date('2026-06-09T00:00:00.000Z')
      )
    ).toBe(false);
    expect(
      isCheckSuggested(
        makeRecord({ deletedAt: 1_746_352_800_000 }),
        new Date('2026-06-09T00:00:00.000Z')
      )
    ).toBe(false);
  });
});

describe('advanceLadder', () => {
  it('advances to the next rung and schedules the next suggested check from the new rung', () => {
    const result = advanceLadder(makeRecord(), '2026-06-01T00:00:00.000Z');

    expect(result.ladderStep).toBe(1);
    expect(result.nextCheckSuggestedAt).toBe('2026-07-01T00:00:00.000Z');
  });

  it('caps at the final rung', () => {
    const result = advanceLadder(
      makeRecord({ ladder: [7, 30, 90], ladderStep: 2 }),
      '2026-06-01T00:00:00.000Z'
    );

    expect(result.ladderStep).toBe(2);
    expect(result.nextCheckSuggestedAt).toBe('2026-08-30T00:00:00.000Z');
  });

  it('treats malformed ladders as a one-week suggestion', () => {
    const result = advanceLadder(
      makeRecord({ ladder: [Number.NaN, -1], ladderStep: 5 }),
      '2026-06-01T00:00:00.000Z'
    );

    expect(result.ladderStep).toBe(0);
    expect(result.nextCheckSuggestedAt).toBe('2026-06-08T00:00:00.000Z');
  });
});

describe('resetLadder', () => {
  it('resets to the first rung and schedules the first suggested check', () => {
    const result = resetLadder(
      makeRecord({ ladder: [7, 30, 90], ladderStep: 2 }),
      '2026-06-01T00:00:00.000Z'
    );

    expect(result.ladderStep).toBe(0);
    expect(result.nextCheckSuggestedAt).toBe('2026-06-08T00:00:00.000Z');
  });
});
