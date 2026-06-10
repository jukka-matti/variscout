import { calculateStats } from '../stats/basic';
import { safeDivide } from '../stats/safeMath';
import { parseTimeValue } from '../time';
import type { DataRow, SpecLimits } from '../types';
import { toNumericValue } from '../types';
import { applyWindow } from '../timeline/applyWindow';

const MIN_LIVE_BEFORE_N = 2;

export interface CategoryCount {
  category: string;
  count: number;
}

export interface ControlBaseline {
  capturedAt: number;
  window: { startISO: string; endISO: string };
  measure: string;
  n: number;
  mean: number;
  sigma: number;
  cpk?: number;
  specsSnapshot?: { usl?: number; lsl?: number; target?: number };
  defectBreakdown?: CategoryCount[];
}

export interface PhaseLimits {
  window: { startISO: string; endISO: string };
  n: number;
  centerLine: number;
  ucl: number;
  lcl: number;
}

export interface SustainmentComparison {
  before: { source: 'live' | 'frozen'; n: number; mean: number; sigma: number; cpk?: number };
  after: { n: number; mean: number; sigma: number; cpk?: number } | null;
  phases?: { beforeLimits?: PhaseLimits; afterLimits?: PhaseLimits };
  deltas: { meanPct?: number; sigmaPct?: number; cpkDelta?: number };
  defects?: { before: CategoryCount[]; after: CategoryCount[] };
}

export interface SustainmentComparisonInput {
  rows: DataRow[];
  timeColumn: string | null;
  improvementDate: string;
  baseline: ControlBaseline;
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>;
  defectCategoryColumn?: string;
}

type StatsSummary = { n: number; mean: number; sigma: number; cpk?: number };
type ComparisonSpecs = Pick<SpecLimits, 'usl' | 'lsl'> | undefined;

export interface FreezeBaselineInput {
  rows: DataRow[];
  timeColumn: string;
  improvementDate: string;
  measure: string;
  specs?: Pick<SpecLimits, 'usl' | 'lsl' | 'target'>;
  defectCategoryColumn?: string;
  capturedAt?: number;
}

export function computeSustainmentComparison(
  input: SustainmentComparisonInput
): SustainmentComparison {
  const comparisonSpecs = comparisonSpecsFor(input.baseline, input.specs);
  const hasSpecs = hasCpkSpecs(comparisonSpecs);

  if (!input.timeColumn) {
    const afterRows = rowsWithNumericMeasure(input.rows, input.baseline.measure);
    const after =
      afterRows.length > 0
        ? statsSummary(afterRows, input.baseline.measure, comparisonSpecs)
        : null;
    const before = baselineSummary(input.baseline, hasSpecs);
    return {
      before,
      after,
      deltas: deltas(before, after, canCompareCpk(before, input.baseline)),
      defects: defectsForRows(
        undefined,
        input.rows,
        input.defectCategoryColumn,
        input.baseline.defectBreakdown
      ),
    };
  }

  const windows = splitByImprovementDate(input.rows, input.timeColumn, input.improvementDate);
  const beforeRows = sortRowsByTimeColumn(
    rowsWithNumericMeasure(windows.before, input.baseline.measure),
    input.timeColumn
  );
  const afterRows = sortRowsByTimeColumn(
    rowsWithNumericMeasure(windows.after, input.baseline.measure),
    input.timeColumn
  );
  const liveBefore =
    beforeRows.length >= MIN_LIVE_BEFORE_N
      ? statsSummary(beforeRows, input.baseline.measure, comparisonSpecs)
      : undefined;
  const before = liveBefore
    ? { source: 'live' as const, ...liveBefore }
    : baselineSummary(input.baseline, hasSpecs);
  const after =
    afterRows.length > 0 ? statsSummary(afterRows, input.baseline.measure, comparisonSpecs) : null;
  const phases = {
    beforeLimits: liveBefore
      ? phaseLimits(beforeRows, input.timeColumn, input.baseline.measure, comparisonSpecs)
      : undefined,
    afterLimits:
      afterRows.length > 0
        ? phaseLimits(afterRows, input.timeColumn, input.baseline.measure, comparisonSpecs)
        : undefined,
  };

  return {
    before,
    after,
    phases,
    deltas: deltas(before, after, canCompareCpk(before, input.baseline)),
    defects: defectsForRows(
      before.source === 'frozen' ? undefined : windows.before,
      windows.after,
      input.defectCategoryColumn,
      before.source === 'frozen' ? input.baseline.defectBreakdown : undefined
    ),
  };
}

export function freezeBaseline(
  inputOrRows: FreezeBaselineInput | DataRow[],
  timeColumn?: string,
  improvementDate?: string,
  measure?: string,
  specs?: Pick<SpecLimits, 'usl' | 'lsl' | 'target'>,
  defectCategoryColumn?: string,
  capturedAt?: number
): ControlBaseline {
  const input: FreezeBaselineInput = Array.isArray(inputOrRows)
    ? {
        rows: inputOrRows,
        timeColumn: timeColumn ?? '',
        improvementDate: improvementDate ?? '',
        measure: measure ?? '',
        specs,
        defectCategoryColumn,
        capturedAt,
      }
    : inputOrRows;

  const beforeRows = sortRowsByTimeColumn(
    rowsWithNumericMeasure(
      splitByImprovementDate(input.rows, input.timeColumn, input.improvementDate).before,
      input.measure
    ),
    input.timeColumn
  );
  if (beforeRows.length === 0) {
    throw new Error(
      `Cannot freeze baseline without valid pre-improvement rows for measure "${input.measure}".`
    );
  }
  const stats = calculateStats(
    valuesForMeasure(beforeRows, input.measure),
    input.specs?.usl,
    input.specs?.lsl
  );
  const hasSpecs = input.specs?.usl !== undefined || input.specs?.lsl !== undefined;
  const window = windowRange(beforeRows, input.timeColumn) ?? {
    startISO: input.improvementDate,
    endISO: input.improvementDate,
  };

  return {
    capturedAt: input.capturedAt ?? Date.now(),
    window,
    measure: input.measure,
    n: beforeRows.length,
    mean: stats.mean,
    sigma: stats.sigmaWithin,
    ...(hasSpecs && stats.cpk !== undefined ? { cpk: stats.cpk } : {}),
    ...(input.specs ? { specsSnapshot: { ...input.specs } } : {}),
    ...(input.defectCategoryColumn
      ? { defectBreakdown: categoryCounts(beforeRows, input.defectCategoryColumn) }
      : {}),
  };
}

function splitByImprovementDate(rows: DataRow[], timeColumn: string, improvementDate: string) {
  const improvementMs = Date.parse(improvementDate);
  const ranges = windowRange(rows, timeColumn);
  if (!Number.isFinite(improvementMs) || !ranges) {
    return { before: [] as DataRow[], after: [] as DataRow[] };
  }

  const beforeEnd = new Date(improvementMs - 1).toISOString();
  const before =
    Date.parse(ranges.startISO) <= Date.parse(beforeEnd)
      ? applyWindow(rows, timeColumn, {
          kind: 'fixed',
          startISO: ranges.startISO,
          endISO: beforeEnd,
        })
      : [];
  const after = applyWindow(rows, timeColumn, {
    kind: 'fixed',
    startISO: new Date(improvementMs).toISOString(),
    endISO: ranges.endISO,
  });

  return { before, after };
}

function baselineSummary(
  baseline: ControlBaseline,
  hasSpecs: boolean
): SustainmentComparison['before'] {
  return {
    source: 'frozen',
    n: baseline.n,
    mean: baseline.mean,
    sigma: baseline.sigma,
    ...(hasSpecs && baseline.cpk !== undefined ? { cpk: baseline.cpk } : {}),
  };
}

function statsSummary(rows: DataRow[], measure: string, specs?: ComparisonSpecs): StatsSummary {
  const stats = calculateStats(valuesForMeasure(rows, measure), specs?.usl, specs?.lsl);
  const hasSpecs = hasCpkSpecs(specs);
  return {
    n: rows.length,
    mean: stats.mean,
    sigma: stats.sigmaWithin,
    ...(hasSpecs && stats.cpk !== undefined ? { cpk: stats.cpk } : {}),
  };
}

function phaseLimits(
  rows: DataRow[],
  timeColumn: string,
  measure: string,
  specs?: ComparisonSpecs
): PhaseLimits | undefined {
  const window = windowRange(rows, timeColumn);
  if (!window) return undefined;
  const stats = calculateStats(valuesForMeasure(rows, measure), specs?.usl, specs?.lsl);
  return {
    window,
    n: rows.length,
    centerLine: stats.mean,
    ucl: stats.ucl,
    lcl: stats.lcl,
  };
}

function deltas(
  before: SustainmentComparison['before'],
  after: SustainmentComparison['after'],
  allowCpkDelta = true
): SustainmentComparison['deltas'] {
  if (!after) return {};
  return {
    meanPct: safeDivide(after.mean - before.mean, Math.abs(before.mean)),
    sigmaPct: safeDivide(after.sigma - before.sigma, Math.abs(before.sigma)),
    ...(allowCpkDelta && before.cpk !== undefined && after.cpk !== undefined
      ? { cpkDelta: after.cpk - before.cpk }
      : {}),
  };
}

function comparisonSpecsFor(
  baseline: ControlBaseline,
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>
): ComparisonSpecs {
  return baseline.specsSnapshot ?? specs;
}

function hasCpkSpecs(specs: ComparisonSpecs): boolean {
  return specs?.usl !== undefined || specs?.lsl !== undefined;
}

function canCompareCpk(
  before: SustainmentComparison['before'],
  baseline: ControlBaseline
): boolean {
  return before.source === 'live' || baseline.specsSnapshot !== undefined;
}

function defectsForRows(
  beforeRows: DataRow[] | undefined,
  afterRows: DataRow[],
  categoryColumn?: string,
  frozenBeforeCounts?: CategoryCount[]
): SustainmentComparison['defects'] {
  if (!categoryColumn) return undefined;
  return {
    before: frozenBeforeCounts ?? (beforeRows ? categoryCounts(beforeRows, categoryColumn) : []),
    after: categoryCounts(afterRows, categoryColumn),
  };
}

function categoryCounts(rows: DataRow[], categoryColumn: string): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = row[categoryColumn];
    if (raw === null || raw === undefined || raw === '') continue;
    const category = String(raw);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

function rowsWithNumericMeasure(rows: DataRow[], measure: string): DataRow[] {
  return rows.filter(row => toNumericValue(row[measure]) !== undefined);
}

function valuesForMeasure(rows: DataRow[], measure: string): number[] {
  return rows.flatMap(row => {
    const value = toNumericValue(row[measure]);
    return value === undefined ? [] : [value];
  });
}

function sortRowsByTimeColumn(rows: DataRow[], timeColumn: string): DataRow[] {
  return [...rows].sort((a, b) => {
    const aTime = parseTimeValue(a[timeColumn])?.getTime();
    const bTime = parseTimeValue(b[timeColumn])?.getTime();
    if (aTime === undefined && bTime === undefined) return 0;
    if (aTime === undefined) return 1;
    if (bTime === undefined) return -1;
    return aTime - bTime;
  });
}

function windowRange(
  rows: DataRow[],
  timeColumn: string
): { startISO: string; endISO: string } | undefined {
  let start: Date | undefined;
  let end: Date | undefined;
  for (const row of rows) {
    const parsed = parseTimeValue(row[timeColumn]);
    if (!parsed) continue;
    if (!start || parsed.getTime() < start.getTime()) start = parsed;
    if (!end || parsed.getTime() > end.getTime()) end = parsed;
  }
  if (!start || !end) return undefined;
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}
