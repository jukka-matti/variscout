/**
 * EmptyState — shown on the Investigation Wall when no hubs exist yet.
 *
 * Presents three entry points for starting an investigation:
 *   1. Write a suspected mechanism directly.
 *   2. Promote an existing question into branch work.
 *   3. Seed mechanism branches from Factor Intelligence.
 */

import React from 'react';
import { getMessage } from '@variscout/core/i18n';
import { useWallLocale } from './hooks/useWallLocale';

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
  const locale = useWallLocale();
  return (
    <section
      aria-label={getMessage(locale, 'wall.empty.ariaLabel')}
      className="flex flex-col items-center justify-center gap-4 p-8"
    >
      <h2 className="text-lg font-semibold text-content">
        {getMessage(locale, 'wall.empty.title')}
      </h2>
      <p className="text-xs text-content-muted">{getMessage(locale, 'wall.empty.subtitle')}</p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          type="button"
          onClick={onWriteHypothesis}
          className="rounded bg-surface-secondary border border-edge px-3 py-2 text-sm text-content hover:bg-surface"
        >
          {getMessage(locale, 'wall.empty.writeHypothesis')}
        </button>
        <button
          type="button"
          onClick={onPromoteFromQuestion}
          className="rounded bg-surface-secondary border border-edge px-3 py-2 text-sm text-content hover:bg-surface"
        >
          {getMessage(locale, 'wall.empty.promoteFromQuestion')}
        </button>
        <button
          type="button"
          onClick={onSeedFromFactorIntel}
          className="rounded bg-surface-secondary border border-edge px-3 py-2 text-sm text-content hover:bg-surface"
        >
          {getMessage(locale, 'wall.empty.seedFromFactorIntel')}
        </button>
      </div>
    </section>
  );
};
