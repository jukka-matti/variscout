/**
 * EmptyState — shown on the Investigation Wall when no hubs exist yet.
 *
 * Presents three entry points for starting an investigation:
 *   1. Write a hypothesis directly.
 *   2. Promote an existing question to a hypothesis.
 *   3. Seed hubs from Factor Intelligence.
 */

import React from 'react';

export interface EmptyStateProps {
  onWriteHypothesis?: () => void;
  onPromoteFromQuestion?: () => void;
  onSeedFromFactorIntel?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onWriteHypothesis,
  onPromoteFromQuestion,
  onSeedFromFactorIntel,
}) => {
  return (
    <section
      aria-label="Investigation Wall empty state"
      className="flex flex-col items-center justify-center gap-4 p-8"
    >
      <h2 className="text-lg font-semibold text-content">Start with a hypothesis</h2>
      <p className="text-xs text-content-muted">Three ways to begin:</p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          type="button"
          onClick={onWriteHypothesis}
          className="rounded bg-surface-secondary border border-edge px-3 py-2 text-sm text-content hover:bg-surface"
        >
          Write one
        </button>
        <button
          type="button"
          onClick={onPromoteFromQuestion}
          className="rounded bg-surface-secondary border border-edge px-3 py-2 text-sm text-content hover:bg-surface"
        >
          Promote from a question
        </button>
        <button
          type="button"
          onClick={onSeedFromFactorIntel}
          className="rounded bg-surface-secondary border border-edge px-3 py-2 text-sm text-content hover:bg-surface"
        >
          Seed 3 from Factor Intelligence
        </button>
      </div>
    </section>
  );
};
