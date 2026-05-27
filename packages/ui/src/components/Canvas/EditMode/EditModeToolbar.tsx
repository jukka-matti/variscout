import React from 'react';

export interface EditModeToolbarProps {
  steps: { id: string; name: string; order: number }[];
  onCaptureStepTimings?: () => void;
}

/**
 * Full-width toolbar row that sits between the EditModeShell header and the
 * 3-column data grid. D1 renders the single "Capture step timings" action;
 * the remaining §4.1 buttons (Goal narrative, Issue / question, → Explore)
 * are hidden until their respective milestones (E1 / F1 / H1).
 */
export const EditModeToolbar: React.FC<EditModeToolbarProps> = ({
  steps,
  onCaptureStepTimings,
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
    </div>
  );
};

export default EditModeToolbar;
