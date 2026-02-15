/**
 * PWA IChart - Thin wrapper around shared @variscout/charts IChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Transforms data to IChartDataPoint[] format
 * 3. Applies displayOptions toggles (showSpecs, showControlLimits)
 * 4. Manages PWA-specific UI (scale/label editors)
 * 5. Passes everything to shared IChartBase
 */
import React, { useMemo, useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartBase, type IChartDataPoint } from '@variscout/charts';
import { formatTimeValue } from '@variscout/core';
import { AxisEditor, YAxisPopover } from '@variscout/ui';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
}

const IChart = ({ parentWidth, parentHeight, onPointClick, onSpecClick }: IChartProps) => {
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
    displayOptions,
    stageColumn,
    stagedStats,
    stagedData,
  } = useData();

  const [isEditingScale, setIsEditingScale] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  // Use staged data when stage column is active
  const sourceData = stageColumn ? stagedData : filteredData;

  // For YAxisPopover auto-range
  const { min: autoMin, max: autoMax } = useChartScale();

  // Transform data to IChartDataPoint[] format
  const data = useMemo<IChartDataPoint[]>(() => {
    if (!outcome) return [];
    return sourceData
      .map(
        (d: any, i: number): IChartDataPoint => ({
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
      setColumnAliases({ ...columnAliases, [outcome]: newAlias });
    }
  };

  if (!outcome || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-muted italic">
        No data available for I-Chart
      </div>
    );
  }

  const showBranding = shouldShowBranding();
  // Apply displayOptions toggles: hide spec/control lines by passing empty data
  const effectiveSpecs = displayOptions.showSpecs !== false ? specs : {};
  const effectiveStats = displayOptions.showControlLimits !== false ? stats : null;
  const effectiveStagedStats =
    displayOptions.showControlLimits !== false ? (stagedStats ?? undefined) : undefined;

  return (
    <div className="relative w-full h-full">
      <IChartBase
        data={data}
        stats={effectiveStats}
        stagedStats={effectiveStagedStats}
        specs={effectiveSpecs}
        grades={grades}
        yAxisLabel={columnAliases[outcome] || outcome}
        axisSettings={axisSettings}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={showBranding}
        brandingText={showBranding ? getBrandingText() : undefined}
        onPointClick={onPointClick}
        onSpecClick={onSpecClick}
        onYAxisClick={() => setIsEditingScale(true)}
        showLimitLabels
      />

      {/* Y-Axis Scale Editor Popover */}
      <YAxisPopover
        isOpen={isEditingScale}
        onClose={() => setIsEditingScale(false)}
        currentMin={axisSettings.min}
        currentMax={axisSettings.max}
        autoMin={autoMin}
        autoMax={autoMax}
        onSave={setAxisSettings}
        anchorPosition={{ top: 20, left: 10 }}
      />

      {/* In-Place Label Editor Popover */}
      {isEditingLabel && (
        <AxisEditor
          title="Edit Axis Label"
          originalName={outcome}
          alias={columnAliases[outcome] || ''}
          onSave={handleSaveAlias}
          onClose={() => setIsEditingLabel(false)}
          style={{ top: parentHeight / 2 - 30, left: 10 }}
        />
      )}
    </div>
  );
};

export default withParentSize(IChart);
