import * as React from 'react';
import {
  deriveExploreLandingView,
  type DeriveExploreLandingViewInput,
  type ExploreLandingView,
} from '@variscout/core/exploreRouting';

export interface ExploreExitButtonProps {
  outcomeSpecs: DeriveExploreLandingViewInput['outcomeSpecs'];
  factorControls: DeriveExploreLandingViewInput['factorControls'];
  processSteps: DeriveExploreLandingViewInput['processSteps'];
  categoricalValuesByColumn: DeriveExploreLandingViewInput['categoricalValuesByColumn'];
  onExit: (landing: ExploreLandingView) => void;
}

export function ExploreExitButton(props: ExploreExitButtonProps): React.ReactElement {
  const { outcomeSpecs, factorControls, processSteps, categoricalValuesByColumn, onExit } = props;

  const landing = React.useMemo(
    () =>
      deriveExploreLandingView({
        outcomeSpecs,
        factorControls,
        processSteps,
        categoricalValuesByColumn,
      }),
    [outcomeSpecs, factorControls, processSteps, categoricalValuesByColumn]
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={!landing.isEnabled}
        onClick={() => {
          if (landing.isEnabled) onExit(landing);
        }}
        className={
          landing.isEnabled
            ? 'px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium'
            : 'px-3 py-1.5 rounded bg-surface-secondary text-content-muted cursor-not-allowed'
        }
        aria-label="Exit to Explore"
      >
        → Explore
      </button>
      {!landing.isEnabled && (
        <span className="text-xs text-content-muted">Set an outcome to unlock Explore</span>
      )}
      {landing.isEnabled && (
        <span className="text-xs text-content-muted">{landing.previewText}</span>
      )}
    </div>
  );
}
