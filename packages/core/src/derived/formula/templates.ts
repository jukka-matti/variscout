import type { FormulaBinding, FormulaFamily } from './types';
import type { BatchDataResult } from './detectBatchData';

/**
 * Context passed to each template's `isAvailable` and `fillFromContext` methods.
 * Derived from the canvas palette state at the point when the user opens
 * the "Add calculated column" panel.
 */
export interface TemplateContext {
  /** Result of `detectBatchData`, or `null` when no batch pattern is present. */
  batchData: BatchDataResult | null;
  /** True when a `Lead_time` column exists in the palette (from D1 derivation or raw data). */
  hasLeadTime: boolean;
  /** All numeric column names visible in the palette (raw + augmented e.g. `Lead_time`). */
  numericColumns: string[];
}

/**
 * A pre-built formula shape the user can select from the template picker.
 *
 * `isAvailable` gates display; `fillFromContext` produces the initial
 * `FormulaBinding` the user can further edit in the formula builder UI.
 */
export interface FormulaTemplate {
  /** Stable dot-notation id, e.g. `'batchRatio.totalYield'`, `'dpmo'`. */
  id: string;
  /** Formula family — drives the colour/icon group in the UI. */
  family: FormulaFamily;
  /** Short user-visible card title, e.g. `'Total yield %'`. */
  label: string;
  /** One-sentence description shown on the template card. */
  description: string;
  /** Default `name` for the produced `FormulaBinding` (user-editable column name). */
  defaultName: string;
  /** Returns true when this template should be offered given the current canvas context. */
  isAvailable: (ctx: TemplateContext) => boolean;
  /**
   * Constructs an initial `FormulaBinding` from context.
   * `sourceColumn` is the column the user right-clicked or last selected, if any.
   */
  fillFromContext: (ctx: TemplateContext, sourceColumn?: string) => FormulaBinding;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Column term with positive sign. */
function colPlus(column: string) {
  return { kind: 'column' as const, column, sign: '+' as const };
}

/** Column term with negative sign. */
function colMinus(column: string) {
  return { kind: 'column' as const, column, sign: '-' as const };
}

/** Build a base FormulaBinding skeleton. */
function makeBinding(
  overrides: Partial<FormulaBinding> & {
    name: string;
    family: FormulaFamily;
    templateId: string;
  }
): FormulaBinding {
  return {
    id: crypto.randomUUID(),
    numerator: [],
    denominator: [],
    multiplier: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const totalYield: FormulaTemplate = {
  id: 'batchRatio.totalYield',
  family: 'batchRatio',
  label: 'Total yield %',
  description: 'Sum of all output streams divided by input, expressed as a percentage.',
  defaultName: 'Yield_pct',
  isAvailable: ctx => ctx.batchData !== null,
  fillFromContext: ctx => {
    const bd = ctx.batchData!;
    return makeBinding({
      name: 'Yield_pct',
      family: 'batchRatio',
      templateId: 'batchRatio.totalYield',
      numerator: bd.outputColumns.map(colPlus),
      denominator: [colPlus(bd.inputColumns[0])],
      multiplier: 100,
    });
  },
};

const gradeA: FormulaTemplate = {
  id: 'batchRatio.gradeA',
  family: 'batchRatio',
  label: 'Grade A yield %',
  description: 'First output stream divided by input, expressed as a percentage.',
  defaultName: 'GradeA_yield_pct',
  isAvailable: ctx => (ctx.batchData?.outputColumns.length ?? 0) >= 1,
  fillFromContext: ctx => {
    const bd = ctx.batchData!;
    return makeBinding({
      name: 'GradeA_yield_pct',
      family: 'batchRatio',
      templateId: 'batchRatio.gradeA',
      numerator: [colPlus(bd.outputColumns[0])],
      denominator: [colPlus(bd.inputColumns[0])],
      multiplier: 100,
    });
  },
};

const scrapRate: FormulaTemplate = {
  id: 'batchRatio.scrap',
  family: 'batchRatio',
  label: 'Scrap rate %',
  description: 'Sum of scrap streams divided by input, expressed as a percentage.',
  defaultName: 'Scrap_rate_pct',
  isAvailable: ctx => (ctx.batchData?.scrapColumns.length ?? 0) >= 1,
  fillFromContext: ctx => {
    const bd = ctx.batchData!;
    return makeBinding({
      name: 'Scrap_rate_pct',
      family: 'batchRatio',
      templateId: 'batchRatio.scrap',
      numerator: bd.scrapColumns.map(colPlus),
      denominator: [colPlus(bd.inputColumns[0])],
      multiplier: 100,
    });
  },
};

const lossPct: FormulaTemplate = {
  id: 'batchRatio.loss',
  family: 'batchRatio',
  label: 'Loss %',
  description: 'Unaccounted loss as a percentage of input: (input − sum of outputs) / input × 100.',
  defaultName: 'Loss_pct',
  isAvailable: ctx => ctx.batchData !== null,
  fillFromContext: ctx => {
    const bd = ctx.batchData!;
    // Numerator: +input, then −each output
    const numerator = [colPlus(bd.inputColumns[0]), ...bd.outputColumns.map(colMinus)];
    return makeBinding({
      name: 'Loss_pct',
      family: 'batchRatio',
      templateId: 'batchRatio.loss',
      numerator,
      denominator: [colPlus(bd.inputColumns[0])],
      multiplier: 100,
    });
  },
};

const dpmo: FormulaTemplate = {
  id: 'dpmo',
  family: 'dpmo',
  label: 'DPMO',
  description:
    'Defects per million opportunities = defects / (samples × opportunities_per_unit) × 1,000,000.',
  defaultName: 'DPMO',
  isAvailable: () => true,
  fillFromContext: (ctx, sourceColumn) => {
    const cols = ctx.numericColumns;

    // Find defect column by keyword
    const defectCol = cols.find(c => /defect/i.test(c));
    // Find sample/unit/count column by keyword
    const sampleCol = cols.find(c => /sample|unit|count/i.test(c));

    let numeratorCol: string;
    let denominatorCol: string;

    if (defectCol !== undefined) {
      numeratorCol = defectCol;
      // Prefer sampleCol if found and different from defectCol; else fall back to sourceColumn or cols[1]
      if (sampleCol !== undefined && sampleCol !== defectCol) {
        denominatorCol = sampleCol;
      } else {
        denominatorCol = sourceColumn ?? cols[1] ?? cols[0];
      }
    } else {
      // No keyword match — use sourceColumn or first numeric as numerator
      numeratorCol = sourceColumn ?? cols[0];
      // Use second numeric as denominator column, falling back to first
      denominatorCol = cols[1] ?? cols[0];
    }

    // DPMO = (Defects / Samples) × (1,000,000 / opportunities_per_unit).
    // We encode opportunities_per_unit via multiplier inversion in the UI layer
    // (Phase 2): default opps_per_unit = 1 → multiplier = 1_000_000; user edits
    // opps_per_unit = N → multiplier = 1_000_000 / N. Keeps the engine's "sum of
    // signed terms" model intact (no multiplicative term kind needed).
    return makeBinding({
      name: 'DPMO',
      family: 'dpmo',
      templateId: 'dpmo',
      numerator: [colPlus(numeratorCol)],
      denominator: [colPlus(denominatorCol)],
      multiplier: 1_000_000,
    });
  },
};

const throughput: FormulaTemplate = {
  id: 'throughput',
  family: 'throughput',
  label: 'Throughput per hour',
  description: 'Source quantity divided by lead time, scaled to units per hour.',
  defaultName: 'Throughput_per_hour',
  isAvailable: ctx => ctx.hasLeadTime,
  fillFromContext: (ctx, sourceColumn) => {
    // Pick the numerator: sourceColumn if provided and not Lead_time; else first non-Lead_time numeric
    const nonLeadCols = ctx.numericColumns.filter(c => c !== 'Lead_time');
    const numeratorCol =
      sourceColumn && sourceColumn !== 'Lead_time'
        ? sourceColumn
        : (nonLeadCols[0] ?? ctx.numericColumns[0]);

    return makeBinding({
      name: 'Throughput_per_hour',
      family: 'throughput',
      templateId: 'throughput',
      numerator: [colPlus(numeratorCol)],
      denominator: [colPlus('Lead_time')],
      multiplier: 3_600_000,
    });
  },
};

const difference: FormulaTemplate = {
  id: 'difference',
  family: 'difference',
  label: 'Difference',
  description: 'Subtract one numeric column from another.',
  defaultName: 'Difference',
  isAvailable: ctx => ctx.numericColumns.length >= 2,
  fillFromContext: (ctx, sourceColumn) => {
    const first = sourceColumn ?? ctx.numericColumns[0];
    const second = ctx.numericColumns.find(c => c !== first) ?? ctx.numericColumns[1];
    return makeBinding({
      name: 'Difference',
      family: 'difference',
      templateId: 'difference',
      numerator: [colPlus(first), colMinus(second)],
      denominator: [],
      multiplier: 1,
    });
  },
};

const custom: FormulaTemplate = {
  id: 'custom',
  family: 'custom',
  label: 'Custom formula',
  description: 'Start with an empty formula and build any expression you need.',
  defaultName: 'Calculated',
  isAvailable: () => true,
  fillFromContext: () => {
    return makeBinding({
      name: 'Calculated',
      family: 'custom',
      templateId: 'custom',
      numerator: [],
      denominator: [],
      multiplier: 1,
    });
  },
};

// ---------------------------------------------------------------------------
// Registry (order matters — drives UI rendering)
// ---------------------------------------------------------------------------

export const FORMULA_TEMPLATES: ReadonlyArray<FormulaTemplate> = [
  totalYield, // 0 — batchRatio.totalYield
  gradeA, // 1 — batchRatio.gradeA
  scrapRate, // 2 — batchRatio.scrap
  lossPct, // 3 — batchRatio.loss
  dpmo, // 4 — dpmo
  throughput, // 5 — throughput
  difference, // 6 — difference
  custom, // 7 — custom
];
