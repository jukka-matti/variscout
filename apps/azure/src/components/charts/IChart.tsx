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
import React, { useState, useMemo, useCallback } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartBase, getResponsiveMargins, getScaledFonts } from '@variscout/charts';
import { useIChartData } from '@variscout/hooks';
import { ChartAnnotationLayer } from '@variscout/ui';
import YAxisPopover from '../YAxisPopover';
import type { ChartAnnotation } from '@variscout/hooks';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  /** Highlighted point index from data panel (bi-directional sync) */
  highlightedPointIndex?: number | null;
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

  // Right-click handler: create free-floating annotation at % position
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onCreateAnnotation) return;
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const chartMargin = getResponsiveMargins(parentWidth, 'ichart');
      const chartWidth = parentWidth - chartMargin.left - chartMargin.right;
      const chartHeight = parentHeight - chartMargin.top - chartMargin.bottom;

      // Clamp to chart area (ignore clicks in margins)
      if (
        clickX < chartMargin.left ||
        clickX > chartMargin.left + chartWidth ||
        clickY < chartMargin.top ||
        clickY > chartMargin.top + chartHeight
      ) {
        return;
      }

      const anchorX = (clickX - chartMargin.left) / chartWidth;
      const anchorY = (clickY - chartMargin.top) / chartHeight;
      onCreateAnnotation(anchorX, anchorY);
    },
    [onCreateAnnotation, parentWidth, parentHeight]
  );

  // Compute pixel positions from percentage anchors for annotation layer
  const categoryPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (parentWidth === 0 || parentHeight === 0) return positions;

    const chartMargin = getResponsiveMargins(parentWidth, 'ichart');
    const chartWidth = parentWidth - chartMargin.left - chartMargin.right;
    const chartHeight = parentHeight - chartMargin.top - chartMargin.bottom;

    for (const a of ichartAnnotations) {
      if (a.anchorX != null && a.anchorY != null) {
        positions.set(a.id, {
          x: a.anchorX * chartWidth + chartMargin.left,
          y: a.anchorY * chartHeight + chartMargin.top,
        });
      }
    }
    return positions;
  }, [ichartAnnotations, parentWidth, parentHeight]);

  const fonts = getScaledFonts(parentWidth);

  return (
    <div className="relative w-full h-full" onContextMenu={handleContextMenu}>
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

      {/* Free-floating annotation overlay */}
      {ichartAnnotations.length > 0 && onAnnotationsChange && (
        <ChartAnnotationLayer
          annotations={ichartAnnotations}
          onAnnotationsChange={onAnnotationsChange}
          isActive={true}
          categoryPositions={categoryPositions}
          maxWidth={parentWidth * 0.7}
          textColor="#cbd5e1"
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
        anchorPosition={{ top: margin.top, left: 10 }}
      />
    </div>
  );
};

export default withParentSize(IChart);
