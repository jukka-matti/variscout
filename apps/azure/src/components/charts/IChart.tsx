/**
 * Azure IChart - Thin wrapper around shared @variscout/charts IChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Transforms data to IChartDataPoint[] format
 * 3. Manages Azure-specific UI (scale/label editors)
 * 4. Supports free-floating text annotations (right-click → note)
 * 5. Passes everything to shared IChartBase
 */
import React, { useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartBase, getScaledFonts } from '@variscout/charts';
import { useIChartData, useIChartWrapperData } from '@variscout/hooks';
import { ChartAnnotationLayer, YAxisPopover } from '@variscout/ui';
import type { ChartAnnotation } from '@variscout/hooks';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  /** Highlighted point index from data panel (bi-directional sync) */
  highlightedPointIndex?: number | null;
  /** Callback when a spec label (USL/LSL/Target) is clicked */
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  // I-Chart annotation support
  ichartAnnotations?: ChartAnnotation[];
  onCreateAnnotation?: (anchorX: number, anchorY: number) => void;
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
}

const IChart = ({
  parentWidth,
  parentHeight,
  onPointClick,
  highlightedPointIndex,
  onSpecClick,
  ichartAnnotations = [],
  onCreateAnnotation,
  onAnnotationsChange,
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

  const { effectiveStats, effectiveStagedStats, categoryPositions, handleContextMenu } =
    useIChartWrapperData({
      parentWidth,
      parentHeight,
      stats,
      stagedStats,
      displayOptions,
      ichartAnnotations,
      onCreateAnnotation,
    });

  if (!outcome || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-muted italic">
        No data available for I-Chart
      </div>
    );
  }

  // Hide spec lines when showSpecs is false
  const effectiveSpecs = displayOptions.showSpecs !== false ? specs : {};

  const fonts = getScaledFonts(parentWidth);

  return (
    <div className="relative w-full h-full" onContextMenu={handleContextMenu}>
      <IChartBase
        data={data}
        stats={effectiveStats}
        stagedStats={effectiveStagedStats}
        specs={effectiveSpecs}
        yAxisLabel={columnAliases[outcome] || outcome}
        axisSettings={axisSettings}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={false}
        onPointClick={onPointClick}
        onYAxisClick={() => setIsEditingScale(true)}
        enableBrushSelection={true}
        selectedPoints={selectedPoints}
        onSelectionChange={setSelectedPoints}
        highlightedPointIndex={highlightedPointIndex}
        onSpecClick={onSpecClick}
      />

      {/* Free-floating annotation overlay */}
      {ichartAnnotations.length > 0 && onAnnotationsChange && (
        <ChartAnnotationLayer
          annotations={ichartAnnotations}
          onAnnotationsChange={onAnnotationsChange}
          isActive={true}
          categoryPositions={categoryPositions}
          maxWidth={parentWidth * 0.7}
          textColor="var(--color-content-primary, #cbd5e1)"
          fontSize={fonts.statLabel}
        />
      )}

      {/* Y-Axis Scale Popover */}
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
