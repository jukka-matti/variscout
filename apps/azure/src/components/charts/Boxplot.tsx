/**
 * Azure Boxplot - Thin wrapper that connects DataContext to shared BoxplotWrapperBase
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { BoxplotWrapperBase } from '@variscout/ui';
import { useCapabilityBoxplotData } from '@variscout/hooks';
import type { HighlightColor } from '@variscout/hooks';
import type { Finding } from '@variscout/core';

interface BoxplotProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  variationPct?: number;
  categoryContributions?: Map<string | number, number>;
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  findings?: Finding[];
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
}

const Boxplot = ({ parentWidth, parentHeight, ...props }: BoxplotProps) => {
  const ctx = useData();
  const { min, max } = useChartScale();

  const isCapabilityMode = ctx.displayOptions.standardIChartMetric === 'capability';

  const capabilityData = useCapabilityBoxplotData({
    filteredData: ctx.filteredData,
    outcome: ctx.outcome ?? '',
    specs: ctx.specs,
    subgroupConfig: ctx.subgroupConfig,
    factor: props.factor,
    metric: 'cpk',
  });

  return (
    <div className="relative h-full w-full">
      <BoxplotWrapperBase
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        filteredData={ctx.filteredData}
        outcome={ctx.outcome}
        specs={isCapabilityMode ? {} : ctx.specs}
        filters={ctx.filters}
        onFiltersChange={ctx.setFilters}
        columnAliases={ctx.columnAliases}
        onColumnAliasesChange={ctx.setColumnAliases}
        valueLabels={ctx.valueLabels}
        onValueLabelsChange={ctx.setValueLabels}
        displayOptions={
          isCapabilityMode
            ? { ...ctx.displayOptions, showContributionLabels: false }
            : ctx.displayOptions
        }
        yDomainMin={isCapabilityMode ? 0 : min}
        yDomainMax={isCapabilityMode ? 0 : max}
        showBranding={false}
        capabilityData={isCapabilityMode ? capabilityData : undefined}
        isCapabilityMode={isCapabilityMode}
        cpkTarget={ctx.cpkTarget}
        {...props}
      />
      {ctx.isComputing && (
        <div className="absolute inset-0 bg-surface-primary/30 pointer-events-none transition-opacity duration-200" />
      )}
    </div>
  );
};

export default withParentSize(Boxplot);
