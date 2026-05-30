import {
  calculateStats,
  type DataRow,
  type Finding,
  type Hypothesis,
  type SpecLimits,
} from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import { computeHistogramBins } from '@variscout/core/stats';

export interface SystemOutcomeModel {
  values: number[];
  bins: ReturnType<typeof computeHistogramBins>;
  cp?: number;
  cpk?: number;
  conformancePercentage: number;
  outOfSpecPercentage: number;
  drift: { label: string; tone: string };
  activeSummary: string;
}

export function buildSystemOutcomeModel({
  rows,
  outcomeColumn,
  specLimits,
  hypotheses,
  findings,
}: {
  rows: readonly DataRow[];
  outcomeColumn: string | undefined;
  specLimits: SpecLimits | undefined;
  hypotheses: ReadonlyArray<Hypothesis>;
  findings: ReadonlyArray<Finding>;
}): SystemOutcomeModel {
  const values = outcomeValues(rows, outcomeColumn);
  const stats = calculateStats(values, specLimits?.usl, specLimits?.lsl);
  return {
    values,
    bins: computeHistogramBins(values),
    cp: stats.cp,
    cpk: stats.cpk,
    conformancePercentage: 100 - stats.outOfSpecPercentage,
    outOfSpecPercentage: stats.outOfSpecPercentage,
    drift: driftLabel(values),
    activeSummary: buildActiveSummary({ hypotheses, findings }),
  };
}

function outcomeValues(rows: readonly DataRow[], outcomeColumn: string | undefined): number[] {
  if (!outcomeColumn) return [];
  return rows
    .map(row => {
      const value = row[outcomeColumn];
      const numberValue = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(numberValue) ? numberValue : null;
    })
    .filter((value): value is number => value !== null);
}

function driftLabel(values: readonly number[]): { label: string; tone: string } {
  if (values.length < 4) {
    return { label: 'Not enough outcome history', tone: 'bg-surface-secondary text-content-muted' };
  }

  const midpoint = Math.floor(values.length / 2);
  const first = values.slice(0, midpoint);
  const second = values.slice(midpoint);
  const firstMean = first.reduce((sum, value) => sum + value, 0) / first.length;
  const secondMean = second.reduce((sum, value) => sum + value, 0) / second.length;
  const delta = secondMean - firstMean;

  if (Math.abs(delta) < 0.01) {
    return { label: 'Outcome stable', tone: 'bg-surface-secondary text-content-secondary' };
  }

  const direction = delta > 0 ? 'up' : 'down';
  return {
    label: `Outcome trending ${direction} ${formatStatistic(Math.abs(delta), 'en', 2)}`,
    tone:
      delta > 0 ? 'bg-status-pass-soft text-status-pass' : 'bg-status-fail-soft text-status-fail',
  };
}

function buildActiveSummary({
  hypotheses,
  findings,
}: {
  hypotheses: ReadonlyArray<Hypothesis>;
  findings: ReadonlyArray<Finding>;
}): string {
  const activeHypotheses = hypotheses.filter(hypothesis =>
    ['proposed', 'evidenced', 'needs-disconfirmation'].includes(hypothesis.status)
  ).length;
  const openFindings = findings.filter(
    finding => !['analyzed', 'resolved'].includes(String(finding.status))
  ).length;
  const hypothesisLabel = `${activeHypotheses} active ${
    activeHypotheses === 1 ? 'hypothesis' : 'hypotheses'
  }`;
  const findingLabel = `${openFindings} open ${openFindings === 1 ? 'finding' : 'findings'}`;
  return `${hypothesisLabel} · ${findingLabel}`;
}
