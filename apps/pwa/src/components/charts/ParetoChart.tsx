/**
 * PWA ParetoChart - Thin wrapper that connects stores to shared ParetoChartWrapperBase
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData } from '@variscout/hooks';
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
  /** Passed from parent Dashboard to avoid duplicate Worker dispatch per chart wrapper */
  isComputing?: boolean;
}

const ParetoChart = ({
  parentWidth,
  parentHeight,
  isComputing = false,
  ...props
}: ParetoChartProps) => {
  const rawData = useProjectStore(s => s.rawData);
  const { filteredData } = useFilteredData();
  const outcome = useProjectStore(s => s.outcome);
  const filters = useProjectStore(s => s.filters);
  const setFilters = useProjectStore(s => s.setFilters);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const setColumnAliases = useProjectStore(s => s.setColumnAliases);
  const paretoMode = useProjectStore(s => s.paretoMode);
  const separateParetoData = useProjectStore(s => s.separateParetoData);

  return (
    <div className="relative h-full w-full">
      <ParetoChartWrapperBase
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        rawData={rawData}
        filteredData={filteredData}
        outcome={outcome}
        filters={filters}
        onFiltersChange={setFilters}
        columnAliases={columnAliases}
        onColumnAliasesChange={setColumnAliases}
        paretoMode={paretoMode}
        separateParetoData={separateParetoData}
        {...props}
      />
      {isComputing && (
        <div className="absolute inset-0 bg-surface-primary/30 pointer-events-none transition-opacity duration-200" />
      )}
    </div>
  );
};

export default withParentSize(ParetoChart);
