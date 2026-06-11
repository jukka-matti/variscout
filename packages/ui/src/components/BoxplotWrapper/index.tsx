/**
 * BoxplotWrapperBase - Shared Boxplot wrapper for PWA and Azure apps
 *
 * Contains all rendering logic:
 * - Computes boxplot data via useBoxplotData
 * - Sorts via sortBoxplotData
 * - Computes category positions via useBoxplotWrapperData
 * - Manages axis editor state
 * - Renders BoxplotBase + ChartAnnotationLayer + AxisEditor
 * - Optional branding via showBranding prop (apps decide; default off)
 *
 * Each app keeps a thin wrapper that calls useData() + useChartScale()
 * and spreads the result as props.
 */
import React, { useState } from 'react';
import { BoxplotBase, getScaledFonts, chartColors } from '@variscout/charts';
import { useBoxplotData, useBoxplotWrapperData } from '@variscout/hooks';
import { sortBoxplotData } from '@variscout/core';
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
    'showSpecs' | 'boxplotSortBy' | 'boxplotSortDirection' | 'showViolin'
  >;
  /** Y-axis domain override from useChartScale */
  yDomainMin: number;
  yDomainMax: number;
  /** Drill-down callback (overrides filter toggle when provided) */
  onDrillDown?: (factor: string, value: string) => void;
  /** Visible capture affordance callback for a category. */
  onCaptureCategory?: (factor: string, value: string) => void;
  /**
   * ER-4 (D6/Principle 6) — neutral group-click handler. When provided, a box
   * click no longer commits a drill or toggles a filter: it fires
   * `onGroupClick(factor, level)` so the host can set a TRANSIENT highlight + show
   * the condition pill (commit is explicit, via the pill's actions). Takes
   * precedence over the legacy `onDrillDown` / filter-toggle path. When ABSENT the
   * legacy click behaviour is preserved (focused views, mobile, embed).
   */
  onGroupClick?: (factor: string, level: string | number) => void;
  /** Render the VariScout source-bar branding when true. Defaults to false. */
  showBranding?: boolean;
  /** Branding text (only used when showBranding=true). Defaults to "VariScout Lite". */
  brandingText?: string;
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
  /**
   * G1 Task 4: derived categorical columns from the active ImprovementProject.
   * When `factor` refers to a derived column (e.g. `Reactor_temp_bin`), the raw
   * `filteredData` rows won't carry that key. This map provides the derived values
   * so useBoxplotData can augment the rows before grouping.
   *
   * ALIGNMENT INVARIANT (G1 Task 4 follow-up): values MUST be parallel to
   * `filteredData` — `categoricalValuesByColumn[col][i]` is the derived value for
   * `filteredData[i]`. The Azure caller projects the rawData-aligned channel onto
   * the filtered subset via `filterCategoricalValuesByColumn(cvc, filteredIndexMap)`
   * at the `useFilteredData` boundary before threading it down (see Editor.tsx).
   *
   * Backward compat: absent or empty → identical to before.
   */
  categoricalValuesByColumn?: Record<string, (string | null)[]>;
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
  onCaptureCategory,
  onGroupClick,
  showBranding: showBrandingProp,
  brandingText: brandingTextProp,
  highlightedCategories,
  onContextMenu,
  findings = [],
  onEditFinding,
  onDeleteFinding,
  capabilityData,
  isCapabilityMode,
  cpkTarget,
  categoricalValuesByColumn,
}: BoxplotWrapperBaseProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const { data: rawData, violinData } = useBoxplotData(
    filteredData,
    factor,
    outcome,
    displayOptions.showViolin,
    undefined, // stageColumn
    undefined, // stageOrder
    categoricalValuesByColumn
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
    // ER-4 (D6): the neutral group-click path. When the host supplies
    // `onGroupClick`, a click NEVER commits a filter/drill — it only sets the
    // transient highlight + opens the condition pill (commit is explicit). The
    // legacy filter-toggle / drill path is preserved ONLY when `onGroupClick` is
    // absent (focused views, mobile, embed callers that haven't migrated).
    if (onGroupClick) {
      onGroupClick(factor, key);
      return;
    }
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
  const showBranding = showBrandingProp ?? false;
  const brandingText = brandingTextProp ?? 'VariScout Lite';
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
        onBoxCapture={key => onCaptureCategory?.(factor, key)}
        sampleSize={filteredData.length}
        showViolin={displayOptions.showViolin}
        violinData={violinData}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={showBranding}
        brandingText={showBranding ? brandingText : undefined}
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
