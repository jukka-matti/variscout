import { describe, it, expect } from 'vitest';
import { classifyPaste } from '../classifier';

describe('classifyPaste — temporal axis', () => {
  const HUB_COLS = ['ts', 'weight_g', 'machine_id'];
  const baseCtx = { hubColumns: HUB_COLS, existingTimeColumn: 'ts' };

  it('append — new range > existing max', () => {
    const result = classifyPaste(
      {
        ...baseCtx,
        existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
      },
      {
        newColumns: HUB_COLS,
        newRows: [
          { ts: '2026-05-01T00:00:00Z', weight_g: 100, machine_id: 'm1' },
          { ts: '2026-05-02T00:00:00Z', weight_g: 101, machine_id: 'm1' },
        ],
        newTimeColumn: 'ts',
      }
    );
    expect(result.temporal).toBe('append');
    expect(result.blockReasons).toEqual([]);
  });

  it('backfill — new range < existing min', () => {
    const result = classifyPaste(
      {
        ...baseCtx,
        existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
      },
      {
        newColumns: HUB_COLS,
        newRows: [{ ts: '2026-03-01T00:00:00Z', weight_g: 99, machine_id: 'm1' }],
        newTimeColumn: 'ts',
      }
    );
    expect(result.temporal).toBe('backfill');
  });

  it('overlap — ranges intersect (BLOCK)', () => {
    const result = classifyPaste(
      {
        ...baseCtx,
        existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
      },
      {
        newColumns: HUB_COLS,
        newRows: [
          { ts: '2026-04-15T00:00:00Z', weight_g: 100, machine_id: 'm1' },
          { ts: '2026-05-15T00:00:00Z', weight_g: 102, machine_id: 'm1' },
        ],
        newTimeColumn: 'ts',
      }
    );
    expect(result.temporal).toBe('overlap');
    expect(result.blockReasons).toContain('overlap');
    expect(result.overlapRange).toEqual({
      startISO: '2026-04-15T00:00:00.000Z',
      endISO: '2026-04-30T00:00:00.000Z',
    });
  });

  it('no-timestamp — no time column in new data', () => {
    const result = classifyPaste(
      {
        ...baseCtx,
        existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
      },
      {
        newColumns: HUB_COLS,
        newRows: [{ ts: 'unknown', weight_g: 100, machine_id: 'm1' }],
      }
    );
    expect(result.temporal).toBe('no-timestamp');
  });

  it('replace — same range + >70% duplicates', () => {
    const existingRows = Array.from({ length: 10 }, (_, i) => ({
      ts: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      weight_g: 100 + i,
      machine_id: 'm1',
    }));
    const newRows = existingRows.slice(0, 8).map(r => ({ ...r }));
    const result = classifyPaste(
      {
        hubColumns: HUB_COLS,
        existingTimeColumn: 'ts',
        existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-10T00:00:00Z' },
        existingRows,
      },
      { newColumns: HUB_COLS, newRows, newTimeColumn: 'ts' }
    );
    expect(result.temporal).toBe('replace');
    expect(result.duplicateRate).toBeGreaterThan(0.7);
  });

  it('different-grain — hourly vs daily aggregates (BLOCK)', () => {
    const result = classifyPaste(
      {
        hubColumns: HUB_COLS,
        existingTimeColumn: 'ts',
        existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-01T23:00:00Z' },
        existingRows: Array.from({ length: 24 }, (_, h) => ({
          ts: `2026-04-01T${String(h).padStart(2, '0')}:00:00Z`,
          weight_g: 100,
        })),
      },
      {
        newColumns: HUB_COLS,
        newRows: [
          { ts: '2026-04-02T00:00:00Z', weight_g: 100 },
          { ts: '2026-04-03T00:00:00Z', weight_g: 101 },
        ],
        newTimeColumn: 'ts',
      }
    );
    expect(result.temporal).toBe('different-grain');
    expect(result.blockReasons).toContain('different-grain');
  });
});
