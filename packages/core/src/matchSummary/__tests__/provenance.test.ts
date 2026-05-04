import { describe, it, expect } from 'vitest';
import { createSnapshotProvenance, archiveReplacedRows } from '../provenance';
import type { DataRow } from '../../types';

describe('createSnapshotProvenance', () => {
  it('produces origin + importedAt without range when no time column', () => {
    const rows: DataRow[] = [{ weight_g: 100 }, { weight_g: 101 }];
    const prov = createSnapshotProvenance('paste:test', rows);
    expect(prov.origin).toBe('paste:test');
    expect(prov.importedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(prov.rowTimestampRange).toBeUndefined();
  });

  it('derives rowTimestampRange when time column present and parseable', () => {
    const rows: DataRow[] = [
      { ts: '2026-05-01T00:00:00Z', weight_g: 100 },
      { ts: '2026-05-04T00:00:00Z', weight_g: 101 },
      { ts: '2026-05-02T00:00:00Z', weight_g: 99 },
    ];
    const prov = createSnapshotProvenance('paste:test', rows, 'ts');
    expect(prov.rowTimestampRange).toEqual({
      startISO: '2026-05-01T00:00:00.000Z',
      endISO: '2026-05-04T00:00:00.000Z',
    });
  });

  it('omits rowTimestampRange when time column has no parseable values', () => {
    const rows: DataRow[] = [{ ts: 'not-a-date', weight_g: 100 }];
    const prov = createSnapshotProvenance('paste:test', rows, 'ts');
    expect(prov.rowTimestampRange).toBeUndefined();
  });

  it('handles 70,000-row pastes without stack-overflow and returns correct range', () => {
    // Jan 1–365 repeated deterministically — no Math.random
    const rows: DataRow[] = Array.from({ length: 70000 }, (_, i) => ({
      ts: new Date(Date.UTC(2026, 0, 1 + (i % 365))).toISOString(),
    }));
    const prov = createSnapshotProvenance('paste:large', rows, 'ts');
    expect(prov.rowTimestampRange).toBeDefined();
    // First day of range is Jan 1 2026 (i=0,365,...), last is Dec 31 2026 (i=364,729,...)
    expect(prov.rowTimestampRange?.startISO).toBe('2026-01-01T00:00:00.000Z');
    expect(prov.rowTimestampRange?.endISO).toBe('2026-12-31T00:00:00.000Z');
  });

  it('derives rowTimestampRange from Excel serial numbers', () => {
    // Excel serial 44927 = Jan 1, 2023 (serial 60 bug accounted for)
    const rows: DataRow[] = [
      { ts: 44927, weight_g: 100 }, // 2023-01-01
      { ts: 45292, weight_g: 101 }, // 2024-01-01
    ];
    const prov = createSnapshotProvenance('paste:excel', rows, 'ts');
    expect(prov.rowTimestampRange).toBeDefined();
    expect(prov.rowTimestampRange?.startISO).toBe('2023-01-01T00:00:00.000Z');
    expect(prov.rowTimestampRange?.endISO).toBe('2024-01-01T00:00:00.000Z');
  });
});

describe('archiveReplacedRows', () => {
  it('tags replaced rows with __replacedBy:<importId>', () => {
    const existing: DataRow[] = [
      { ts: '2026-04-15', v: 100 },
      { ts: '2026-04-16', v: 101 },
    ];
    const replaced = archiveReplacedRows(existing, 'import-abc');
    expect(replaced).toEqual([
      { ts: '2026-04-15', v: 100, __replacedBy: 'import-abc' },
      { ts: '2026-04-16', v: 101, __replacedBy: 'import-abc' },
    ]);
  });
});
