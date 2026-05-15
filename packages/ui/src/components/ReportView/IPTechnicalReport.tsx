import {
  BoxplotBase,
  CapabilityGapTrendChartBase,
  CapabilityHistogramBase,
  IChartBase,
  ParetoChartBase,
  PerformanceIChartBase,
  ScatterFitBase,
} from '@variscout/charts';
import type React from 'react';
import type {
  BoxplotGroupData,
  ChannelResult,
  IChartDataPoint,
  ParetoDataPoint,
  SpecLimits,
  StatsResult,
} from '@variscout/core';

export const REPORT_METHODOLOGY_FOOTNOTE =
  'Turtiainen 2019 / Watson lineage, NIST-validated OLS QR solver (ADR-067), three-boundary numeric safety (ADR-069), customer-owned data (ADR-059, ADR-078).';

export interface IPTechnicalReportProps {
  chartLabels?: readonly string[];
  outcomeSeries?: readonly IChartDataPoint[];
  stats?: StatsResult | null;
  specs?: SpecLimits;
  beforeValues?: readonly number[];
  beforeMean?: number;
  afterValues?: readonly number[];
  afterMean?: number;
  paretoData?: readonly ParetoDataPoint[];
  paretoTotalCount?: number;
  scatterData?: readonly IChartDataPoint[];
  fittedLine?: readonly IChartDataPoint[];
  boxplotGroups?: readonly BoxplotGroupData[];
  channels?: readonly ChannelResult[];
  gapSeries?: readonly IChartDataPoint[];
  gapStats?: StatsResult | null;
}

function ChartUnavailable() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-edge text-xs text-content-tertiary">
      Chart unavailable for current data
    </div>
  );
}

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-edge bg-surface p-4">
      <h2 className="text-sm font-semibold text-content">{title}</h2>
      <div className="mt-3 h-56">{children}</div>
    </section>
  );
}

function valuesFromSeries(series: readonly IChartDataPoint[] | undefined): number[] {
  return (series ?? []).map(point => point.y).filter(Number.isFinite);
}

function buildGapSeries(channels: readonly ChannelResult[] | undefined): IChartDataPoint[] {
  return (channels ?? [])
    .map((channel, index) => ({
      x: index + 1,
      y: Math.max(0, (channel.cp ?? channel.cpk ?? 0) - (channel.cpk ?? channel.cp ?? 0)),
    }))
    .filter(point => Number.isFinite(point.y));
}

function buildGapStats(series: readonly IChartDataPoint[]): StatsResult | null {
  if (series.length === 0) return null;
  const values = series.map(point => point.y);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.length > 1
      ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
      : 0;
  const stdDev = Math.sqrt(variance);
  return {
    mean,
    median: values[Math.floor(values.length / 2)] ?? mean,
    stdDev,
    sigmaWithin: stdDev,
    mrBar: 0,
    ucl: mean + 3 * stdDev,
    lcl: Math.max(0, mean - 3 * stdDev),
    outOfSpecPercentage: 0,
  };
}

export function IPTechnicalReport({
  chartLabels,
  outcomeSeries,
  stats,
  specs = {},
  beforeValues,
  beforeMean,
  afterValues,
  afterMean,
  paretoData,
  paretoTotalCount,
  scatterData,
  fittedLine,
  boxplotGroups,
  channels,
  gapSeries,
  gapStats,
}: IPTechnicalReportProps) {
  const labels = chartLabels && chartLabels.length > 0 ? chartLabels : [];
  const label = (index: number, fallback: string) => labels[index] ?? fallback;
  const resolvedAfterValues = afterValues ?? valuesFromSeries(outcomeSeries);
  const resolvedAfterMean = afterMean ?? stats?.mean;
  const resolvedGapSeries = gapSeries ?? buildGapSeries(channels);
  const resolvedGapStats = gapStats ?? buildGapStats(resolvedGapSeries);

  return (
    <div className="space-y-6" data-testid="ip-technical-report">
      <div className="grid gap-3 md:grid-cols-2">
        <ChartFrame title={label(0, 'Capability before')}>
          {beforeValues && beforeValues.length > 0 && beforeMean != null ? (
            <CapabilityHistogramBase
              parentWidth={360}
              parentHeight={224}
              data={[...beforeValues]}
              specs={specs}
              mean={beforeMean}
            />
          ) : (
            <ChartUnavailable />
          )}
        </ChartFrame>
        <ChartFrame title={label(1, 'Capability after')}>
          {resolvedAfterValues.length > 0 && resolvedAfterMean != null ? (
            <CapabilityHistogramBase
              parentWidth={360}
              parentHeight={224}
              data={[...resolvedAfterValues]}
              specs={specs}
              mean={resolvedAfterMean}
            />
          ) : (
            <ChartUnavailable />
          )}
        </ChartFrame>
        <ChartFrame title={label(2, 'Outcome I-Chart')}>
          {outcomeSeries && outcomeSeries.length > 0 ? (
            <IChartBase
              parentWidth={360}
              parentHeight={224}
              data={[...outcomeSeries]}
              stats={stats ?? null}
              specs={specs}
              yAxisLabel="Outcome"
            />
          ) : (
            <ChartUnavailable />
          )}
        </ChartFrame>
        <ChartFrame title={label(3, 'Factor R2adj Pareto')}>
          {paretoData && paretoData.length > 0 ? (
            <ParetoChartBase
              parentWidth={360}
              parentHeight={224}
              data={[...paretoData]}
              totalCount={
                paretoTotalCount ?? paretoData.reduce((sum, point) => sum + point.value, 0)
              }
              xAxisLabel="Factor"
              yAxisLabel="Contribution"
            />
          ) : (
            <ChartUnavailable />
          )}
        </ChartFrame>
        <ChartFrame title={label(4, 'Regression scatter')}>
          {scatterData && scatterData.length > 0 ? (
            <ScatterFitBase
              parentWidth={360}
              parentHeight={224}
              data={[...scatterData]}
              fittedLine={fittedLine ? [...fittedLine] : []}
              xLabel="Factor"
              yLabel="Outcome"
            />
          ) : (
            <ChartUnavailable />
          )}
        </ChartFrame>
        <ChartFrame title={label(5, 'ANOVA boxplot')}>
          {boxplotGroups && boxplotGroups.length > 0 ? (
            <BoxplotBase
              parentWidth={360}
              parentHeight={224}
              data={[...boxplotGroups]}
              specs={specs}
              xAxisLabel="Study window"
              yAxisLabel="Outcome"
            />
          ) : (
            <ChartUnavailable />
          )}
        </ChartFrame>
        <ChartFrame title={label(6, 'Per-cause control charts')}>
          {channels && channels.length > 0 ? (
            <PerformanceIChartBase
              parentWidth={360}
              parentHeight={224}
              channels={[...channels]}
              capabilityMetric="cpk"
            />
          ) : (
            <ChartUnavailable />
          )}
        </ChartFrame>
        <ChartFrame title={label(7, 'Capability gap trend')}>
          {resolvedGapSeries.length > 0 && resolvedGapStats ? (
            <CapabilityGapTrendChartBase
              parentWidth={360}
              parentHeight={224}
              gapSeries={[...resolvedGapSeries]}
              gapStats={resolvedGapStats}
            />
          ) : (
            <ChartUnavailable />
          )}
        </ChartFrame>
      </div>
      <p className="text-xs text-content-tertiary">{REPORT_METHODOLOGY_FOOTNOTE}</p>
    </div>
  );
}
