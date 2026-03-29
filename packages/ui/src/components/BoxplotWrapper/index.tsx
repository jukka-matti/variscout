/**
 * BoxplotWrapperBase - Shared Boxplot wrapper for PWA and Azure apps
 *
 * Contains all rendering logic:
 * - Computes boxplot data via useBoxplotData
 * - Sorts via sortBoxplotData
 * - Computes category positions via useBoxplotWrapperData
 * - Manages axis editor state
 * - Renders BoxplotBase + ChartAnnotationLayer + AxisEditor
 * - Tier-aware branding via shouldShowBranding()
 *
 * Each app keeps a thin wrapper that calls useData() + useChartScale()
 * and spreads the result as props.
 */
import React, { useState } from 'react';
import { BoxplotBase, getScaledFonts, chartColors } from '@variscout/charts';
import { useBoxplotData, useBoxplotWrapperData } from '@variscout/hooks';
import { sortBoxplotData, shouldShowBranding, getBrandingText } from '@variscout/core';
import { ChartAnnotationLayer } from '../ChartAnnotationLayer';
import { AxisEditor } from '../AxisEditor';
import type { DataRow, SpecLimits, Finding } from '@variscout/core';
import type { HighlightColor, DisplayOptions } from '@variscout/hooks';

export interface BoxplotWrapperBaseProps {
  parentWidth: number;
  parentHeight: number;
  /** Factor column to group by */
  factor: string;
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Outcome column name */
  outcome: string | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Current filter selections */
  filters: Record<string, (string | number)[]>;
  /** Callback to update filters */
  onFiltersChange: (filters: Record<string, (string | number)[]>) => void;
  /** Column display aliases */
  columnAliases: Record<string, string>;
  /** Callback to update aliases */
  onColumnAliasesChange: (aliases: Record<string, string>) => void;
  /** Value labels for categories */
  valueLabels: Record<string, Record<string, string>>;
  /** Callback to update value labels */
  onValueLabelsChange: (labels: Record<string, Record<string, string>>) => void;
  /** Display options */
  displayOptions: Pick<
    DisplayOptions,
    'showSpecs' | 'boxplotSortBy' | 'boxplotSortDirection' | 'showContributionLabels' | 'showViolin'
  >;
  /** Y-axis domain override from useChartScale */
  yDomainMin: number;
  yDomainMax: number;
  /** Drill-down callback (overrides filter toggle when provided) */
  onDrillDown?: (factor: string, value: string) => void;
  /** Variation percentage for this factor */
  variationPct?: number;
  /** Category-level contribution values */
  categoryContributions?: Map<string | number, number>;
  /** Override branding display (undefined = auto-detect via tier) */
  showBranding?: boolean;
  /** Annotation highlights */
  highlightedCategories?: Record<string, HighlightColor>;
  /** Context menu callback for annotations */
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  /** Findings linked to this chart (rendered as annotation boxes) */
  findings?: Finding[];
  /** Edit a finding's text from the annotation box */
  onEditFinding?: (id: string, text: string) => void;
  /** Delete a finding from the annotation box */
  onDeleteFinding?: (id: string) => void;
  /** Capability mode boxplot data (Cpk/Cp per subgroup, overrides standard data) */
  capabilityData?: import('@variscout/core').BoxplotGroupData[];
  /** Whether boxplot is in capability mode (Cpk distribution) */
  isCapabilityMode?: boolean;
  /** Cpk target value for reference line in capability mode */
  cpkTarget?: number;
}

export const BoxplotWrapperBase = ({
  parentWidth,
  parentHeight,
  factor,
  filteredData,
  outcome,
  specs,
  filters,
  onFiltersChange,
  columnAliases,
  onColumnAliasesChange,
  valueLabels,
  onValueLabelsChange,
  displayOptions,
  yDomainMin,
  yDomainMax,
  onDrillDown,
  variationPct,
  categoryContributions,
  showBranding: showBrandingProp,
  highlightedCategories,
  onContextMenu,
  findings = [],
  onEditFinding,
  onDeleteFinding,
  capabilityData,
  isCapabilityMode,
  cpkTarget,
}: BoxplotWrapperBaseProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const { data: rawData, violinData } = useBoxplotData(
    filteredData,
    factor,
    outcome,
    displayOptions.showViolin
  );
  const standardData = sortBoxplotData(
    rawData,
    displayOptions.boxplotSortBy,
    displayOptions.boxplotSortDirection
  );
  // In capability mode, use pre-computed Cpk boxplot data
  const data = capabilityData && capabilityData.length > 0 ? capabilityData : standardData;

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
      onFiltersChange({ ...filters, [factor]: newFilters });
    }
  };

  const handleSaveAlias = (newAlias: string, newValueLabels?: Record<string, string>) => {
    onColumnAliasesChange({ ...columnAliases, [factor]: newAlias });
    if (newValueLabels) {
      onValueLabelsChange({ ...valueLabels, [factor]: newValueLabels });
    }
  };

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
        specs={displayOptions.showSpecs !== false ? specs : {}}
        yAxisLabel={isCapabilityMode ? 'Cpk' : columnAliases[outcome] || outcome}
        xAxisLabel={alias}
        yDomainOverride={{ min: yDomainMin, max: yDomainMax }}
        selectedGroups={selectedGroups}
        onBoxClick={handleBoxClick}
        sampleSize={filteredData.length}
        variationPct={variationPct}
        categoryContributions={categoryContributions}
        showContributionLabels={displayOptions.showContributionLabels}
        showViolin={displayOptions.showViolin}
        violinData={violinData}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={showBranding}
        brandingText={showBranding ? getBrandingText() : undefined}
        onYAxisClick={() => setIsEditingLabel(true)}
        onXAxisClick={() => setIsEditingLabel(true)}
        xTickFormat={(val: string) => factorLabels[val] || val}
        highlightedCategories={effectiveHighlights}
        onBoxContextMenu={onContextMenu}
        targetLine={
          isCapabilityMode && cpkTarget !== undefined
            ? {
                value: cpkTarget,
                color: chartColors.target,
                label: `Target ${cpkTarget}`,
              }
            : undefined
        }
      />

      {findings.length > 0 && onEditFinding && onDeleteFinding && (
        <ChartAnnotationLayer
          findings={findings}
          onEditFinding={onEditFinding}
          onDeleteFinding={onDeleteFinding}
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
