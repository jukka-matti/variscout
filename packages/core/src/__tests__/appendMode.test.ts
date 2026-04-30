import { describe, it, expect } from 'vitest';
import { mergeRows } from '../appendMode';
import type { DataRow } from '../types';

describe('mergeRows', () => {
  const keyColumns = ['timestamp', 'shift', 'value'];

  it('appends rows with no overlap', () => {
    const existing: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 100 }];
    const incoming: DataRow[] = [{ timestamp: '2026-04-02T08:00:00Z', shift: 'A', value: 102 }];
    const { merged, report } = mergeRows(existing, incoming, keyColumns);
    expect(merged).toHaveLength(2);
    expect(report).toEqual({ added: 1, duplicates: 0, corrected: 0 });
  });

  it('drops exact duplicates', () => {
    const existing: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 100 }];
    const incoming: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 100 }];
    const { merged, report } = mergeRows(existing, incoming, keyColumns);
    expect(merged).toHaveLength(1);
    expect(report.duplicates).toBe(1);
    expect(report.added).toBe(0);
  });

  it('treats matching key + different value as a correction (newer wins)', () => {
    const existing: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 100 }];
    const incoming: DataRow[] = [{ timestamp: '2026-04-01T08:00:00Z', shift: 'A', value: 105 }];
    const keyColumnsExceptValue = ['timestamp', 'shift']; // value not in keys -> correction
    const { merged, report } = mergeRows(existing, incoming, keyColumnsExceptValue);
    expect(merged).toHaveLength(1);
    expect(merged[0].value).toBe(105);
    expect(report.corrected).toBe(1);
  });
});
