import React from 'react';

export interface DurabilityNudgeProps {
  verb: 'Save' | 'Export';
  onDismiss: () => void;
}

export function DurabilityNudge({ verb, onDismiss }: DurabilityNudgeProps): React.JSX.Element {
  return (
    <div
      role="status"
      className="mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
    >
      <span>Finding saved. {verb} this investigation so you can come back to it.</span>
      <button type="button" className="font-semibold underline" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
