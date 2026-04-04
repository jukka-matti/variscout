import React from 'react';
import { useProjectStore } from '@variscout/stores';
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
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const setRawData = useProjectStore(s => s.setRawData);

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
