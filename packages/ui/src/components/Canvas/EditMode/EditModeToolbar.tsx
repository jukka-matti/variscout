import React from 'react';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type {
  ImprovementProjectFactorControl,
  ProcessStepEntry,
} from '@variscout/core/improvementProject';
import type { ExploreLandingView } from '@variscout/core/exploreRouting';
import { ExploreExitButton } from './ExploreExitButton';

export interface EditModeToolbarProps {
  steps: { id: string; name: string; order: number }[];
  onCaptureStepTimings?: () => void;
  /**
   * F1 Task 3: outcome specs threaded from the calling app (ProcessHub.outcomes).
   * Controls whether the → Explore button is enabled. Defaults to [].
   */
  outcomeSpecs?: OutcomeSpec[];
  /**
   * F1 Task 3: factor controls from activeIP.goal.factorControls.
   * Drives the explore route key (y-only vs y-plus-one-factor vs y-plus-multi-factor).
   * Defaults to [].
   */
  factorControls?: ImprovementProjectFactorControl[];
  /**
   * F1 Task 3: process steps derived from the canonical ProcessMap
   * (via deriveProcessSteps — ADR-087). Drives the y-plus-process route key.
   * Defaults to [].
   */
  processSteps?: ProcessStepEntry[];
  /**
   * F1 Task 3: categorical values per column from the categoricalValuesByColumn
   * useMemo in CanvasWorkspace. Drives D3-derived factor detection. Defaults to {}.
   */
  categoricalValuesByColumn?: Record<string, (string | null)[]>;
  /**
   * F1 Task 3: called when the user confirms the → Explore exit.
   * Task 3 wires a console.warn stub in CanvasWorkspace; Task 4 adds
   * panelsStore.showExplore(intent); Task 6 completes the real navigation.
   * No-op default so existing fixtures + wrappers that don't pass this prop
   * are never broken.
   */
  onExploreExit?: (landing: ExploreLandingView) => void;
}

/**
 * Full-width toolbar row that sits between the inlined edit chrome header and the
 * 3-column data grid. D1 renders the "Capture step timings" action; F1 adds
 * the → Explore exit button at the right edge.
 *
 * The remaining §4.1 buttons (Goal narrative, Issue / question) are hidden
 * until their respective milestones (E1 / H1).
 */
export const EditModeToolbar: React.FC<EditModeToolbarProps> = ({
  steps,
  onCaptureStepTimings,
  outcomeSpecs = [],
  factorControls = [],
  processSteps = [],
  categoricalValuesByColumn = {},
  onExploreExit,
}) => {
  const hasSteps = steps.length > 0;

  return (
    <div
      role="toolbar"
      aria-label="Edit mode toolbar"
      className="flex items-center gap-2 border-b border-edge bg-surface-secondary px-4 py-1.5"
    >
      <button
        type="button"
        disabled={!hasSteps}
        title={hasSteps ? undefined : 'Add steps first'}
        onClick={hasSteps ? onCaptureStepTimings : undefined}
        className={[
          'rounded-md border border-edge bg-surface-primary px-3 py-1 text-xs font-medium text-content',
          hasSteps ? 'hover:bg-surface-tertiary' : 'cursor-not-allowed opacity-50',
        ].join(' ')}
      >
        + Capture step timings
      </button>

      <div className="ml-auto">
        <ExploreExitButton
          outcomeSpecs={outcomeSpecs}
          factorControls={factorControls}
          processSteps={processSteps}
          categoricalValuesByColumn={categoricalValuesByColumn}
          onExit={onExploreExit ?? (() => {})}
        />
      </div>
    </div>
  );
};

export default EditModeToolbar;
