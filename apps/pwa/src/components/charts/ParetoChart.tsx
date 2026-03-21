/**
 * PWA ParetoChart - Thin wrapper that connects DataContext to shared ParetoChartWrapperBase
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { ParetoChartWrapperBase } from '@variscout/ui';
import type { HighlightColor } from '@variscout/hooks';
import type { Finding } from '@variscout/core';

interface ParetoChartProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  showComparison?: boolean;
  onToggleComparison?: () => void;
  onHide?: () => void;
  onUploadPareto?: () => void;
  availableFactors?: string[];
  aggregation?: 'count' | 'value';
  onToggleAggregation?: () => void;
  showBranding?: boolean;
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  findings?: Finding[];
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
}

const ParetoChart = ({ parentWidth, parentHeight, ...props }: ParetoChartProps) => {
  const ctx = useData();

  return (
    <div className="relative h-full w-full">
      <ParetoChartWrapperBase
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        rawData={ctx.rawData}
        filteredData={ctx.filteredData}
        outcome={ctx.outcome}
        filters={ctx.filters}
        onFiltersChange={ctx.setFilters}
        columnAliases={ctx.columnAliases}
        onColumnAliasesChange={ctx.setColumnAliases}
        paretoMode={ctx.paretoMode}
        separateParetoData={ctx.separateParetoData}
        {...props}
      />
      {ctx.isComputing && (
        <div className="absolute inset-0 bg-surface-primary/30 pointer-events-none transition-opacity duration-200" />
      )}
    </div>
  );
};

export default withParentSize(ParetoChart);
