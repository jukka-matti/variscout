import { describe, it, expect } from 'vitest';
import { classifyPaste } from '../classifier';

describe('Methodology guard: block-case classifier outputs', () => {
  it('overlap MUST report blockReasons.includes("overlap")', () => {
    const result = classifyPaste(
      {
        hubColumns: ['ts'],
        existingTimeColumn: 'ts',
        existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
      },
      {
        newColumns: ['ts'],
        newRows: [{ ts: '2026-04-15T00:00:00Z' }, { ts: '2026-05-15T00:00:00Z' }],
        newTimeColumn: 'ts',
      }
    );
    expect(result.blockReasons).toContain('overlap');
  });

  it('different-grain MUST report blockReasons.includes("different-grain")', () => {
    const existingRows = Array.from({ length: 24 }, (_, h) => ({
      ts: `2026-04-01T${String(h).padStart(2, '0')}:00:00Z`,
    }));
    const result = classifyPaste(
      {
        hubColumns: ['ts'],
        existingTimeColumn: 'ts',
        existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-01T23:00:00Z' },
        existingRows,
      },
      {
        newColumns: ['ts'],
        newRows: [{ ts: '2026-04-02T00:00:00Z' }, { ts: '2026-04-03T00:00:00Z' }],
        newTimeColumn: 'ts',
      }
    );
    expect(result.blockReasons).toContain('different-grain');
  });

  it('different-source-no-key MUST report blockReasons.includes("different-source-no-key")', () => {
    const result = classifyPaste(
      { hubColumns: ['ts', 'weight_g'] },
      {
        newColumns: ['inspection_ts', 'defect_type'],
        newRows: [{ inspection_ts: '2026-05-05T00:00:00Z', defect_type: 'scratch' }],
      }
    );
    expect(result.blockReasons).toContain('different-source-no-key');
  });
});
