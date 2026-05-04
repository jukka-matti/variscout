import { describe, it, expect } from 'vitest';
import { createSnapshotProvenance } from '../provenance';
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
});
