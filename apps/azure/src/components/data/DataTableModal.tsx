import React from 'react';
import { useData } from '../../context/DataContext';
import { DataTableModalBase } from '@variscout/ui';
import type { ExclusionReason } from '@variscout/core';

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRowIndex?: number;
  excludedRowIndices?: Set<number>;
  excludedReasons?: Map<number, ExclusionReason[]>;
  controlViolations?: Map<number, string[]>;
}

const DataTableModal: React.FC<DataTableModalProps> = props => {
  const { rawData, outcome, specs, columnAliases, setRawData } = useData();

  return (
    <DataTableModalBase
      {...props}
      rawData={rawData}
      outcome={outcome}
      specs={specs}
      columnAliases={columnAliases}
      onApply={setRawData}
    />
  );
};

export default DataTableModal;
