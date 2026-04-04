/**
 * YamazumiDashboard - Yamazumi analysis mode dashboard for Azure app
 *
 * Composes 4 chart slots: I-Chart (switchable), Yamazumi chart, Pareto (switchable), Summary.
 * Uses existing DashboardGrid layout from @variscout/ui.
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  DashboardChartCard,
  DashboardGrid,
  YamazumiSummaryBar,
  YamazumiIChartMetricToggle,
  YamazumiParetoModeDropdown,
} from '@variscout/ui';
import {
  useYamazumiChartData,
  useYamazumiIChartData,
  useYamazumiParetoData,
} from '@variscout/hooks';
import { computeYamazumiSummary, calculateStats, isPaidTier } from '@variscout/core';
import type {
  YamazumiColumnMapping,
  YamazumiIChartMetric,
  YamazumiParetoMode,
} from '@variscout/core';
import { IChart, ParetoChart, YamazumiChart } from '@variscout/charts';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData } from '@variscout/hooks';

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
  const showBranding = !isPaidTier();

  // Yamazumi-specific display state
  const [ichartMetric, setIchartMetric] = useState<YamazumiIChartMetric>('total');
  const [paretoMode, setParetoMode] = useState<YamazumiParetoMode>('steps-total');

  // Compute data through shared hooks
  const barData = useYamazumiChartData({ filteredData, mapping });
  const ichartData = useYamazumiIChartData({ filteredData, mapping, metric: ichartMetric });
  const { data: paretoData, totalCount } = useYamazumiParetoData({
    filteredData,
    mapping,
    mode: paretoMode,
  });

  // Recompute stats from aggregated I-Chart data (not raw measurement stats)
  const ichartStats = useMemo(() => {
    const values = ichartData.map(d => d.y);
    return values.length > 0 ? calculateStats(values) : null;
  }, [ichartData]);

  const summary = useMemo(
    () => computeYamazumiSummary(barData, mapping.taktTime),
    [barData, mapping.taktTime]
  );

  const handleTaktTimeChange = useCallback(
    (taktTime: number | undefined) => {
      onTaktTimeChange?.(taktTime);
    },
    [onTaktTimeChange]
  );

  return (
    <DashboardGrid
      ichartCard={
        <DashboardChartCard
          id="yamazumi-ichart"
          testId="chart-ichart"
          title={<span className="text-sm font-medium text-content">I-Chart</span>}
          chartName="I-Chart"
          controls={
            <YamazumiIChartMetricToggle metric={ichartMetric} onMetricChange={setIchartMetric} />
          }
        >
          <IChart data={ichartData} stats={ichartStats} specs={specs} showBranding={showBranding} />
        </DashboardChartCard>
      }
      boxplotCard={
        <DashboardChartCard
          id="yamazumi-chart"
          testId="chart-yamazumi"
          title={<span className="text-sm font-medium text-content">Yamazumi</span>}
          chartName="Yamazumi"
        >
          <YamazumiChart
            data={barData}
            taktTime={mapping.taktTime}
            onBarClick={onBarClick}
            showBranding={showBranding}
          />
        </DashboardChartCard>
      }
      paretoCard={
        <DashboardChartCard
          id="yamazumi-pareto"
          testId="chart-pareto"
          title={<span className="text-sm font-medium text-content">Pareto</span>}
          chartName="Pareto"
          controls={
            <YamazumiParetoModeDropdown
              mode={paretoMode}
              onModeChange={setParetoMode}
              hasReasonColumn={!!mapping.reasonColumn}
              hasActivityColumn={!!mapping.activityColumn}
            />
          }
        >
          <ParetoChart data={paretoData} totalCount={totalCount} showBranding={showBranding} />
        </DashboardChartCard>
      }
      piPanel={
        <DashboardChartCard
          id="yamazumi-summary"
          testId="chart-stats"
          title={<span className="text-sm font-medium text-content">Summary</span>}
          chartName="Summary"
        >
          <div className="p-3 overflow-y-auto h-full">
            <YamazumiSummaryBar summary={summary} onTaktTimeChange={handleTaktTimeChange} />
          </div>
        </DashboardChartCard>
      }
    />
  );
};

export default YamazumiDashboard;
