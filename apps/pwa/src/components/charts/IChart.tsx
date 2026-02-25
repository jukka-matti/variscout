/**
 * PWA IChart - Thin wrapper around shared @variscout/charts IChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Transforms data to IChartDataPoint[] format
 * 3. Applies displayOptions toggles (showControlLimits)
 * 4. Manages PWA-specific UI (scale/label editors)
 * 5. Supports free-floating text annotations (right-click → note)
 * 6. Passes everything to shared IChartBase
 */
import React, { useState, useMemo, useCallback } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartBase, getResponsiveMargins, getScaledFonts } from '@variscout/charts';
import { useIChartData } from '@variscout/hooks';
import { YAxisPopover, ChartAnnotationLayer } from '@variscout/ui';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';
import type { ChartAnnotation } from '@variscout/hooks';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  showBranding?: boolean;
  // I-Chart annotation support
  ichartAnnotations?: ChartAnnotation[];
  onCreateAnnotation?: (anchorX: number, anchorY: number) => void;
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
}

const IChart = ({
  parentWidth,
  parentHeight,
  onPointClick,
  onSpecClick,
  showBranding: showBrandingProp,
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

  // Right-click handler: create free-floating annotation at % position
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onCreateAnnotation) return;
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const margin = getResponsiveMargins(parentWidth, 'ichart');
      const chartWidth = parentWidth - margin.left - margin.right;
      const chartHeight = parentHeight - margin.top - margin.bottom;

      // Clamp to chart area (ignore clicks in margins)
      if (
        clickX < margin.left ||
        clickX > margin.left + chartWidth ||
        clickY < margin.top ||
        clickY > margin.top + chartHeight
      ) {
        return;
      }

      const anchorX = (clickX - margin.left) / chartWidth;
      const anchorY = (clickY - margin.top) / chartHeight;
      onCreateAnnotation(anchorX, anchorY);
    },
    [onCreateAnnotation, parentWidth, parentHeight]
  );

  // Compute pixel positions from percentage anchors for annotation layer
  const categoryPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (parentWidth === 0 || parentHeight === 0) return positions;

    const margin = getResponsiveMargins(parentWidth, 'ichart');
    const chartWidth = parentWidth - margin.left - margin.right;
    const chartHeight = parentHeight - margin.top - margin.bottom;

    for (const a of ichartAnnotations) {
      if (a.anchorX != null && a.anchorY != null) {
        positions.set(a.id, {
          x: a.anchorX * chartWidth + margin.left,
          y: a.anchorY * chartHeight + margin.top,
        });
      }
    }
    return positions;
  }, [ichartAnnotations, parentWidth, parentHeight]);

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
