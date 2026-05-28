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
        className={[
          'px-3 py-1.5 rounded bg-blue-500 text-white font-medium',
          landing.isEnabled ? 'hover:bg-blue-600' : 'cursor-not-allowed opacity-50',
        ].join(' ')}
        aria-label="Exit to Explore"
      >
        → Explore
      </button>
      {landing.isEnabled ? (
        <span className="text-xs text-content-muted">{landing.previewText}</span>
      ) : (
        // H1 Task 3: cyan info pill matching SystemHintBanner's visual rhythm.
        // The 💡 emoji is used for consistency with SystemHintBanner's KIND_STYLES
        // convention (existing established pattern in this codebase).
        <span
          data-testid="explore-exit-disabled-hint"
          className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs text-cyan-800"
        >
          <span aria-hidden="true">💡</span>
          Drop a column on Outcome to enable Explore
        </span>
      )}
    </div>
  );
}
