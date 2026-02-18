/**
 * Azure IChart - Thin wrapper around shared @variscout/charts IChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Transforms data to IChartDataPoint[] format
 * 3. Manages Azure-specific UI (scale/label editors)
 * 4. Passes everything to shared IChartBase
 */
import React, { useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartBase } from '@variscout/charts';
import { useIChartData } from '@variscout/hooks';
import YAxisPopover from '../YAxisPopover';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  /** Highlighted point index from data panel (bi-directional sync) */
  highlightedPointIndex?: number | null;
}

const IChart = ({
  parentWidth,
  parentHeight,
  onPointClick,
  highlightedPointIndex,
}: IChartProps) => {
  const {
    filteredData,
    outcome,
    timeColumn,
    stats,
    specs,
    axisSettings,
    setAxisSettings,
    columnAliases,
    stageColumn,
    stagedData,
    stagedStats,
    displayOptions,
    selectedPoints,
    setSelectedPoints,
  } = useData();

  const [isEditingScale, setIsEditingScale] = useState(false);

  // Use stagedData when staging is active, otherwise filteredData
  const sourceData = stageColumn ? stagedData : filteredData;

  // Use existing hook for scale limits (for YAxisPopover)
  const { min: autoMin, max: autoMax } = useChartScale();

  const data = useIChartData(sourceData, outcome, stageColumn, timeColumn);

  const handleYAxisClick = () => {
    setIsEditingScale(true);
  };

  // Handle point click - map filtered index back to callback
  const handlePointClick = (index: number) => {
    onPointClick?.(index);
  };

  if (!outcome || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 italic">
        No data available for I-Chart
      </div>
    );
  }

  const effectiveStats = displayOptions.showControlLimits !== false ? stats : null;
  const effectiveStagedStats =
    displayOptions.showControlLimits !== false ? (stagedStats ?? undefined) : undefined;

  // Calculate margin for popover positioning (simplified)
  const margin = { top: 20, left: 60 };

  return (
    <div className="relative w-full h-full">
      <IChartBase
        data={data}
        stats={effectiveStats}
        stagedStats={effectiveStagedStats}
        specs={specs}
        yAxisLabel={columnAliases[outcome] || outcome}
        axisSettings={axisSettings}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={false}
        onPointClick={handlePointClick}
        onYAxisClick={handleYAxisClick}
        enableBrushSelection={true}
        selectedPoints={selectedPoints}
        onSelectionChange={setSelectedPoints}
        highlightedPointIndex={highlightedPointIndex}
        showLimitLabels={false}
      />

      {/* Y-Axis Scale Popover */}
      <YAxisPopover
        isOpen={isEditingScale}
        onClose={() => setIsEditingScale(false)}
        currentMin={axisSettings.min}
        currentMax={axisSettings.max}
        autoMin={autoMin}
        autoMax={autoMax}
        onSave={setAxisSettings}
        anchorPosition={{ top: margin.top, left: 10 }}
      />
    </div>
  );
};

export default withParentSize(IChart);
