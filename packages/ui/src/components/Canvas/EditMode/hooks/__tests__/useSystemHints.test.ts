import { describe, it, expect } from 'vitest';
import { useSystemHints } from '../useSystemHints';
import type { UseSystemHintsInput } from '../useSystemHints';
import type { TimeDecompositionBinding } from '@variscout/core';
import type { ColumnParsingProfile } from '@variscout/core/parser';

// Minimal ColumnParsingProfile factory for test use.
// status:'ok' is required so detectTimeColumns includes the profile.
function makeProfile(
  columnName: string,
  kind: 'numeric' | 'date' | 'categorical' | 'id' | 'text'
): ColumnParsingProfile {
  return {
    columnName,
    status: 'ok',
    confidence: 100,
    primary: { kind, label: kind, detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}

// Mass-shaped profiles that satisfy detectBatchData:
//   Input_kg => inputColumns, GradeA_kg => outputColumns (via "grade" keyword)
const batchProfiles = [makeProfile('Input_kg', 'numeric'), makeProfile('GradeA_kg', 'numeric')];

describe('useSystemHints', () => {
  // 1. No profiles → no hints
  it('returns [] when columnProfiles is empty', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [],
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
    };
    expect(useSystemHints(input)).toEqual([]);
  });

  // 2. Batch detection via detectBatchData (input+output mass columns)
  it('emits batch-detected when profiles satisfy detectBatchData (Input_kg + GradeA_kg)', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: batchProfiles,
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
    };
    const hints = useSystemHints(input);
    const batchHint = hints.find(h => h.id === 'batch-detected');
    expect(batchHint).toBeDefined();
    expect(batchHint?.kind).toBe('batch');
    expect(batchHint?.message).toContain('Batch data detected');
  });

  // 3. Batch hint CTA label when onOpenCalc is provided
  it('batch hint CTA label is "Calculate yield ratios →" when onOpenCalc is provided', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: batchProfiles,
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
      onOpenCalc: () => {},
    };
    const hints = useSystemHints(input);
    const batchHint = hints.find(h => h.id === 'batch-detected');
    expect(batchHint?.ctaLabel).toBe('Calculate yield ratios →');
    expect(batchHint?.onCta).toBeDefined();
  });

  // 4. No ctaLabel when onOpenCalc is undefined
  it('batch hint has no ctaLabel when onOpenCalc is undefined', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: batchProfiles,
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
      onOpenCalc: undefined,
    };
    const hints = useSystemHints(input);
    const batchHint = hints.find(h => h.id === 'batch-detected');
    expect(batchHint?.ctaLabel).toBeUndefined();
    expect(batchHint?.onCta).toBeUndefined();
  });

  // 5. No batch hint when profiles don't satisfy detectBatchData (no input/output pair)
  it('does not emit batch-detected when profiles lack input/output mass columns', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [makeProfile('Value', 'numeric'), makeProfile('Machine', 'categorical')],
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
    };
    const hints = useSystemHints(input);
    expect(hints.find(h => h.id === 'batch-detected')).toBeUndefined();
  });

  // 6. Time hint: 1 date column, no bindings → singular wording
  it('emits time-detected with "1 time column detected" (singular) for 1 date profile', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [makeProfile('Order_Date', 'date'), makeProfile('Qty', 'numeric')],
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
    };
    const hints = useSystemHints(input);
    const timeHint = hints.find(h => h.id === 'time-detected');
    expect(timeHint).toBeDefined();
    expect(timeHint?.kind).toBe('time');
    expect(timeHint?.message).toContain('1 time column detected');
    expect(timeHint?.message).not.toContain('1 time columns detected');
  });

  // 7. Time hint: 2 date columns, no bindings → plural wording
  it('emits time-detected with "2 time columns detected" (plural) for 2 date profiles', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [makeProfile('Order_Date', 'date'), makeProfile('Ship_Date', 'date')],
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
    };
    const hints = useSystemHints(input);
    const timeHint = hints.find(h => h.id === 'time-detected');
    expect(timeHint).toBeDefined();
    expect(timeHint?.message).toContain('2 time columns detected');
  });

  // 8. Time hint still emits when only SOME columns are decomposed
  it('still emits time-detected when only some detected date columns have a binding', () => {
    const binding: TimeDecompositionBinding = {
      id: 'tdb-1',
      sourceColumn: 'Order_Date',
      dimensions: ['year'],
    };
    const input: UseSystemHintsInput = {
      columnProfiles: [makeProfile('Order_Date', 'date'), makeProfile('Ship_Date', 'date')],
      dismissedHints: new Set(),
      timeDecompositionBindings: [binding],
    };
    const hints = useSystemHints(input);
    // Ship_Date still has no binding → hint should remain
    expect(hints.find(h => h.id === 'time-detected')).toBeDefined();
  });

  // 9. Time hint suppressed when ALL date columns are decomposed
  it('suppresses time-detected when every detected date column has a binding', () => {
    const binding1: TimeDecompositionBinding = {
      id: 'tdb-1',
      sourceColumn: 'Order_Date',
      dimensions: ['year'],
    };
    const binding2: TimeDecompositionBinding = {
      id: 'tdb-2',
      sourceColumn: 'Ship_Date',
      dimensions: ['month'],
    };
    const input: UseSystemHintsInput = {
      columnProfiles: [makeProfile('Order_Date', 'date'), makeProfile('Ship_Date', 'date')],
      dismissedHints: new Set(),
      timeDecompositionBindings: [binding1, binding2],
    };
    const hints = useSystemHints(input);
    expect(hints.find(h => h.id === 'time-detected')).toBeUndefined();
  });

  // 10. dismissedHints suppresses batch even when condition is met
  it('suppresses batch-detected when it is in dismissedHints', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: batchProfiles,
      dismissedHints: new Set(['batch-detected']),
      timeDecompositionBindings: [],
    };
    const hints = useSystemHints(input);
    expect(hints.find(h => h.id === 'batch-detected')).toBeUndefined();
  });

  // 11. dismissedHints suppresses time
  it('suppresses time-detected when it is in dismissedHints', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(['time-detected']),
      timeDecompositionBindings: [],
    };
    const hints = useSystemHints(input);
    expect(hints.find(h => h.id === 'time-detected')).toBeUndefined();
  });

  // 12. batch suppressed → time still emits
  it('suppresses batch-detected but still emits time-detected when batch is dismissed', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [...batchProfiles, makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(['batch-detected']),
      timeDecompositionBindings: [],
    };
    const hints = useSystemHints(input);
    expect(hints.find(h => h.id === 'batch-detected')).toBeUndefined();
    expect(hints.find(h => h.id === 'time-detected')).toBeDefined();
  });

  // 13. Both conditions met → [batch, time] in that order
  it('returns [batch, time] in stable order when both conditions are met', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [...batchProfiles, makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
    };
    const hints = useSystemHints(input);
    expect(hints).toHaveLength(2);
    expect(hints[0].id).toBe('batch-detected');
    expect(hints[1].id).toBe('time-detected');
  });

  // 14. hints emit without ctaLabel/onCta when callback props are undefined
  it('hints emit without ctaLabel/onCta when callbacks are undefined', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [...batchProfiles, makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
      onOpenCalc: undefined,
      onOpenTimeAsFactors: undefined,
    };
    const hints = useSystemHints(input);
    expect(hints).toHaveLength(2);
    expect(hints[0].ctaLabel).toBeUndefined();
    expect(hints[0].onCta).toBeUndefined();
    expect(hints[1].ctaLabel).toBeUndefined();
    expect(hints[1].onCta).toBeUndefined();
  });

  // 15. Time CTA label when onOpenTimeAsFactors is provided
  it('time hint CTA label is "Use time as factors" when onOpenTimeAsFactors is provided', () => {
    const input: UseSystemHintsInput = {
      columnProfiles: [makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(),
      timeDecompositionBindings: [],
      onOpenTimeAsFactors: () => {},
    };
    const hints = useSystemHints(input);
    const timeHint = hints.find(h => h.id === 'time-detected');
    expect(timeHint?.ctaLabel).toBe('Use time as factors');
    expect(timeHint?.onCta).toBeDefined();
  });
});
