import { describe, it, expect } from 'vitest';
import { FORMULA_TEMPLATES } from '../templates';
import type { TemplateContext, FormulaTemplate } from '../templates';
import type { BatchDataResult } from '../detectBatchData';
import type { FormulaBinding } from '../types';
import { computeFormulaColumn, evaluateFormulaRow } from '../evaluate';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fullBatchData: BatchDataResult = {
  inputColumns: ['Input_kg'],
  outputColumns: ['GradeA_kg', 'GradeB_kg'],
  scrapColumns: ['Scrap_kg'],
  isLikelyBatch: true,
};

const batchNoScrap: BatchDataResult = {
  inputColumns: ['Input_kg'],
  outputColumns: ['GradeA_kg', 'GradeB_kg'],
  scrapColumns: [],
  isLikelyBatch: true,
};

const batchCtx: TemplateContext = {
  batchData: fullBatchData,
  hasLeadTime: false,
  numericColumns: ['Input_kg', 'GradeA_kg', 'GradeB_kg', 'Scrap_kg'],
};

const emptyCtx: TemplateContext = {
  batchData: null,
  hasLeadTime: false,
  numericColumns: [],
};

function findTemplate(id: string): FormulaTemplate {
  const t = FORMULA_TEMPLATES.find(t => t.id === id);
  if (t === undefined) throw new Error(`Template '${id}' not found`);
  return t;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FORMULA_TEMPLATES registry', () => {
  it('1. registry has exactly 8 entries', () => {
    expect(FORMULA_TEMPLATES).toHaveLength(8);
  });

  it('2. registry IDs are in the correct order', () => {
    expect(FORMULA_TEMPLATES[0].id).toBe('batchRatio.totalYield');
    expect(FORMULA_TEMPLATES[1].id).toBe('batchRatio.gradeA');
    expect(FORMULA_TEMPLATES[2].id).toBe('batchRatio.scrap');
    expect(FORMULA_TEMPLATES[3].id).toBe('batchRatio.loss');
    expect(FORMULA_TEMPLATES[4].id).toBe('dpmo');
    expect(FORMULA_TEMPLATES[5].id).toBe('throughput');
    expect(FORMULA_TEMPLATES[6].id).toBe('difference');
    expect(FORMULA_TEMPLATES[7].id).toBe('custom');
  });

  // -------------------------------------------------------------------------
  // batchRatio.totalYield
  // -------------------------------------------------------------------------

  it('3. totalYield.isAvailable: false when batchData null; true when present', () => {
    const t = findTemplate('batchRatio.totalYield');
    expect(t.isAvailable(emptyCtx)).toBe(false);
    expect(t.isAvailable(batchCtx)).toBe(true);
  });

  it('4. totalYield.fillFromContext produces correct binding', () => {
    const t = findTemplate('batchRatio.totalYield');
    const binding = t.fillFromContext(batchCtx);

    expect(binding.numerator).toEqual([
      { kind: 'column', column: 'GradeA_kg', sign: '+' },
      { kind: 'column', column: 'GradeB_kg', sign: '+' },
    ]);
    expect(binding.denominator).toEqual([{ kind: 'column', column: 'Input_kg', sign: '+' }]);
    expect(binding.multiplier).toBe(100);
    expect(binding.name).toBe('Yield_pct');
    expect(binding.templateId).toBe('batchRatio.totalYield');
    expect(binding.family).toBe('batchRatio');
    expect(typeof binding.id).toBe('string');
    expect(binding.id.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // batchRatio.gradeA
  // -------------------------------------------------------------------------

  it('5. gradeA.fillFromContext with batchData: picks first output column', () => {
    const t = findTemplate('batchRatio.gradeA');
    const binding = t.fillFromContext(batchCtx);

    expect(binding.numerator).toEqual([{ kind: 'column', column: 'GradeA_kg', sign: '+' }]);
    expect(binding.denominator).toEqual([{ kind: 'column', column: 'Input_kg', sign: '+' }]);
    expect(binding.multiplier).toBe(100);
    expect(binding.name).toBe('GradeA_yield_pct');
    expect(binding.templateId).toBe('batchRatio.gradeA');
  });

  // -------------------------------------------------------------------------
  // batchRatio.scrap
  // -------------------------------------------------------------------------

  it('6. scrap.fillFromContext with scrapColumns populated → scrap numerator', () => {
    const t = findTemplate('batchRatio.scrap');
    const binding = t.fillFromContext(batchCtx);

    expect(binding.numerator).toEqual([{ kind: 'column', column: 'Scrap_kg', sign: '+' }]);
    expect(binding.denominator).toEqual([{ kind: 'column', column: 'Input_kg', sign: '+' }]);
    expect(binding.multiplier).toBe(100);
    expect(binding.name).toBe('Scrap_rate_pct');
  });

  it('7. scrap.isAvailable: false when scrapColumns empty; true when populated', () => {
    const t = findTemplate('batchRatio.scrap');
    const noScrapCtx: TemplateContext = { ...batchCtx, batchData: batchNoScrap };
    expect(t.isAvailable(noScrapCtx)).toBe(false);
    expect(t.isAvailable(batchCtx)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // batchRatio.loss
  // -------------------------------------------------------------------------

  it('8. loss.fillFromContext with two outputs → +input, -GradeA_kg, -GradeB_kg', () => {
    const t = findTemplate('batchRatio.loss');
    const binding = t.fillFromContext(batchCtx);

    expect(binding.numerator).toEqual([
      { kind: 'column', column: 'Input_kg', sign: '+' },
      { kind: 'column', column: 'GradeA_kg', sign: '-' },
      { kind: 'column', column: 'GradeB_kg', sign: '-' },
    ]);
    expect(binding.denominator).toEqual([{ kind: 'column', column: 'Input_kg', sign: '+' }]);
    expect(binding.multiplier).toBe(100);
    expect(binding.name).toBe('Loss_pct');
    expect(binding.templateId).toBe('batchRatio.loss');
  });

  // -------------------------------------------------------------------------
  // dpmo
  // -------------------------------------------------------------------------

  it('9. dpmo.fillFromContext with keyword-matched columns', () => {
    const t = findTemplate('dpmo');
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: false,
      numericColumns: ['Defects', 'Samples', 'Foo'],
    };
    const binding = t.fillFromContext(ctx);

    expect(binding.numerator).toEqual([{ kind: 'column', column: 'Defects', sign: '+' }]);
    expect(binding.denominator).toEqual([{ kind: 'column', column: 'Samples', sign: '+' }]);
    expect(binding.multiplier).toBe(1_000_000);
    expect(binding.name).toBe('DPMO');
    expect(binding.templateId).toBe('dpmo');
    expect(binding.family).toBe('dpmo');
  });

  it('10. dpmo.fillFromContext with no keyword match → first as numerator, second as denominator', () => {
    const t = findTemplate('dpmo');
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: false,
      numericColumns: ['X', 'Y'],
    };
    const binding = t.fillFromContext(ctx);

    expect(binding.numerator).toEqual([{ kind: 'column', column: 'X', sign: '+' }]);
    expect(binding.denominator).toEqual([{ kind: 'column', column: 'Y', sign: '+' }]);
    expect(binding.multiplier).toBe(1_000_000);
  });

  it('dpmo.isAvailable returns true regardless of context', () => {
    const t = findTemplate('dpmo');
    expect(t.isAvailable(emptyCtx)).toBe(true);
    expect(t.isAvailable(batchCtx)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // throughput
  // -------------------------------------------------------------------------

  it('11. throughput.isAvailable: false when no lead time; true when hasLeadTime', () => {
    const t = findTemplate('throughput');
    expect(t.isAvailable({ batchData: null, hasLeadTime: false, numericColumns: [] })).toBe(false);
    expect(
      t.isAvailable({ batchData: null, hasLeadTime: true, numericColumns: ['Count', 'Lead_time'] })
    ).toBe(true);
  });

  it('12. throughput.fillFromContext picks first non-Lead_time numeric', () => {
    const t = findTemplate('throughput');
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: true,
      numericColumns: ['Count', 'Lead_time'],
    };
    const binding = t.fillFromContext(ctx);

    expect(binding.numerator).toEqual([{ kind: 'column', column: 'Count', sign: '+' }]);
    expect(binding.denominator).toEqual([{ kind: 'column', column: 'Lead_time', sign: '+' }]);
    expect(binding.multiplier).toBe(3_600_000);
    expect(binding.name).toBe('Throughput_per_hour');
    expect(binding.templateId).toBe('throughput');
  });

  // -------------------------------------------------------------------------
  // difference
  // -------------------------------------------------------------------------

  it('13. difference.isAvailable: false with 1 column; true with 2+', () => {
    const t = findTemplate('difference');
    expect(t.isAvailable({ batchData: null, hasLeadTime: false, numericColumns: ['A'] })).toBe(
      false
    );
    expect(t.isAvailable({ batchData: null, hasLeadTime: false, numericColumns: ['A', 'B'] })).toBe(
      true
    );
  });

  it('14. difference.fillFromContext → {A,+} {B,-} with empty denominator', () => {
    const t = findTemplate('difference');
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: false,
      numericColumns: ['A', 'B'],
    };
    const binding = t.fillFromContext(ctx);

    expect(binding.numerator).toEqual([
      { kind: 'column', column: 'A', sign: '+' },
      { kind: 'column', column: 'B', sign: '-' },
    ]);
    expect(binding.denominator).toEqual([]);
    expect(binding.multiplier).toBe(1);
    expect(binding.name).toBe('Difference');
    expect(binding.templateId).toBe('difference');
  });

  // -------------------------------------------------------------------------
  // custom
  // -------------------------------------------------------------------------

  it('15. custom.isAvailable returns true for any context', () => {
    const t = findTemplate('custom');
    expect(t.isAvailable(emptyCtx)).toBe(true);
    expect(t.isAvailable(batchCtx)).toBe(true);
  });

  it('16. custom.fillFromContext → empty numerator + empty denominator + multiplier 1', () => {
    const t = findTemplate('custom');
    const binding = t.fillFromContext(emptyCtx);

    expect(binding.numerator).toEqual([]);
    expect(binding.denominator).toEqual([]);
    expect(binding.multiplier).toBe(1);
    expect(binding.name).toBe('Calculated');
    expect(binding.family).toBe('custom');
    expect(binding.templateId).toBe('custom');
  });
});

// ---------------------------------------------------------------------------
// Integration: template-generated bindings through evaluateFormulaRow /
// computeFormulaColumn. Tests verify the engine + registry compose correctly.
//
// NOTE on DPMO opportunities_per_unit semantics: the engine encodes
// opps_per_unit via multiplier inversion (multiplier = 1_000_000 / opps_per_unit)
// rather than via an additive constant in the denominator. This keeps the
// evaluator's "sum of signed terms" model intact while still expressing
// canonical DPMO = D / (S × O) × 1M. The Phase 2 modal UI surfaces opps_per_unit
// as an editable input that updates the binding's multiplier on save.
// ---------------------------------------------------------------------------

describe('template + evaluator integration', () => {
  // -------------------------------------------------------------------------
  // 1. DPMO end-to-end with default opportunities=1
  // -------------------------------------------------------------------------

  it('1. DPMO with default opportunities_per_unit=1 evaluates correctly', () => {
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: false,
      numericColumns: ['Defects', 'Samples'],
    };
    const dpmoTemplate = FORMULA_TEMPLATES.find(t => t.id === 'dpmo')!;
    const binding = dpmoTemplate.fillFromContext(ctx);

    // canonical DPMO with opps=1: 3 / 100 × 1_000_000 = 30000
    expect(evaluateFormulaRow({ Defects: 3, Samples: 100 }, binding, {}, 0)).toBe(30000);
  });

  // -------------------------------------------------------------------------
  // 2. DPMO end-to-end with custom opportunities multiplier (opp=5)
  // -------------------------------------------------------------------------

  it('2. DPMO evaluates correctly when opportunities_per_unit is set to 5 (multiplier inversion)', () => {
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: false,
      numericColumns: ['Defects', 'Samples'],
    };
    const dpmoTemplate = FORMULA_TEMPLATES.find(t => t.id === 'dpmo')!;
    const baseBinding = dpmoTemplate.fillFromContext(ctx);

    // Simulate Phase 2 UI: user edits opportunities_per_unit from 1 → 5.
    // UI updates multiplier from 1_000_000 → 200_000 (= 1_000_000 / 5).
    const editedBinding: FormulaBinding = {
      ...baseBinding,
      multiplier: 1_000_000 / 5,
    };

    // canonical DPMO with opps=5: 3 / (100 × 5) × 1_000_000 = 3 / 500 × 1M = 6000
    expect(evaluateFormulaRow({ Defects: 3, Samples: 100 }, editedBinding, {}, 0)).toBe(6000);

    // batch via computeFormulaColumn
    const result = computeFormulaColumn(
      [
        { Defects: 3, Samples: 100 },
        { Defects: 6, Samples: 200 },
      ],
      editedBinding,
      {}
    );
    // row 0: 3 / (100 × 5) × 1M = 6000
    // row 1: 6 / (200 × 5) × 1M = 6000
    expect(result).toEqual([6000, 6000]);
  });

  // -------------------------------------------------------------------------
  // 3. Throughput end-to-end via Lead_time augmented column
  // -------------------------------------------------------------------------

  it('3. throughput binding computes units/hour using Lead_time augmented column', () => {
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: true,
      numericColumns: ['Count', 'Lead_time'],
    };
    const throughputTemplate = FORMULA_TEMPLATES.find(t => t.id === 'throughput')!;
    const binding = throughputTemplate.fillFromContext(ctx);

    // 3600000 ms = 1 hour; Count=10 / 3600000 * 3600000 = 10
    // 7200000 ms = 2 hours; Count=20 / 7200000 * 3600000 = 10
    const result = computeFormulaColumn([{ Count: 10 }, { Count: 20 }], binding, {
      Lead_time: [3_600_000, 7_200_000],
    });
    expect(result).toEqual([10, 10]);
  });

  // -------------------------------------------------------------------------
  // 4. Difference template end-to-end
  // -------------------------------------------------------------------------

  it('4. difference template computes A - B correctly', () => {
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: false,
      numericColumns: ['Before', 'After'],
    };
    const diffTemplate = FORMULA_TEMPLATES.find(t => t.id === 'difference')!;
    const binding = diffTemplate.fillFromContext(ctx);

    expect(evaluateFormulaRow({ Before: 10, After: 3 }, binding, {}, 0)).toBe(7);
    expect(evaluateFormulaRow({ Before: 5, After: 8 }, binding, {}, 0)).toBe(-3);
  });

  // -------------------------------------------------------------------------
  // 5. Difference with sourceColumn override
  // -------------------------------------------------------------------------

  it('5. difference template uses sourceColumn as the positive term when provided', () => {
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: false,
      numericColumns: ['A', 'B', 'C'],
    };
    const diffTemplate = FORMULA_TEMPLATES.find(t => t.id === 'difference')!;
    const binding = diffTemplate.fillFromContext(ctx, 'B'); // user clicked from B's kebab menu

    // numerator[0] should be B with sign '+'; numerator[1] should be the first column != B
    expect(binding.numerator[0]).toEqual({ kind: 'column', column: 'B', sign: '+' });
    expect(binding.numerator[1]?.kind).toBe('column');
    expect((binding.numerator[1] as { sign: '+' | '-' }).sign).toBe('-');
  });

  // -------------------------------------------------------------------------
  // 6. Round-trip preservation (templateId + family survive JSON serialization)
  // -------------------------------------------------------------------------

  it('6. binding survives JSON serialize/deserialize round-trip', () => {
    const ctx: TemplateContext = {
      batchData: {
        inputColumns: ['Input_kg'],
        outputColumns: ['Out_kg'],
        scrapColumns: [],
        isLikelyBatch: true,
      },
      hasLeadTime: false,
      numericColumns: ['Input_kg', 'Out_kg'],
    };
    const template = FORMULA_TEMPLATES.find(t => t.id === 'batchRatio.totalYield')!;
    const original = template.fillFromContext(ctx);

    const restored: FormulaBinding = JSON.parse(JSON.stringify(original));

    expect(restored.id).toBe(original.id);
    expect(restored.templateId).toBe('batchRatio.totalYield');
    expect(restored.family).toBe('batchRatio');
    expect(restored.numerator).toEqual(original.numerator);
    expect(restored.denominator).toEqual(original.denominator);
    expect(restored.multiplier).toBe(original.multiplier);
    expect(restored.name).toBe(original.name);

    // Restored binding still evaluates correctly: 85/100 * 100 = 85
    expect(evaluateFormulaRow({ Input_kg: 100, Out_kg: 85 }, restored, {}, 0)).toBe(85);
  });

  // -------------------------------------------------------------------------
  // 7. fillFromContext edge case — no keyword match falls back gracefully
  // -------------------------------------------------------------------------

  it('7. DPMO falls back to numericColumns[0] + [1] when no defect/sample keyword matches', () => {
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: false,
      numericColumns: ['X', 'Y', 'Z'],
    };
    const dpmoTemplate = FORMULA_TEMPLATES.find(t => t.id === 'dpmo')!;
    const binding = dpmoTemplate.fillFromContext(ctx);

    // No 'defect' or 'sample' keyword match — defaults to first two numeric columns
    expect((binding.numerator[0] as { column: string }).column).toBe('X');
    expect((binding.denominator[0] as { column: string }).column).toBe('Y');
  });

  // -------------------------------------------------------------------------
  // 8. Throughput picks first non-Lead_time numeric
  // -------------------------------------------------------------------------

  it('8. throughput picks the first non-Lead_time numeric column as the source', () => {
    const ctx: TemplateContext = {
      batchData: null,
      hasLeadTime: true,
      numericColumns: ['Lead_time', 'Count', 'Total_work_time'],
    };
    const throughputTemplate = FORMULA_TEMPLATES.find(t => t.id === 'throughput')!;
    const binding = throughputTemplate.fillFromContext(ctx);

    expect((binding.numerator[0] as { column: string }).column).toBe('Count');
    expect((binding.denominator[0] as { column: string }).column).toBe('Lead_time');
  });
});
