import React from 'react';
import { useData } from '../../context/DataContext';
import { DataTableModalBase } from '@variscout/ui';
import type { ExclusionReason } from '@variscout/core';

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRowIndex?: number;
  showExcludedOnly?: boolean;
  excludedRowIndices?: Set<number>;
  excludedReasons?: Map<number, ExclusionReason[]>;
}

const DataTableModal = ({ showExcludedOnly = false, ...props }: DataTableModalProps) => {
  const { rawData, outcome, specs, setRawData } = useData();

  return (
    <DataTableModalBase
      {...props}
      rawData={rawData}
      outcome={outcome}
      specs={specs}
      onApply={setRawData}
      initialFilterExcluded={showExcludedOnly}
    />
  );
};

export default DataTableModal;
