import { ManualEntryBase, type ManualEntryConfig } from '@variscout/ui';

export type { ManualEntryConfig };

interface ManualEntryProps {
  onAnalyze: (data: any[], config: ManualEntryConfig) => void;
  onCancel: () => void;
}

const ManualEntry = ({ onAnalyze, onCancel }: ManualEntryProps) => (
  <ManualEntryBase onAnalyze={onAnalyze} onCancel={onCancel} />
);

export default ManualEntry;
