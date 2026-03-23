import React from 'react';
import { DataPanelBase } from '@variscout/ui';
import { useData } from '../../context/DataContext';
import type { ExclusionReason } from '@variscout/core';

interface DataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRowIndex?: number | null;
  onRowClick?: (index: number) => void;
  excludedRowIndices?: Set<number>;
  excludedReasons?: Map<number, ExclusionReason[]>;
  controlViolations?: Map<number, string[]>;
  /** Selected point indices for multi-point selection (Phase 3: Brushing) */
  selectedIndices?: Set<number>;
  /** Callback to toggle a point in/out of selection */
  onToggleSelection?: (index: number) => void;
}

const DataPanel: React.FC<DataPanelProps> = props => {
  const { filteredData, rawData, outcome, specs, columnAliases, filters } = useData();

  return (
    <DataPanelBase
      {...props}
      data={filteredData}
      rawData={rawData}
      outcome={outcome}
      specs={specs}
      columnAliases={columnAliases}
      filters={filters}
      storageKey="variscout-data-panel-width"
    />
  );
};

export default DataPanel;
