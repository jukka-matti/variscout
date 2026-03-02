/**
 * PWA Boxplot - Thin wrapper that connects DataContext to shared BoxplotWrapperBase
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { BoxplotWrapperBase } from '@variscout/ui';
import type { HighlightColor } from '@variscout/hooks';
import type { Finding } from '@variscout/core';

interface BoxplotProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  variationPct?: number;
  categoryContributions?: Map<string | number, number>;
  showBranding?: boolean;
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  findings?: Finding[];
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
}

const Boxplot = ({ parentWidth, parentHeight, ...props }: BoxplotProps) => {
  const ctx = useData();
  const { min, max } = useChartScale();

  return (
    <BoxplotWrapperBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      filteredData={ctx.filteredData}
      outcome={ctx.outcome}
      specs={ctx.specs}
      filters={ctx.filters}
      onFiltersChange={ctx.setFilters}
      columnAliases={ctx.columnAliases}
      onColumnAliasesChange={ctx.setColumnAliases}
      valueLabels={ctx.valueLabels}
      onValueLabelsChange={ctx.setValueLabels}
      displayOptions={ctx.displayOptions}
      yDomainMin={min}
      yDomainMax={max}
      {...props}
    />
  );
};

export default withParentSize(Boxplot);
