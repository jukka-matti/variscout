import React, { useState, useEffect, useRef, useMemo } from 'react';
import FocusTrap from 'focus-trap-react';
import type {
  TimeDecompositionBinding,
  TimeDimension,
  HourGranularityMinutes,
} from '@variscout/core';
import { computeTimeDecompositionColumns, derivedTimeColumnName } from '@variscout/core';

export interface TimeAsFactorsModalProps {
  /** Pre-selected source column (e.g. from a column's kebab menu). */
  sourceColumn?: string;
  /** Date-kind column names available in the canvas palette. */
  timeColumns: string[];
  /** Pre-existing binding — opens directly at Step 2 with the source column locked. */
  existingBinding?: TimeDecompositionBinding;
  /** Raw row dictionaries used for the live preview. */
  rows: ReadonlyArray<Record<string, unknown>>;
  /** Called with the completed binding. */
  onSave: (binding: TimeDecompositionBinding) => void;
  /** Called on Escape + backdrop click + Close button. */
  onClose: () => void;
}

/**
 * TimeAsFactorsModal — two-step flow for creating a TimeDecompositionBinding.
 *
 * Mirrors CalculatedColumnModal / StepTimingsModal for the shell (FocusTrap +
 * fixed backdrop + Escape + click-outside close). Two-step flow:
 *
 * Step 1 — Pick a time column (radio group). "Next" gated on selection.
 * Step 2 — 6 dimension checkboxes + Hour granularity sub-picker + live preview + save footer.
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
  rows,
  onSave,
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

  // Track whether the user reached Step 2 by clicking Next (vs bypassed).
  // Stable: derived once from initial props and never changes across re-renders.
  const reachedStep2ViaStep1 =
    existingBinding == null && !(sourceColumn != null && timeColumns.includes(sourceColumn));

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
                  <Step2Body
                    pickedSource={pickedSource}
                    existingBinding={existingBinding}
                    rows={rows}
                    reachedStep2ViaStep1={reachedStep2ViaStep1}
                    onBack={() => setStep(1)}
                    onSave={onSave}
                    onClose={onClose}
                  />
                )}
              </div>

              {/* Footer — only shown in Step 1 (Step 2 manages its own footer) */}
              {step === 1 && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-edge">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
                  >
                    Close
                  </button>
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
                </div>
              )}
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
// Dimension configuration — spec-mandated order
// ---------------------------------------------------------------------------

const DIMENSIONS: { key: TimeDimension; label: string; description: string }[] = [
  { key: 'year', label: 'Year', description: 'Calendar year' },
  { key: 'quarter', label: 'Quarter', description: 'Q1 / Q2 / Q3 / Q4' },
  { key: 'month', label: 'Month', description: 'Jan / Feb / Mar / …' },
  { key: 'week', label: 'Week', description: 'ISO week — W01 / W02 / …' },
  { key: 'dayOfWeek', label: 'Day of week', description: 'Mon / Tue / Wed / …' },
  { key: 'hour', label: 'Hour', description: 'Time of day — granularity below' },
];

function previewLabel(dim: TimeDimension): string {
  switch (dim) {
    case 'year':
      return 'Year';
    case 'quarter':
      return 'Quarter';
    case 'month':
      return 'Month';
    case 'week':
      return 'Week';
    case 'dayOfWeek':
      return 'Day of week';
    case 'hour':
      return 'Hour';
  }
}

// ---------------------------------------------------------------------------
// Step 2 body — dimension checkboxes + granularity + preview + footer
// ---------------------------------------------------------------------------

const Step2Body: React.FC<{
  pickedSource: string | null;
  existingBinding?: TimeDecompositionBinding;
  rows: ReadonlyArray<Record<string, unknown>>;
  reachedStep2ViaStep1: boolean;
  onBack: () => void;
  onSave: (binding: TimeDecompositionBinding) => void;
  onClose: () => void;
}> = ({ pickedSource, existingBinding, rows, reachedStep2ViaStep1, onBack, onSave, onClose }) => {
  const [dimensions, setDimensions] = useState<Set<TimeDimension>>(
    () => new Set<TimeDimension>(existingBinding?.dimensions ?? [])
  );
  const [hourGranularityMinutes, setHourGranularityMinutes] = useState<HourGranularityMinutes>(
    existingBinding?.hourGranularityMinutes ?? 60
  );

  const toggleDimension = (key: TimeDimension) => {
    setDimensions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const hourEnabled = dimensions.has('hour');

  // Build a preview binding in spec-mandated order for computeTimeDecompositionColumns
  const previewBinding: TimeDecompositionBinding = useMemo(
    () => ({
      id: 'preview',
      sourceColumn: pickedSource ?? '',
      dimensions: DIMENSIONS.filter(d => dimensions.has(d.key)).map(d => d.key),
      ...(dimensions.has('hour') ? { hourGranularityMinutes } : {}),
    }),
    [dimensions, pickedSource, hourGranularityMinutes]
  );

  // Compute preview — only when we have dimensions, a source, and rows
  const previewColumns = useMemo(() => {
    if (dimensions.size === 0 || rows.length === 0 || pickedSource == null) return null;
    return computeTimeDecompositionColumns([rows[0]], previewBinding);
  }, [dimensions, pickedSource, hourGranularityMinutes, rows, previewBinding]);

  // Determine if the first row parsed (any non-null value means parseable)
  const previewParseable =
    previewColumns != null && Object.values(previewColumns).some(col => col[0] != null);

  const handleSave = () => {
    if (pickedSource == null || dimensions.size === 0) return;
    const binding: TimeDecompositionBinding = {
      id: existingBinding?.id ?? crypto.randomUUID(),
      sourceColumn: pickedSource,
      // Preserve spec-mandated dimension order regardless of click order
      dimensions: DIMENSIONS.filter(d => dimensions.has(d.key)).map(d => d.key),
      ...(dimensions.has('hour') ? { hourGranularityMinutes } : {}),
    };
    onSave(binding);
  };

  const dimensionCount = dimensions.size;
  const saveDisabled = pickedSource == null || dimensionCount === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Source column label */}
      <p className="text-sm text-content-secondary">
        Source column: <strong className="text-content">{pickedSource}</strong>
      </p>

      {/* Dimension checkboxes */}
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Time dimensions</legend>
        {DIMENSIONS.map(dim => (
          <div key={dim.key} className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-content cursor-pointer">
              <input
                type="checkbox"
                aria-label={dim.label}
                checked={dimensions.has(dim.key)}
                onChange={() => toggleDimension(dim.key)}
                className="accent-blue-500"
              />
              <span className="font-medium">{dim.label}</span>
            </label>
            <span className="text-xs text-content-secondary">{dim.description}</span>
            {/* Inline Hour granularity sub-picker */}
            {dim.key === 'hour' && (
              <select
                aria-label="Hour granularity (minutes)"
                value={hourGranularityMinutes}
                onChange={e =>
                  setHourGranularityMinutes(Number(e.target.value) as HourGranularityMinutes)
                }
                disabled={!hourEnabled}
                aria-disabled={!hourEnabled}
                title={!hourEnabled ? 'Check Hour to enable granularity' : undefined}
                className={`ml-2 text-xs border border-edge rounded px-1 py-0.5 bg-surface ${
                  !hourEnabled ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <option value={60}>60 min (hourly)</option>
                <option value={30}>30 min</option>
                <option value={15}>15 min</option>
                <option value={5}>5 min</option>
              </select>
            )}
          </div>
        ))}
      </fieldset>

      {/* Live preview */}
      {previewColumns != null && rows.length > 0 && (
        <div className="text-sm text-content-secondary border border-edge rounded-lg p-3">
          {previewParseable ? (
            <p>
              Sample (first row):{' '}
              <strong className="text-content">
                {DIMENSIONS.filter(d => dimensions.has(d.key))
                  .map(d => {
                    const colName = derivedTimeColumnName(
                      pickedSource ?? '',
                      d.key,
                      d.key === 'hour' ? hourGranularityMinutes : undefined
                    );
                    const value = previewColumns[colName]?.[0];
                    return `${previewLabel(d.key)}: ${value ?? '—'}`;
                  })
                  .join(' · ')}
              </strong>
            </p>
          ) : (
            <p>Sample row&apos;s date couldn&apos;t be parsed.</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-4 border-t border-edge">
        <div className="flex items-center gap-2">
          {reachedStep2ViaStep1 && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            disabled={saveDisabled}
            aria-disabled={saveDisabled}
            onClick={handleSave}
            className={`px-4 py-2 text-sm bg-blue-500 text-white rounded-lg transition-colors ${
              saveDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            Save · &ldquo;{pickedSource} factors ({dimensionCount})&rdquo; →
          </button>
        </div>
      </div>
    </div>
  );
};

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
