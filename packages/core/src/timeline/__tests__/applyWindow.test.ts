import { describe, it, expect } from 'vitest';
import { applyWindow } from '../applyWindow';
import type { DataRow } from '../../types';

const rows: DataRow[] = [
  { timestamp: '2026-03-01T08:00:00Z', value: 1 },
  { timestamp: '2026-03-15T12:00:00Z', value: 2 },
  { timestamp: '2026-04-01T08:00:00Z', value: 3 },
  { timestamp: '2026-04-29T08:00:00Z', value: 4 },
];

describe('applyWindow', () => {
  it('filters by fixed window', () => {
    const result = applyWindow(rows, 'timestamp', {
      kind: 'fixed',
      startISO: '2026-03-10T00:00:00Z',
      endISO: '2026-04-10T00:00:00Z',
    });
    expect(result.map(r => r.value)).toEqual([2, 3]);
  });

  it('filters by rolling window from now', () => {
    const now = new Date('2026-04-29T12:00:00Z');
    const result = applyWindow(rows, 'timestamp', { kind: 'rolling', windowDays: 7 }, now);
    expect(result.map(r => r.value)).toEqual([4]);
  });

  it('filters by open-ended window (start to now)', () => {
    const now = new Date('2026-04-29T12:00:00Z');
    const result = applyWindow(
      rows,
      'timestamp',
      { kind: 'openEnded', startISO: '2026-04-01T00:00:00Z' },
      now
    );
    expect(result.map(r => r.value)).toEqual([3, 4]);
  });

  it('returns all rows for cumulative window', () => {
    const result = applyWindow(rows, 'timestamp', { kind: 'cumulative' });
    expect(result.map(r => r.value)).toEqual([1, 2, 3, 4]);
  });

  it('skips rows where the timeColumn is null/missing', () => {
    const withNulls: DataRow[] = [{ timestamp: null, value: 99 }, ...rows];
    const result = applyWindow(withNulls, 'timestamp', { kind: 'cumulative' });
    expect(result.map(r => r.value)).toEqual([1, 2, 3, 4]); // null-timestamp row dropped
  });

  it('returns empty array if timeColumn does not exist on rows', () => {
    const result = applyWindow(rows, 'nonexistent', { kind: 'cumulative' });
    expect(result).toEqual([]);
  });
});
