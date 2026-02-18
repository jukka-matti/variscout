/**
 * PWA Boxplot - Thin wrapper around shared @variscout/charts BoxplotBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Computes BoxplotGroupData[] from filtered data
 * 3. Applies displayOptions toggles (showContributionLabels)
 * 4. Manages PWA-specific UI (axis label editing with value labels)
 * 5. Supports annotations (highlight colors + text overlay via right-click)
 * 6. Passes everything to shared BoxplotBase
 */
import React, { useState, useMemo } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { BoxplotBase } from '@variscout/charts';
import { AxisEditor, ChartAnnotationLayer } from '@variscout/ui';
import { useBoxplotData } from '@variscout/hooks';
import { sortBoxplotData } from '@variscout/core';
import { getResponsiveMargins, getScaledFonts } from '@variscout/charts';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';
import type { HighlightColor, ChartAnnotation } from '@variscout/hooks';

interface BoxplotProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  variationPct?: number;
  categoryContributions?: Map<string | number, number>;
  showBranding?: boolean;
  // Annotation support
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  annotations?: ChartAnnotation[];
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
}

const Boxplot = ({
  factor,
  parentWidth,
  parentHeight,
  onDrillDown,
  variationPct,
  categoryContributions,
  showBranding: showBrandingProp,
  highlightedCategories,
  onContextMenu,
  annotations = [],
  onAnnotationsChange,
}: BoxplotProps) => {
  const {
    filteredData,
    outcome,
    filters,
    setFilters,
    columnAliases,
    setColumnAliases,
    valueLabels,
    setValueLabels,
    specs,
    displayOptions,
  } = useData();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const { min, max } = useChartScale();
  const rawData = useBoxplotData(filteredData, factor, outcome);
  const data = sortBoxplotData(
    rawData,
    displayOptions.boxplotSortBy,
    displayOptions.boxplotSortDirection
  );

  const handleBoxClick = (key: string) => {
    if (onDrillDown) {
      onDrillDown(factor, key);
    } else {
      const currentFilters = filters[factor] || [];
      const newFilters = currentFilters.includes(key)
        ? currentFilters.filter(v => v !== key)
        : [...currentFilters, key];
      setFilters({ ...filters, [factor]: newFilters });
    }
  };

  const handleSaveAlias = (newAlias: string, newValueLabels?: Record<string, string>) => {
    setColumnAliases({ ...columnAliases, [factor]: newAlias });
    if (newValueLabels) {
      setValueLabels({ ...valueLabels, [factor]: newValueLabels });
    }
  };

  // Compute category positions for annotation layer
  const categoryPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (data.length === 0 || parentWidth === 0) return positions;

    const margin = getResponsiveMargins(parentWidth, 'boxplot');
    const chartWidth = parentWidth - margin.left - margin.right;
    const padding = 0.4;
    const step = chartWidth / data.length;
    const bandwidth = step * (1 - padding);
    const offset = (step * padding) / 2;

    for (const d of data) {
      const idx = data.indexOf(d);
      const x = margin.left + idx * step + offset + bandwidth / 2;
      const y = margin.top; // default: top of chart area
      positions.set(d.key, { x, y });
    }
    return positions;
  }, [data, parentWidth]);

  if (!outcome || data.length === 0) return null;

  const alias = columnAliases[factor] || factor;
  const factorLabels = valueLabels[factor] || {};
  const showBranding = showBrandingProp ?? shouldShowBranding();
  const selectedGroups = (filters[factor] || []).map(String);
  const fonts = getScaledFonts(parentWidth);

  return (
    <div className="relative w-full h-full">
      <BoxplotBase
        data={data}
        specs={specs}
        yAxisLabel={columnAliases[outcome] || outcome}
        xAxisLabel={alias}
        yDomainOverride={{ min, max }}
        selectedGroups={selectedGroups}
        onBoxClick={handleBoxClick}
        sampleSize={filteredData.length}
        variationPct={variationPct}
        categoryContributions={categoryContributions}
        showContributionLabels={displayOptions.showContributionLabels}
        showViolin={displayOptions.showViolin}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={showBranding}
        brandingText={showBranding ? getBrandingText() : undefined}
        onYAxisClick={() => setIsEditingLabel(true)}
        onXAxisClick={() => setIsEditingLabel(true)}
        xTickFormat={(val: string) => factorLabels[val] || val}
        highlightedCategories={highlightedCategories}
        onBoxContextMenu={onContextMenu}
      />

      {/* Annotation text overlay — always active (no mode toggle) */}
      {annotations.length > 0 && onAnnotationsChange && (
        <ChartAnnotationLayer
          annotations={annotations}
          onAnnotationsChange={onAnnotationsChange}
          isActive={true}
          categoryPositions={categoryPositions}
          maxWidth={parentWidth * 0.7}
          textColor="var(--color-content-primary, #cbd5e1)"
          fontSize={fonts.statLabel}
        />
      )}

      {isEditingLabel && (
        <AxisEditor
          title="Edit Axis & Categories"
          originalName={factor}
          alias={alias}
          values={data.map(d => d.key)}
          valueLabels={factorLabels}
          onSave={handleSaveAlias}
          onClose={() => setIsEditingLabel(false)}
          style={{ bottom: 10, left: parentWidth / 2 - 120 }}
        />
      )}
    </div>
  );
};

export default withParentSize(Boxplot);
