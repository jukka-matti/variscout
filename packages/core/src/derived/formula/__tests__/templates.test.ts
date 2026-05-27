import { describe, it, expect } from 'vitest';
import { FORMULA_TEMPLATES } from '../templates';
import type { TemplateContext, FormulaTemplate } from '../templates';
import type { BatchDataResult } from '../detectBatchData';

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
    expect(binding.denominator).toEqual([
      { kind: 'column', column: 'Samples', sign: '+' },
      { kind: 'constant', value: 1 },
    ]);
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
    expect(binding.denominator).toEqual([
      { kind: 'column', column: 'Y', sign: '+' },
      { kind: 'constant', value: 1 },
    ]);
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
