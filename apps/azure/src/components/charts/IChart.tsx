/**
 * Azure IChart - Thin wrapper around shared @variscout/charts IChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Transforms data to IChartDataPoint[] format
 * 3. Manages Azure-specific UI (scale/label editors)
 * 4. Passes everything to shared IChartBase
 */
import React, { useMemo, useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartBase, type IChartDataPoint } from '@variscout/charts';
import { formatTimeValue } from '@variscout/core';
import AxisEditor from '../AxisEditor';
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
    grades,
    axisSettings,
    setAxisSettings,
    columnAliases,
    setColumnAliases,
    stageColumn,
    stagedData,
    stagedStats,
  } = useData();

  const [isEditingScale, setIsEditingScale] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  // Use stagedData when staging is active, otherwise filteredData
  const sourceData = stageColumn ? stagedData : filteredData;

  // Use existing hook for scale limits (for YAxisPopover)
  const { min: autoMin, max: autoMax } = useChartScale();

  // Transform data to IChartDataPoint[] format
  const data = useMemo<IChartDataPoint[]>(() => {
    if (!outcome) return [];
    return sourceData
      .map(
        (d: Record<string, unknown>, i: number): IChartDataPoint => ({
          x: i,
          y: Number(d[outcome]),
          stage: stageColumn ? String(d[stageColumn] ?? '') : undefined,
          timeValue: timeColumn ? formatTimeValue(d[timeColumn]) : undefined,
          originalIndex: i,
        })
      )
      .filter(d => !isNaN(d.y));
  }, [sourceData, outcome, stageColumn, timeColumn]);

  const handleSaveAlias = (newAlias: string) => {
    if (outcome) {
      setColumnAliases({
        ...columnAliases,
        [outcome]: newAlias,
      });
    }
  };

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

  // Calculate margin for popover positioning (simplified)
  const margin = { top: 20, left: 60 };

  return (
    <div className="relative w-full h-full">
      <IChartBase
        data={data}
        stats={stats}
        stagedStats={stagedStats ?? undefined}
        specs={specs}
        grades={grades}
        yAxisLabel={columnAliases[outcome] || outcome}
        axisSettings={axisSettings}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={true}
        onPointClick={handlePointClick}
        onYAxisClick={handleYAxisClick}
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

      {/* In-Place Label Editor Popover */}
      {isEditingLabel && (
        <AxisEditor
          title="Edit Axis Label"
          originalName={outcome}
          alias={columnAliases[outcome] || ''}
          onSave={handleSaveAlias}
          onClose={() => setIsEditingLabel(false)}
          style={{ top: margin.top + parentHeight / 2 - 50, left: 10 }}
        />
      )}
    </div>
  );
};

export default withParentSize(IChart);
