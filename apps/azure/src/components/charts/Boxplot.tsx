/**
 * Azure Boxplot - Thin wrapper around shared @variscout/charts BoxplotBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Computes BoxplotGroupData[] from filtered data
 * 3. Manages Azure-specific UI (axis label editing)
 * 4. Supports annotations (highlight colors + text overlay via right-click)
 * 5. Passes everything to shared BoxplotBase
 */
import React, { useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { BoxplotBase, getScaledFonts } from '@variscout/charts';
import { ChartAnnotationLayer, AxisEditor } from '@variscout/ui';
import { useBoxplotData, useBoxplotWrapperData } from '@variscout/hooks';
import { sortBoxplotData } from '@variscout/core';
import type { HighlightColor, ChartAnnotation } from '@variscout/hooks';

interface BoxplotProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  variationPct?: number;
  categoryContributions?: Map<string | number, number>;
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
  const effectiveSpecs = displayOptions.showSpecs !== false ? specs : {};
  const rawData = useBoxplotData(filteredData, factor, outcome);
  const data = sortBoxplotData(
    rawData,
    displayOptions.boxplotSortBy,
    displayOptions.boxplotSortDirection
  );

  const { categoryPositions, effectiveHighlights } = useBoxplotWrapperData({
    data,
    specs,
    displayOptions,
    parentWidth,
    highlightedCategories,
  });

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

  if (!outcome || data.length === 0) return null;

  const alias = columnAliases[factor] || factor;
  const factorLabels = valueLabels[factor] || {};
  const selectedGroups = (filters[factor] || []).map(String);
  const fonts = getScaledFonts(parentWidth);

  return (
    <div className="relative w-full h-full">
      <BoxplotBase
        data={data}
        specs={effectiveSpecs}
        showViolin={displayOptions.showViolin}
        showContributionLabels={displayOptions.showContributionLabels}
        categoryContributions={categoryContributions}
        yAxisLabel={columnAliases[outcome] || outcome}
        xAxisLabel={alias}
        yDomainOverride={{ min, max }}
        selectedGroups={selectedGroups}
        onBoxClick={handleBoxClick}
        sampleSize={filteredData.length}
        variationPct={variationPct}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={false}
        onYAxisClick={() => setIsEditingLabel(true)}
        onXAxisClick={() => setIsEditingLabel(true)}
        xTickFormat={(val: string) => factorLabels[val] || val}
        highlightedCategories={effectiveHighlights}
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
