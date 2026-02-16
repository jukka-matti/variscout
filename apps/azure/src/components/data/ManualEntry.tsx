import { ManualEntryBase, type ManualEntryConfig } from '@variscout/ui';

export type { ManualEntryConfig };

interface ManualEntryProps {
  onAnalyze: (data: any[], config: ManualEntryConfig) => void;
  onCancel: () => void;
  appendMode?: boolean;
  existingConfig?: ManualEntryConfig;
  existingRowCount?: number;
}

const ManualEntry = (props: ManualEntryProps) => (
  <ManualEntryBase enablePerformanceMode {...props} />
);

export default ManualEntry;
