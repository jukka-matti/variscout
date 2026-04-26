import { describe, expect, it } from 'vitest';
import {
  isSustainmentDue,
  isSustainmentOverdue,
  nextDueFromCadence,
  type SustainmentRecord,
} from '../sustainment';

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
