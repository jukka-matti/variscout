/**
 * PWA IChart - Thin wrapper around shared @variscout/charts IChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Transforms data to IChartDataPoint[] format
 * 3. Applies displayOptions toggles (showControlLimits)
 * 4. Manages PWA-specific UI (scale/label editors)
 * 5. Passes everything to shared IChartBase
 */
import React, { useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartBase } from '@variscout/charts';
import { useIChartData } from '@variscout/hooks';
import { YAxisPopover } from '@variscout/ui';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  showBranding?: boolean;
}

const IChart = ({
  parentWidth,
  parentHeight,
  onPointClick,
  onSpecClick,
  showBranding: showBrandingProp,
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
    displayOptions,
    stageColumn,
    stagedStats,
    stagedData,
    selectedPoints,
    setSelectedPoints,
  } = useData();

  const [isEditingScale, setIsEditingScale] = useState(false);

  // Use staged data when stage column is active
  const sourceData = stageColumn ? stagedData : filteredData;

  // For YAxisPopover auto-range
  const { min: autoMin, max: autoMax } = useChartScale();

  const data = useIChartData(sourceData, outcome, stageColumn, timeColumn);

  if (!outcome || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-muted italic">
        No data available for I-Chart
      </div>
    );
  }

  const showBranding = showBrandingProp ?? shouldShowBranding();
  const effectiveStats = displayOptions.showControlLimits !== false ? stats : null;
  const effectiveStagedStats =
    displayOptions.showControlLimits !== false ? (stagedStats ?? undefined) : undefined;

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
        showBranding={showBranding}
        brandingText={showBranding ? getBrandingText() : undefined}
        onPointClick={onPointClick}
        onSpecClick={onSpecClick}
        onYAxisClick={() => setIsEditingScale(true)}
        enableBrushSelection={true}
        selectedPoints={selectedPoints}
        onSelectionChange={setSelectedPoints}
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
    </div>
  );
};

export default withParentSize(IChart);
