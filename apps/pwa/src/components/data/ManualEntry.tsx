import { ManualEntryBase, type ManualEntryConfig } from '@variscout/ui';
import type { DataRow } from '@variscout/core';

export type { ManualEntryConfig };

interface ManualEntryProps {
  onAnalyze: (data: DataRow[], config: ManualEntryConfig) => void;
  onCancel: () => void;
}

const ManualEntry = ({ onAnalyze, onCancel }: ManualEntryProps) => (
  <ManualEntryBase onAnalyze={onAnalyze} onCancel={onCancel} />
);

export default ManualEntry;
