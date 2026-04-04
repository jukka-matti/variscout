/**
 * YamazumiDashboard - Simplified dashboard for Yamazumi analysis mode
 *
 * Composes DashboardGrid with:
 * - Slot 1: I-Chart (with switchable metric via useYamazumiIChartData)
 * - Slot 2: Yamazumi stacked bar chart
 * - Slot 3: Pareto (with switchable mode via useYamazumiParetoData)
 * - Slot 4: YamazumiSummaryBar (replaces PI Panel)
 */
import React, { useMemo, useState } from 'react';
import {
  DashboardGrid,
  DashboardChartCard,
  YamazumiSummaryBar,
  ErrorBoundary,
} from '@variscout/ui';
import { YamazumiIChartMetricToggle, YamazumiParetoModeDropdown } from '@variscout/ui';
import {
  useYamazumiChartData,
  useYamazumiIChartData,
  useYamazumiParetoData,
} from '@variscout/hooks';
import { computeYamazumiSummary, calculateStats } from '@variscout/core';
import type {
  YamazumiColumnMapping,
  YamazumiIChartMetric,
  YamazumiParetoMode,
  SpecLimits,
} from '@variscout/core';
import { IChartBase, ParetoChartBase, YamazumiChartBase } from '@variscout/charts';
import { withParentSize } from '@visx/responsive';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData } from '@variscout/hooks';

// ---------------------------------------------------------------------------
// Responsive inner chart components (withParentSize provides dimensions)
// ---------------------------------------------------------------------------

interface YamazumiIChartInnerProps {
  parentWidth: number;
  parentHeight: number;
  ichartData: ReturnType<typeof useYamazumiIChartData>;
  specs: SpecLimits;
}

const YamazumiIChartInner: React.FC<YamazumiIChartInnerProps> = ({
  parentWidth,
  parentHeight,
  ichartData,
  specs,
}) => {
  const values = ichartData.map(d => d.y);
  const stats = values.length > 0 ? calculateStats(values) : null;

  return (
    <IChartBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={ichartData}
      stats={stats}
      specs={specs}
      showBranding={true}
      yAxisLabel="Cycle Time"
    />
  );
};

const ResponsiveYamazumiIChart = withParentSize(YamazumiIChartInner);

interface YamazumiBarInnerProps {
  parentWidth: number;
  parentHeight: number;
  barData: ReturnType<typeof useYamazumiChartData>;
  taktTime?: number;
  onBarClick?: (key: string) => void;
}

const YamazumiBarInner: React.FC<YamazumiBarInnerProps> = ({
  parentWidth,
  parentHeight,
  barData,
  taktTime,
  onBarClick,
}) => {
  return (
    <YamazumiChartBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={barData}
      taktTime={taktTime}
      onBarClick={onBarClick}
      showBranding={true}
    />
  );
};

const ResponsiveYamazumiBar = withParentSize(YamazumiBarInner);

interface YamazumiParetoInnerProps {
  parentWidth: number;
  parentHeight: number;
  paretoData: ReturnType<typeof useYamazumiParetoData>['data'];
  totalCount: number;
}

const YamazumiParetoInner: React.FC<YamazumiParetoInnerProps> = ({
  parentWidth,
  parentHeight,
  paretoData,
  totalCount,
}) => {
  return (
    <ParetoChartBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={paretoData}
      totalCount={totalCount}
      showBranding={true}
      yAxisLabel="Time"
    />
  );
};

const ResponsiveYamazumiPareto = withParentSize(YamazumiParetoInner);

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

interface YamazumiDashboardProps {
  mapping: YamazumiColumnMapping;
  onBarClick?: (key: string) => void;
  onTaktTimeChange?: (taktTime: number | undefined) => void;
}

const YamazumiDashboard: React.FC<YamazumiDashboardProps> = ({
  mapping,
  onBarClick,
  onTaktTimeChange,
}) => {
  const { filteredData } = useFilteredData();
  const specs = useProjectStore(s => s.specs);
  const [ichartMetric, setIchartMetric] = useState<YamazumiIChartMetric>('total');
  const [paretoMode, setParetoMode] = useState<YamazumiParetoMode>('steps-total');

  const barData = useYamazumiChartData({ filteredData, mapping });
  const ichartData = useYamazumiIChartData({ filteredData, mapping, metric: ichartMetric });
  const { data: paretoData, totalCount } = useYamazumiParetoData({
    filteredData,
    mapping,
    mode: paretoMode,
  });
  const summary = useMemo(
    () => computeYamazumiSummary(barData, mapping.taktTime),
    [barData, mapping.taktTime]
  );

  return (
    <DashboardGrid
      ichartCard={
        <DashboardChartCard
          id="yamazumi-ichart-card"
          testId="chart-yamazumi-ichart"
          chartName="yamazumi-ichart"
          minHeight="400px"
          title={
            <h2 className="text-xl font-bold flex items-center gap-2 text-content">
              I-Chart: Cycle Time
            </h2>
          }
          controls={
            <YamazumiIChartMetricToggle metric={ichartMetric} onMetricChange={setIchartMetric} />
          }
        >
          <ErrorBoundary>
            <ResponsiveYamazumiIChart ichartData={ichartData} specs={specs} />
          </ErrorBoundary>
        </DashboardChartCard>
      }
      boxplotCard={
        <DashboardChartCard
          id="yamazumi-chart-card"
          testId="chart-yamazumi"
          chartName="yamazumi"
          className="flex-1 min-w-[300px]"
          title={
            <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
              Yamazumi
            </h3>
          }
        >
          <ErrorBoundary>
            <ResponsiveYamazumiBar
              barData={barData}
              taktTime={mapping.taktTime}
              onBarClick={onBarClick}
            />
          </ErrorBoundary>
        </DashboardChartCard>
      }
      paretoCard={
        <DashboardChartCard
          id="yamazumi-pareto-card"
          testId="chart-yamazumi-pareto"
          chartName="yamazumi-pareto"
          className="flex-1 min-w-[300px]"
          title={
            <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
              Pareto
            </h3>
          }
          controls={
            <YamazumiParetoModeDropdown
              mode={paretoMode}
              onModeChange={setParetoMode}
              hasReasonColumn={!!mapping.reasonColumn}
              hasActivityColumn={!!mapping.activityColumn}
            />
          }
        >
          <ErrorBoundary>
            <ResponsiveYamazumiPareto paretoData={paretoData} totalCount={totalCount} />
          </ErrorBoundary>
        </DashboardChartCard>
      }
      piPanel={
        <div data-testid="yamazumi-summary-panel" className="p-2">
          <YamazumiSummaryBar summary={summary} onTaktTimeChange={onTaktTimeChange} />
        </div>
      }
    />
  );
};

export default YamazumiDashboard;
