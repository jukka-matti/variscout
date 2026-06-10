import React, { useMemo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { IChartBase } from '@variscout/charts';
import type { IChartDataPoint, IChartPhaseLimits } from '@variscout/charts';
import type {
  ControlRecord,
  ControlReview,
  DataCellValue,
  DataRow,
  SpecLimits,
  SustainmentComparison,
} from '@variscout/core';
import { toNumericValue } from '@variscout/core';

export interface ControlVerificationBandProps {
  record: ControlRecord;
  comparison: SustainmentComparison | null;
  reviews?: ControlReview[];
  rawData?: DataRow[];
  timeColumn?: string | null;
  specs?: SpecLimits;
  onLogReview?: (recordId: string) => void;
}

const emptySpecs: SpecLimits = {};

export const ControlVerificationBand: React.FC<ControlVerificationBandProps> = ({
  record,
  comparison,
  reviews = [],
  rawData = [],
  timeColumn,
  specs = emptySpecs,
  onLogReview,
}) => {
  const chartData = useMemo(
    () => buildChartData(rawData, record.baseline.measure, timeColumn),
    [rawData, record.baseline.measure, timeColumn]
  );
  const phaseLimits = toChartPhaseLimits(comparison);
  const eventFlags = reviews
    .filter(review => review.deletedAt === null)
    .map(review => ({
      atISO: new Date(review.reviewedAt).toISOString(),
      label: formatVerdict(review.verdict),
    }));
  const ladderWalked =
    record.ladder.length > 0 && record.ladderStep >= Math.max(record.ladder.length - 1, 0);
  const noAfterRows = comparison !== null && comparison.after === null;

  return (
    <section
      aria-label="Control verification"
      className="rounded-md border border-edge bg-surface p-4 text-content shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            Verification band
          </p>
          <h3 className="mt-1 text-base font-semibold">{record.title}</h3>
          <p className="mt-1 text-xs text-content-secondary">
            {record.baseline.measure} since {formatDate(record.improvementDate)}
          </p>
        </div>
        {onLogReview ? (
          <button
            type="button"
            onClick={() => onLogReview(record.id)}
            className="inline-flex items-center gap-2 rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium text-content hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <ClipboardCheck size={16} aria-hidden="true" />
            Log re-check
          </button>
        ) : null}
      </div>

      {chartData.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-md border border-edge bg-surface-primary">
          <IChartBase
            data={chartData}
            stats={null}
            specs={specs}
            parentWidth={720}
            parentHeight={260}
            yAxisLabel={record.baseline.measure}
            showBranding={false}
            showLimitLabels={false}
            phaseSplit={{ atISO: record.improvementDate, label: 'Improvement' }}
            phaseLimits={phaseLimits}
            eventFlags={eventFlags}
          />
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed border-edge bg-surface-primary p-3 text-sm text-content-secondary">
          Add dated measurements to draw the verification chart.
        </p>
      )}

      {noAfterRows ? (
        <p className="mt-4 rounded-md border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-content">
          Re-ingest data after {formatDate(record.improvementDate)} to verify.
        </p>
      ) : null}

      {comparison ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <StatsPanel
            title="Before"
            sourceLabel={
              comparison.before.source === 'frozen'
                ? `baseline snapshot · ${formatDate(record.baseline.capturedAt)}`
                : 'live pre-improvement data'
            }
            n={comparison.before.n}
            mean={comparison.before.mean}
            sigma={comparison.before.sigma}
            cpk={comparison.before.cpk}
          />
          <StatsPanel
            title="After"
            sourceLabel={comparison.after ? 'post-improvement data' : 'awaiting re-ingest'}
            n={comparison.after?.n ?? 0}
            mean={comparison.after?.mean}
            sigma={comparison.after?.sigma}
            cpk={comparison.after?.cpk}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-content-secondary">
          Select a sustainment record to calculate the comparison.
        </p>
      )}

      {comparison?.defects ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DefectBars title="Defect mix before" counts={comparison.defects.before} />
          <DefectBars title="Defect mix after" counts={comparison.defects.after} />
        </div>
      ) : null}

      {ladderWalked ? (
        <p className="mt-4 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-content">
          Ladder walked; consider confirming sustained & closing.
        </p>
      ) : null}
    </section>
  );
};

interface StatsPanelProps {
  title: string;
  sourceLabel: string;
  n: number;
  mean?: number;
  sigma?: number;
  cpk?: number;
}

function StatsPanel({ title, sourceLabel, n, mean, sigma, cpk }: StatsPanelProps) {
  return (
    <div className="rounded-md border border-edge bg-surface-secondary p-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-xs text-content-secondary">{sourceLabel}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Metric label="n" value={String(n)} />
        <Metric label="Mean" value={formatNumber(mean)} />
        <Metric label="Sigma" value={formatNumber(sigma)} />
        <Metric label="Cpk" value={formatNumber(cpk)} />
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-content-secondary">{label}</dt>
      <dd className="font-medium text-content">{value}</dd>
    </div>
  );
}

function DefectBars({
  title,
  counts,
}: {
  title: string;
  counts: Array<{ category: string; count: number }>;
}) {
  const max = Math.max(...counts.map(count => count.count), 1);
  return (
    <div className="rounded-md border border-edge bg-surface-secondary p-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      {counts.length === 0 ? (
        <p className="mt-2 text-sm text-content-secondary">No defect categories recorded.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {counts.slice(0, 6).map(count => (
            <div key={count.category}>
              <div className="flex justify-between gap-3 text-xs">
                <span className="truncate text-content-secondary">{count.category}</span>
                <span className="font-medium text-content">{count.count}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-surface-tertiary">
                <div
                  className="h-1.5 rounded-full bg-accent"
                  style={{ width: `${Math.max(8, (count.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildChartData(
  rows: DataRow[],
  measure: string,
  timeColumn?: string | null
): IChartDataPoint[] {
  return rows.flatMap((row, originalIndex) => {
    const value = toNumericValue(row[measure]);
    if (value === undefined) return [];
    const rawTime = timeColumn ? row[timeColumn] : undefined;
    const isoTimestamp = toISO(rawTime);
    return [
      {
        x: originalIndex,
        y: value,
        originalIndex,
        timeValue: rawTime === undefined || rawTime === null ? null : String(rawTime),
        isoTimestamp,
      },
    ];
  });
}

function toChartPhaseLimits(
  comparison: SustainmentComparison | null
): IChartPhaseLimits | undefined {
  if (!comparison?.phases) return undefined;
  return {
    before: comparison.phases.beforeLimits
      ? {
          mean: comparison.phases.beforeLimits.centerLine,
          ucl: comparison.phases.beforeLimits.ucl,
          lcl: comparison.phases.beforeLimits.lcl,
        }
      : undefined,
    after: comparison.phases.afterLimits
      ? {
          mean: comparison.phases.afterLimits.centerLine,
          ucl: comparison.phases.afterLimits.ucl,
          lcl: comparison.phases.afterLimits.lcl,
        }
      : undefined,
  };
}

function toISO(value: DataCellValue): string | null {
  if (value === null || value === undefined) return null;
  const parsed = new Date(value as string | number);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function formatDate(value: string | number): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatNumber(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value) ? 'n/a' : value.toFixed(2);
}

function formatVerdict(verdict: ControlReview['verdict']): string {
  if (verdict === 'holding') return 'Holding';
  if (verdict === 'drifted') return 'Drifted';
  return 'Inconclusive';
}
