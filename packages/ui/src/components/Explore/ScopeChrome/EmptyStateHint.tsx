// packages/ui/src/components/Explore/ScopeChrome/EmptyStateHint.tsx
export interface EmptyStateHintProps {
  readonly onNavigateToProcess?: () => void;
}

export function EmptyStateHint({ onNavigateToProcess }: EmptyStateHintProps) {
  return (
    <div
      data-testid="scope-chrome-empty-state-hint"
      className="px-4 py-2 text-sm text-content-muted"
    >
      No outcome selected.{' '}
      <button
        type="button"
        data-testid="empty-state-hint-process-link"
        onClick={() => onNavigateToProcess?.()}
        className="text-content-secondary underline hover:text-content"
      >
        Go to Process tab
      </button>{' '}
      to pick a measure.
    </div>
  );
}
