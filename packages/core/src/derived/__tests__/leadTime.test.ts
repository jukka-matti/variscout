import { describe, it, expect } from 'vitest';
import type { StepTimingBinding } from '../types';
import {
  computeLeadTimeColumn,
  computeTotalWorkTimeColumn,
  computeWaitTimeColumn,
} from '../leadTime';

// ---------------------------------------------------------------------------
// Type-level compile-time check (test 1)
// ---------------------------------------------------------------------------
// These lines must compile; the @ts-expect-error lines must also compile
// (i.e. TypeScript must reject the field-mixing attempt).

const _paired: StepTimingBinding = {
  kind: 'paired',
  stepId: 'step-1',
  startColumn: 'Prep_start',
  endColumn: 'Prep_end',
};

const _duration: StepTimingBinding = {
  kind: 'duration',
  stepId: 'step-2',
  durationColumn: 'Cycle_time_ms',
};

// Mixing fields from both variants must be rejected:
const _mixedPaired: StepTimingBinding = {
  kind: 'paired',
  stepId: 'step-3',
  startColumn: 'Mix_start',
  endColumn: 'Mix_end',
  // @ts-expect-error — 'paired' variant cannot have durationColumn
  durationColumn: 'should-not-exist',
};

const _mixedDuration: StepTimingBinding = {
  kind: 'duration',
  stepId: 'step-4',
  durationColumn: 'X_ms',
  // @ts-expect-error — 'duration' variant cannot have startColumn/endColumn
  startColumn: 'should-not-exist',
};

void _paired;
void _duration;
void _mixedPaired;
void _mixedDuration;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ROW_A = {
  Prep_start: '2026-01-01T08:00:00Z',
  Prep_end: '2026-01-01T08:30:00Z', // 30 min = 1_800_000 ms
};

const ROW_B = {
  Prep_start: '2026-01-01T09:00:00Z',
  Prep_end: '2026-01-01T10:00:00Z', // 60 min = 3_600_000 ms
};

const PAIRED_PREP: StepTimingBinding = {
  kind: 'paired',
  stepId: 'step-prep',
  startColumn: 'Prep_start',
  endColumn: 'Prep_end',
};

const DURATION_CYCLE: StepTimingBinding = {
  kind: 'duration',
  stepId: 'step-cycle',
  durationColumn: 'Cycle_time_ms',
};

// ---------------------------------------------------------------------------
// computeLeadTimeColumn
// ---------------------------------------------------------------------------

describe('computeLeadTimeColumn', () => {
  it('test 2: returns null for empty rows and empty timings', () => {
    expect(computeLeadTimeColumn([], [])).toBeNull();
  });

  it('test 3: returns null for non-empty rows with empty timings', () => {
    expect(computeLeadTimeColumn([ROW_A, ROW_B], [])).toBeNull();
  });

  it('test 4: returns null when all bindings are duration-kind (no paired)', () => {
    expect(computeLeadTimeColumn([{ Cycle_time_ms: 1_800_000 }], [DURATION_CYCLE])).toBeNull();
  });

  it('test 5: returns number[] of correct length when paired timings provided', () => {
    const result = computeLeadTimeColumn([ROW_A, ROW_B], [PAIRED_PREP]);
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBe(2);
    expect(typeof result![0]).toBe('number');
  });

  it('test 6: single paired step — 30-min interval returns 1_800_000 ms', () => {
    const result = computeLeadTimeColumn([ROW_A], [PAIRED_PREP]);
    expect(result).not.toBeNull();
    expect(result![0]).toBe(1_800_000);
  });

  it('test 7: row with missing start produces NaN', () => {
    const row = { Prep_end: '2026-01-01T08:30:00Z' };
    const result = computeLeadTimeColumn([row], [PAIRED_PREP]);
    expect(result).not.toBeNull();
    expect(Number.isNaN(result![0])).toBe(true);
  });

  it('test 8: row with missing end produces NaN', () => {
    const row = { Prep_start: '2026-01-01T08:00:00Z' };
    const result = computeLeadTimeColumn([row], [PAIRED_PREP]);
    expect(result).not.toBeNull();
    expect(Number.isNaN(result![0])).toBe(true);
  });

  it('test 9: two paired steps — Lead_time = max(end) - min(start)', () => {
    // Prep: 08:00 – 08:30  (30 min)
    // Mix:  08:15 – 09:00  (45 min), overlapping
    // Lead_time = max(08:30, 09:00) - min(08:00, 08:15) = 09:00 - 08:00 = 60 min = 3_600_000 ms
    const row = {
      Prep_start: '2026-01-01T08:00:00Z',
      Prep_end: '2026-01-01T08:30:00Z',
      Mix_start: '2026-01-01T08:15:00Z',
      Mix_end: '2026-01-01T09:00:00Z',
    };
    const mixPaired: StepTimingBinding = {
      kind: 'paired',
      stepId: 'step-mix',
      startColumn: 'Mix_start',
      endColumn: 'Mix_end',
    };
    const result = computeLeadTimeColumn([row], [PAIRED_PREP, mixPaired]);
    expect(result).not.toBeNull();
    expect(result![0]).toBe(3_600_000);
  });
});

// ---------------------------------------------------------------------------
// computeTotalWorkTimeColumn
// ---------------------------------------------------------------------------

describe('computeTotalWorkTimeColumn', () => {
  it('test 10: returns null for empty rows and empty timings', () => {
    expect(computeTotalWorkTimeColumn([], [])).toBeNull();
  });

  it('test 11: paired step — per row sum of (end - start)', () => {
    const result = computeTotalWorkTimeColumn([ROW_A, ROW_B], [PAIRED_PREP]);
    expect(result).not.toBeNull();
    expect(result![0]).toBe(1_800_000); // 30 min
    expect(result![1]).toBe(3_600_000); // 60 min
  });

  it('test 12: duration step — per row sum of durationColumn values (assumed ms)', () => {
    const rows = [{ Cycle_time_ms: 1_800_000 }, { Cycle_time_ms: 900_000 }];
    const result = computeTotalWorkTimeColumn(rows, [DURATION_CYCLE]);
    expect(result).not.toBeNull();
    expect(result![0]).toBe(1_800_000);
    expect(result![1]).toBe(900_000);
  });

  it('test 13: duration column value 1_800_000 contributes exactly 1_800_000 to total (ms assumption)', () => {
    const row = { Cycle_time_ms: 1_800_000 };
    const result = computeTotalWorkTimeColumn([row], [DURATION_CYCLE]);
    expect(result).not.toBeNull();
    expect(result![0]).toBe(1_800_000);
  });

  it('test 13b: mixed paired + duration — total = (paired_end - paired_start) + durationValue', () => {
    // Prep:         08:00 – 08:30 = 1_800_000 ms
    // Cycle_time_ms: 600_000 ms (10 min)
    // Total: 1_800_000 + 600_000 = 2_400_000
    const row = { ...ROW_A, Cycle_time_ms: 600_000 };
    const result = computeTotalWorkTimeColumn([row], [PAIRED_PREP, DURATION_CYCLE]);
    expect(result).not.toBeNull();
    expect(result![0]).toBe(2_400_000);
  });
});

// ---------------------------------------------------------------------------
// computeWaitTimeColumn
// ---------------------------------------------------------------------------

describe('computeWaitTimeColumn', () => {
  it('test 14: returns null for empty rows and empty timings', () => {
    expect(computeWaitTimeColumn([], [])).toBeNull();
  });

  it('test 15: returns null when only duration bindings (Lead_time would be null)', () => {
    const rows = [{ Cycle_time_ms: 1_800_000 }];
    expect(computeWaitTimeColumn(rows, [DURATION_CYCLE])).toBeNull();
  });

  it('test 16: two paired steps — Wait_time = Lead_time - Total_work_time per row', () => {
    // Prep: 08:00 – 08:30 (30 min = 1_800_000 ms)
    // Mix:  08:45 – 09:15 (30 min = 1_800_000 ms)
    // Lead_time = max(08:30, 09:15) - min(08:00, 08:45) = 09:15 - 08:00 = 75 min = 4_500_000 ms
    // Total_work_time = 1_800_000 + 1_800_000 = 3_600_000 ms
    // Wait_time = 4_500_000 - 3_600_000 = 900_000 ms (15 min)
    const row = {
      Prep_start: '2026-01-01T08:00:00Z',
      Prep_end: '2026-01-01T08:30:00Z',
      Mix_start: '2026-01-01T08:45:00Z',
      Mix_end: '2026-01-01T09:15:00Z',
    };
    const mixPaired: StepTimingBinding = {
      kind: 'paired',
      stepId: 'step-mix',
      startColumn: 'Mix_start',
      endColumn: 'Mix_end',
    };
    const result = computeWaitTimeColumn([row], [PAIRED_PREP, mixPaired]);
    expect(result).not.toBeNull();
    expect(result![0]).toBe(900_000);
  });

  it('test 16b: NaN propagates — missing start causes NaN Wait_time', () => {
    const row = { Prep_end: '2026-01-01T08:30:00Z' };
    const result = computeWaitTimeColumn([row], [PAIRED_PREP]);
    expect(result).not.toBeNull();
    expect(Number.isNaN(result![0])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// End-to-end 3-step scenario (test 17)
// ---------------------------------------------------------------------------

describe('end-to-end 3-step paired scenario', () => {
  it('test 17: Prep + Mix + Pack — correct Lead/Total/Wait times', () => {
    // Prep:  08:00 – 08:20  (20 min = 1_200_000 ms)
    // Mix:   08:20 – 08:50  (30 min = 1_800_000 ms)
    // Pack:  08:50 – 09:10  (20 min = 1_200_000 ms)
    // Lead_time = max(Pack_end) - min(Prep_start) = 09:10 - 08:00 = 70 min = 4_200_000 ms
    // Total_work_time = 1_200_000 + 1_800_000 + 1_200_000 = 4_200_000 ms
    // Wait_time = 4_200_000 - 4_200_000 = 0 ms  (no gaps/overlaps — sequential process)
    const row = {
      Prep_start: '2026-01-01T08:00:00Z',
      Prep_end: '2026-01-01T08:20:00Z',
      Mix_start: '2026-01-01T08:20:00Z',
      Mix_end: '2026-01-01T08:50:00Z',
      Pack_start: '2026-01-01T08:50:00Z',
      Pack_end: '2026-01-01T09:10:00Z',
    };

    const timings: StepTimingBinding[] = [
      { kind: 'paired', stepId: 'step-prep', startColumn: 'Prep_start', endColumn: 'Prep_end' },
      { kind: 'paired', stepId: 'step-mix', startColumn: 'Mix_start', endColumn: 'Mix_end' },
      { kind: 'paired', stepId: 'step-pack', startColumn: 'Pack_start', endColumn: 'Pack_end' },
    ];

    const lead = computeLeadTimeColumn([row], timings);
    const total = computeTotalWorkTimeColumn([row], timings);
    const wait = computeWaitTimeColumn([row], timings);

    expect(lead).not.toBeNull();
    expect(total).not.toBeNull();
    expect(wait).not.toBeNull();

    expect(lead![0]).toBe(4_200_000);
    expect(total![0]).toBe(4_200_000);
    expect(wait![0]).toBe(0);
  });
});
