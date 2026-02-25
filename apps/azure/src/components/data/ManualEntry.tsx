import { ManualEntryBase, type ManualEntryConfig } from '@variscout/ui';
import type { DataRow } from '@variscout/core';

export type { ManualEntryConfig };

interface ManualEntryProps {
  onAnalyze: (data: DataRow[], config: ManualEntryConfig) => void;
  onCancel: () => void;
  appendMode?: boolean;
  existingConfig?: ManualEntryConfig;
  existingRowCount?: number;
}

const ManualEntry = (props: ManualEntryProps) => (
  <ManualEntryBase enablePerformanceMode {...props} />
);

export default ManualEntry;
