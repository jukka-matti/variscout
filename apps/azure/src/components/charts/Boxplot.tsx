/**
 * Azure Boxplot - Thin wrapper that connects stores to shared BoxplotWrapperBase
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData, useCapabilityBoxplotData } from '@variscout/hooks';
import { useChartScale } from '../../hooks/useChartScale';
import { BoxplotWrapperBase } from '@variscout/ui';
import type { HighlightColor } from '@variscout/hooks';
import type { DataRow, Finding } from '@variscout/core';
import { resolveCpkTarget } from '@variscout/core/capability';

interface BoxplotProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  /** ER-4 (D6): neutral group click — host sets transient highlight + shows the pill. */
  onGroupClick?: (factor: string, level: string | number) => void;
  /** ER-4 tier-2: transient highlight level for THIS factor — dims other categories. */
  transientHighlightLevel?: string;
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  findings?: Finding[];
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
  /** Passed from parent Dashboard to avoid duplicate Worker dispatch per chart wrapper */
  isComputing?: boolean;
  /** Override filtered data (e.g., defect mode transformed data) */
  dataOverride?: DataRow[];
  /** Override outcome column (e.g., defect mode outcome) */
  outcomeOverride?: string;
  /**
   * G1 Task 4: derived categorical columns from the active ImprovementProject.
   * Passed through to BoxplotWrapperBase → useBoxplotData for derived factor grouping.
   *
   * ALIGNMENT (G1 Task 4 follow-up): values MUST be parallel to `filteredData`
   * (filtered-row aligned, NOT raw-row aligned). The caller in Editor.tsx
   * projects via `filterCategoricalValuesByColumn` at the `useFilteredData`
   * boundary.
   *
   * Caveat: when `dataOverride` is supplied (e.g. defect mode), the channel
   * remains aligned to the original `filteredData`, not the override — same
   * pre-existing fragility as before this fix. Defect mode currently uses raw
   * factor columns, so this doesn't bite in practice today.
   */
  categoricalValuesByColumn?: Record<string, (string | null)[]>;
}

const Boxplot = ({
  parentWidth,
  parentHeight,
  isComputing = false,
  dataOverride,
  outcomeOverride,
  ...props
}: BoxplotProps) => {
  const { filteredData: storeData } = useFilteredData();
  const filteredData = dataOverride ?? storeData;
  const storeOutcome = useProjectStore(s => s.outcome);
  const outcome = outcomeOverride ?? storeOutcome;
  const specs = useProjectStore(s => s.specs);
  const filters = useProjectStore(s => s.filters);
  const setFilters = useProjectStore(s => s.setFilters);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const setColumnAliases = useProjectStore(s => s.setColumnAliases);
  const valueLabels = useProjectStore(s => s.valueLabels);
  const setValueLabels = useProjectStore(s => s.setValueLabels);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const { value: cpkTarget } = resolveCpkTarget(outcome ?? '', {
    measureSpecs,
    projectCpkTarget,
  });
  const { min, max } = useChartScale();

  const isCapabilityMode = displayOptions.standardIChartMetric === 'capability';

  const capabilityData = useCapabilityBoxplotData({
    filteredData,
    outcome: outcome ?? '',
    specs,
    subgroupConfig,
    factor: props.factor,
    metric: 'cpk',
  });

  return (
    <div className="relative h-full w-full">
      <BoxplotWrapperBase
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        filteredData={filteredData}
        outcome={outcome}
        specs={isCapabilityMode ? {} : specs}
        filters={filters}
        onFiltersChange={setFilters}
        columnAliases={columnAliases}
        onColumnAliasesChange={setColumnAliases}
        valueLabels={valueLabels}
        onValueLabelsChange={setValueLabels}
        displayOptions={displayOptions}
        yDomainMin={isCapabilityMode ? 0 : min}
        yDomainMax={isCapabilityMode ? 0 : max}
        showBranding={false}
        capabilityData={isCapabilityMode ? capabilityData : undefined}
        isCapabilityMode={isCapabilityMode}
        cpkTarget={cpkTarget}
        {...props}
      />
      {isComputing && (
        <div className="absolute inset-0 bg-surface-primary/30 pointer-events-none transition-opacity duration-200" />
      )}
    </div>
  );
};

export default withParentSize(Boxplot);
