import React, { useState, useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import type { TimeDecompositionBinding } from '@variscout/core';

export interface TimeAsFactorsModalProps {
  /** Pre-selected source column (e.g. from a column's kebab menu). */
  sourceColumn?: string;
  /** Date-kind column names available in the canvas palette. */
  timeColumns: string[];
  /** Pre-existing binding — opens directly at Step 2 with the source column locked. */
  existingBinding?: TimeDecompositionBinding;
  /** Raw row dictionaries for any future preview work (Task 5+). */
  rows: Record<string, unknown>[];
  /** Called with the completed binding. */
  onSave: (binding: TimeDecompositionBinding) => void;
  /** Called on Escape + backdrop click + Cancel button. */
  onClose: () => void;
}

/**
 * TimeAsFactorsModal — Task 4 skeleton + Step 1 column radio + empty state.
 *
 * Mirrors CalculatedColumnModal / StepTimingsModal for the shell (FocusTrap +
 * fixed backdrop + Escape + click-outside close). Two-step flow:
 *
 * Step 1 — Pick a time column (radio group). "Next" gated on selection.
 * Step 2 — Placeholder body (Task 5 fills in dimension pickers).
 *
 * Bypass rules:
 * - `existingBinding` provided → open at Step 2 with sourceColumn from binding.
 * - `sourceColumn` in `timeColumns` → open at Step 2 with that column pre-selected.
 * - `timeColumns.length === 0` → empty state (no step indicator, no Next).
 */
export const TimeAsFactorsModal: React.FC<TimeAsFactorsModalProps> = ({
  sourceColumn,
  timeColumns,
  existingBinding,
  rows: _rows,
  onSave: _onSave,
  onClose,
}) => {
  // Compute the initial step and picked source from props.
  const initialPickedSource: string | null =
    existingBinding?.sourceColumn ??
    (sourceColumn != null && timeColumns.includes(sourceColumn) ? sourceColumn : null);

  const initialStep: 1 | 2 =
    existingBinding != null || (sourceColumn != null && timeColumns.includes(sourceColumn)) ? 2 : 1;

  const [step, setStep] = useState<1 | 2>(initialStep);
  const [pickedSource, setPickedSource] = useState<string | null>(initialPickedSource);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus dialog on mount.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Escape closes.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isEmpty = timeColumns.length === 0;

  return (
    <div
      data-testid="time-factors-modal-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: false,
          fallbackFocus: '[role="dialog"]',
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="time-factors-modal-title"
          tabIndex={-1}
          className="bg-surface rounded-xl border border-edge p-6 max-w-lg w-full mx-4 shadow-lg max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <h2 id="time-factors-modal-title" className="text-base font-semibold text-content mb-4">
            Use time as factors
          </h2>

          {isEmpty ? (
            <EmptyState onClose={onClose} />
          ) : (
            <>
              {/* Step indicator */}
              <p className="text-xs text-content-secondary mb-4">Step {step} of 2</p>

              {/* Step body */}
              <div className="flex-1 overflow-auto">
                {step === 1 ? (
                  <Step1Body
                    timeColumns={timeColumns}
                    pickedSource={pickedSource}
                    onPick={setPickedSource}
                  />
                ) : (
                  <Step2Body pickedSource={pickedSource} />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-edge">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {step === 1 && (
                  <button
                    type="button"
                    disabled={pickedSource == null}
                    aria-disabled={pickedSource == null}
                    onClick={() => {
                      if (pickedSource != null) setStep(2);
                    }}
                    className={`px-4 py-2 text-sm bg-blue-500 text-white rounded-lg transition-colors ${
                      pickedSource == null ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                    }`}
                  >
                    Next →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </FocusTrap>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 1 body — column radio group
// ---------------------------------------------------------------------------

const Step1Body: React.FC<{
  timeColumns: string[];
  pickedSource: string | null;
  onPick: (column: string) => void;
}> = ({ timeColumns, pickedSource, onPick }) => (
  <div className="flex flex-col gap-3">
    <p className="text-sm font-medium text-content">Pick a time column</p>
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Time column</legend>
      {timeColumns.map(col => (
        <label key={col} className="flex items-center gap-2 text-sm text-content cursor-pointer">
          <input
            type="radio"
            name="time-factors-column"
            value={col}
            checked={pickedSource === col}
            onChange={() => onPick(col)}
            className="accent-blue-500"
          />
          {col}
        </label>
      ))}
    </fieldset>
  </div>
);

// ---------------------------------------------------------------------------
// Step 2 body — placeholder (Task 5 fills in dimension pickers)
// ---------------------------------------------------------------------------

const Step2Body: React.FC<{ pickedSource: string | null }> = ({ pickedSource }) => (
  <div className="flex flex-col gap-3">
    <p className="text-sm text-content-secondary">
      Source column: <strong className="text-content">{pickedSource}</strong>
    </p>
    <p className="text-sm text-content-secondary">
      Step 2 will be implemented in the next task — pick dimensions.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Empty state — no date-kind columns detected
// ---------------------------------------------------------------------------

const EmptyState: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <>
    <p className="text-sm text-content-secondary flex-1">
      No time columns detected. Open a column&apos;s{' '}
      <span className="font-medium text-content">&#x2699; Parsing &amp; format</span> menu to mark a
      column as a date.
    </p>
    <div className="flex items-center justify-end mt-6 pt-4 border-t border-edge">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
      >
        Close
      </button>
    </div>
  </>
);
