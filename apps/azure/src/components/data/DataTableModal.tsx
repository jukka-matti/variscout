import React from 'react';
import { useProjectStore } from '@variscout/stores';
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
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const setRawData = useProjectStore(s => s.setRawData);

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
