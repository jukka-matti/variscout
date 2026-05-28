import { describe, it, expect } from 'vitest';
import { useSystemHints } from '../useSystemHints';
import type { UseSystemHintsInput } from '../useSystemHints';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { FormulaBinding } from '@variscout/core';
import type { TimeDecompositionBinding } from '@variscout/core';
import type { ColumnParsingProfile } from '@variscout/core/parser';

// Minimal ColumnParsingProfile factory for test use
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

// Minimal ImprovementProject for test use — only the fields useSystemHints reads.
// Using 'as ImprovementProject' to bypass the full required-field surface; tests
// only exercise formulaBindings + timeDecompositionBindings code paths.
function makeIP(
  overrides: Partial<
    Pick<ImprovementProject, 'formulaBindings' | 'timeDecompositionBindings'>
  > = {}
): ImprovementProject {
  return {
    id: 'test-ip',
    hubId: 'hub-1',
    status: 'active',
    metadata: { title: 'Test IP' },
    goal: { outcomeGoals: [] },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: 0,
    deletedAt: null,
    updatedAt: 0,
    ...overrides,
  } as ImprovementProject;
}

describe('useSystemHints', () => {
  it('returns [] when activeIP is undefined', () => {
    const input: UseSystemHintsInput = {
      activeIP: undefined,
      columnProfiles: [makeProfile('Date', 'date')],
      dismissedHints: new Set(),
    };
    expect(useSystemHints(input)).toEqual([]);
  });

  it('emits batch-detected when IP has formulaBindings', () => {
    const binding: FormulaBinding = {
      id: 'fb-1',
      name: 'Yield_pct',
      numerator: [{ kind: 'column', column: 'GradeA_kg', sign: '+' }],
      denominator: [{ kind: 'column', column: 'Input_kg', sign: '+' }],
      multiplier: 100,
    };
    const ip = makeIP({ formulaBindings: [binding] });
    const input: UseSystemHintsInput = {
      activeIP: ip,
      columnProfiles: [makeProfile('GradeA_kg', 'numeric')],
      dismissedHints: new Set(),
    };
    const hints = useSystemHints(input);
    expect(hints).toHaveLength(1);
    expect(hints[0].id).toBe('batch-detected');
    expect(hints[0].kind).toBe('batch');
  });

  it('emits batch-detected via _kg heuristic when 2+ columns end in _kg', () => {
    const ip = makeIP(); // no formulaBindings
    const input: UseSystemHintsInput = {
      activeIP: ip,
      columnProfiles: [
        makeProfile('Input_kg', 'numeric'),
        makeProfile('GradeA_kg', 'numeric'),
        makeProfile('Qty', 'numeric'),
      ],
      dismissedHints: new Set(),
    };
    const hints = useSystemHints(input);
    const batchHint = hints.find(h => h.id === 'batch-detected');
    expect(batchHint).toBeDefined();
    expect(batchHint?.kind).toBe('batch');
  });

  it('emits time-column-detected when profile has date kind and no decomposition bindings', () => {
    const ip = makeIP({ timeDecompositionBindings: [] });
    const input: UseSystemHintsInput = {
      activeIP: ip,
      columnProfiles: [makeProfile('Order_Date', 'date'), makeProfile('Qty', 'numeric')],
      dismissedHints: new Set(),
    };
    const hints = useSystemHints(input);
    const timeHint = hints.find(h => h.id === 'time-column-detected');
    expect(timeHint).toBeDefined();
    expect(timeHint?.kind).toBe('time');
  });

  it('suppresses time-column-detected when IP already has timeDecompositionBindings', () => {
    const decompositionBinding: TimeDecompositionBinding = {
      id: 'tdb-1',
      sourceColumn: 'Order_Date',
      dimensions: ['year'],
    };
    const ip = makeIP({ timeDecompositionBindings: [decompositionBinding] });
    const input: UseSystemHintsInput = {
      activeIP: ip,
      columnProfiles: [makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(),
    };
    const hints = useSystemHints(input);
    expect(hints.find(h => h.id === 'time-column-detected')).toBeUndefined();
  });

  it('suppresses batch-detected when it is in dismissedHints; time hint still emits', () => {
    const binding: FormulaBinding = {
      id: 'fb-1',
      name: 'Yield_pct',
      numerator: [{ kind: 'column', column: 'GradeA_kg', sign: '+' }],
      denominator: [{ kind: 'column', column: 'Input_kg', sign: '+' }],
      multiplier: 100,
    };
    const ip = makeIP({ formulaBindings: [binding] });
    const input: UseSystemHintsInput = {
      activeIP: ip,
      columnProfiles: [makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(['batch-detected']),
    };
    const hints = useSystemHints(input);
    expect(hints.find(h => h.id === 'batch-detected')).toBeUndefined();
    expect(hints.find(h => h.id === 'time-column-detected')).toBeDefined();
  });

  it('returns [batch, time] in that order when both conditions are met', () => {
    const binding: FormulaBinding = {
      id: 'fb-1',
      name: 'Yield_pct',
      numerator: [{ kind: 'column', column: 'GradeA_kg', sign: '+' }],
      denominator: [{ kind: 'column', column: 'Input_kg', sign: '+' }],
      multiplier: 100,
    };
    const ip = makeIP({ formulaBindings: [binding] });
    const input: UseSystemHintsInput = {
      activeIP: ip,
      columnProfiles: [makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(),
    };
    const hints = useSystemHints(input);
    expect(hints).toHaveLength(2);
    expect(hints[0].id).toBe('batch-detected');
    expect(hints[1].id).toBe('time-column-detected');
  });

  it('hints emit without ctaLabel/onCta when callback props are undefined', () => {
    const binding: FormulaBinding = {
      id: 'fb-1',
      name: 'Yield_pct',
      numerator: [{ kind: 'column', column: 'GradeA_kg', sign: '+' }],
      denominator: [{ kind: 'column', column: 'Input_kg', sign: '+' }],
      multiplier: 100,
    };
    const ip = makeIP({ formulaBindings: [binding] });
    const input: UseSystemHintsInput = {
      activeIP: ip,
      columnProfiles: [makeProfile('Order_Date', 'date')],
      dismissedHints: new Set(),
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
});
