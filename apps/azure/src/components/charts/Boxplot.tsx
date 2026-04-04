/**
 * Azure Boxplot - Thin wrapper that connects stores to shared BoxplotWrapperBase
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData, useAnalysisStats, useCapabilityBoxplotData } from '@variscout/hooks';
import { useChartScale } from '../../hooks/useChartScale';
import { BoxplotWrapperBase } from '@variscout/ui';
import type { HighlightColor } from '@variscout/hooks';
import type { Finding } from '@variscout/core';

interface BoxplotProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  findings?: Finding[];
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
}

const Boxplot = ({ parentWidth, parentHeight, ...props }: BoxplotProps) => {
  const { filteredData } = useFilteredData();
  const { isComputing } = useAnalysisStats();
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const filters = useProjectStore(s => s.filters);
  const setFilters = useProjectStore(s => s.setFilters);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const setColumnAliases = useProjectStore(s => s.setColumnAliases);
  const valueLabels = useProjectStore(s => s.valueLabels);
  const setValueLabels = useProjectStore(s => s.setValueLabels);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
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
