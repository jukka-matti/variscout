export interface NewSnapshotsChipProps {
  count: number;
  onClick: () => void;
}

export function NewSnapshotsChip({ count, onClick }: NewSnapshotsChipProps) {
  if (count === 0) return null;
  return (
    <button
      type="button"
      data-testid="new-snapshots-chip"
      onClick={onClick}
      className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs rounded hover:bg-green-200"
    >
      {count} new snapshot{count > 1 ? 's' : ''} ↑
    </button>
  );
}
