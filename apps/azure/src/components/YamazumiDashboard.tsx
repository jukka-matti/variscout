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
import { computeYamazumiSummary, isPaidTier } from '@variscout/core';
import type {
  YamazumiColumnMapping,
  YamazumiIChartMetric,
  YamazumiParetoMode,
} from '@variscout/core';
import { IChartBase, ParetoChartBase, YamazumiChartBase } from '@variscout/charts';
import { useData } from '../context/DataContext';

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
  const { filteredData, stats, specs } = useData();
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
    <DashboardGrid>
      {/* Slot 1: I-Chart with switchable metric */}
      <DashboardChartCard
        chartId="ichart"
        title="I-Chart"
        headerExtra={
          <YamazumiIChartMetricToggle metric={ichartMetric} onMetricChange={setIchartMetric} />
        }
      >
        {(width: number, height: number) => (
          <IChartBase
            parentWidth={width}
            parentHeight={height}
            data={ichartData}
            stats={stats}
            specs={specs}
            showBranding={showBranding}
          />
        )}
      </DashboardChartCard>

      {/* Slot 2: Yamazumi stacked bar chart */}
      <DashboardChartCard chartId="yamazumi" title="Yamazumi">
        {(width: number, height: number) => (
          <YamazumiChartBase
            parentWidth={width}
            parentHeight={height}
            data={barData}
            taktTime={mapping.taktTime}
            onBarClick={onBarClick}
            showBranding={showBranding}
          />
        )}
      </DashboardChartCard>

      {/* Slot 3: Pareto with switchable mode */}
      <DashboardChartCard
        chartId="pareto"
        title="Pareto"
        headerExtra={
          <YamazumiParetoModeDropdown
            mode={paretoMode}
            onModeChange={setParetoMode}
            hasReasonColumn={!!mapping.reasonColumn}
            hasActivityColumn={!!mapping.activityColumn}
          />
        }
      >
        {(width: number, height: number) => (
          <ParetoChartBase
            parentWidth={width}
            parentHeight={height}
            data={paretoData}
            totalCount={totalCount}
            showBranding={showBranding}
          />
        )}
      </DashboardChartCard>

      {/* Slot 4: Yamazumi Summary */}
      <DashboardChartCard chartId="stats" title="Summary">
        {() => (
          <div className="p-3 overflow-y-auto h-full">
            <YamazumiSummaryBar summary={summary} onTaktTimeChange={handleTaktTimeChange} />
          </div>
        )}
      </DashboardChartCard>
    </DashboardGrid>
  );
};

export default YamazumiDashboard;
