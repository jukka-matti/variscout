import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import type { StepTimingBinding } from '@variscout/core';

export interface StepTimingsModalProps {
  /** Emergent steps from the Process zone (id + display name + order). */
  steps: { id: string; name: string; order: number }[];
  /** Names of date-kind columns from profiles — populates Start/End pickers. */
  dateColumns: string[];
  /** Pre-existing bindings (for reopening the modal). Defaults to []. */
  initialBindings?: StepTimingBinding[];
  /** Receives ONLY fully-bound (start+end set) rows; partial rows excluded. */
  onSave: (bindings: StepTimingBinding[]) => void;
  /** Backdrop click + Escape both invoke this. */
  onClose: () => void;
}

type TabId = 'by-step' | 'by-column';

/**
 * StepTimingsModal — D1 Task 3 skeleton + By-step layout.
 *
 * Mirrors `AddActionDialog` for the shell (FocusTrap + fixed backdrop + Escape +
 * click-outside close). Hosts two tabs: **By step** (active by default, this PR)
 * and **By column** (DOM-present placeholder; wired in Task 5).
 *
 * By-step layout: one table row per `step`, each row has a Start ▾ <select>,
 * an End ▾ <select> (both listing only `dateColumns` + an empty `--` option),
 * and a Duration preview cell. Save returns only rows where both Start AND End
 * are set; partials are silently excluded.
 *
 * Pre-fill from `detectPairedTimingColumns` lands in Task 4. By-column tab
 * content + duration alternative + mutual exclusion land in Task 5.
 */
export const StepTimingsModal: React.FC<StepTimingsModalProps> = ({
  steps,
  dateColumns,
  initialBindings = [],
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('by-step');

  // Per-step start/end column state. Empty string === "unbound" (matches the
  // empty `--` option's value).
  const [startByStep, setStartByStep] = useState<Record<string, string>>(() =>
    buildInitialMap(initialBindings, 'start')
  );
  const [endByStep, setEndByStep] = useState<Record<string, string>>(() =>
    buildInitialMap(initialBindings, 'end')
  );

  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus dialog on mount (mirror AddActionDialog focus pattern; the
  // first interactive control is a tab, so focusing the dialog lets the
  // FocusTrap pick up the first focusable child).
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Escape closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleStartChange = useCallback((stepId: string, value: string) => {
    setStartByStep(prev => ({ ...prev, [stepId]: value }));
  }, []);

  const handleEndChange = useCallback((stepId: string, value: string) => {
    setEndByStep(prev => ({ ...prev, [stepId]: value }));
  }, []);

  // Fully-bound rows = rows where BOTH start and end are non-empty.
  const fullyBound = useMemo<StepTimingBinding[]>(() => {
    return steps
      .filter(step => {
        const start = startByStep[step.id];
        const end = endByStep[step.id];
        return Boolean(start) && Boolean(end);
      })
      .map(step => ({
        kind: 'paired' as const,
        stepId: step.id,
        startColumn: startByStep[step.id]!,
        endColumn: endByStep[step.id]!,
      }));
  }, [steps, startByStep, endByStep]);

  const timedCount = fullyBound.length;
  const timedLabel = `${timedCount} ${timedCount === 1 ? 'step' : 'steps'} timed`;

  const handleSave = () => {
    onSave(fullyBound);
  };

  return (
    <div
      data-testid="step-timings-backdrop"
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
          aria-label="Capture step timings"
          tabIndex={-1}
          className="bg-surface rounded-xl border border-edge p-6 max-w-3xl w-full mx-4 shadow-lg max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <h2 id="step-timings-modal-title" className="text-base font-semibold text-content mb-4">
            Capture step timings
          </h2>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Step timings input mode"
            className="flex gap-0 border-b border-edge mb-4"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'by-step'}
              aria-controls="step-timings-panel-by-step"
              data-testid="step-timings-tab-by-step"
              onClick={() => setActiveTab('by-step')}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                activeTab === 'by-step'
                  ? 'border-[var(--vs-accent)] text-[var(--vs-accent)] font-semibold'
                  : 'border-transparent text-content-secondary hover:text-content'
              }`}
            >
              By step
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'by-column'}
              aria-controls="step-timings-panel-by-column"
              data-testid="step-timings-tab-by-column"
              onClick={() => setActiveTab('by-column')}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                activeTab === 'by-column'
                  ? 'border-[var(--vs-accent)] text-[var(--vs-accent)] font-semibold'
                  : 'border-transparent text-content-secondary hover:text-content'
              }`}
            >
              By column
            </button>
          </div>

          {/* Tab panels */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'by-step' ? (
              <div
                role="tabpanel"
                id="step-timings-panel-by-step"
                aria-labelledby="step-timings-tab-by-step"
              >
                <ByStepTable
                  steps={steps}
                  dateColumns={dateColumns}
                  startByStep={startByStep}
                  endByStep={endByStep}
                  onStartChange={handleStartChange}
                  onEndChange={handleEndChange}
                />
              </div>
            ) : (
              <div
                role="tabpanel"
                id="step-timings-panel-by-column"
                aria-labelledby="step-timings-tab-by-column"
                className="text-sm text-content-secondary py-6 px-2"
              >
                By-column layout coming in a follow-up.
              </div>
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
            <button
              type="button"
              onClick={handleSave}
              data-testid="step-timings-save"
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {`Save · ${timedLabel} →`}
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

/**
 * By-step table — one row per emergent step. Each row exposes a Start ▾ /
 * End ▾ <select> pair (populated from `dateColumns`) and a Duration preview
 * cell (placeholder text in this task; live preview lands later).
 */
const ByStepTable: React.FC<{
  steps: { id: string; name: string; order: number }[];
  dateColumns: string[];
  startByStep: Record<string, string>;
  endByStep: Record<string, string>;
  onStartChange: (stepId: string, value: string) => void;
  onEndChange: (stepId: string, value: string) => void;
}> = ({ steps, dateColumns, startByStep, endByStep, onStartChange, onEndChange }) => {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-content-secondary py-6 px-2">
        Add steps in the Process zone first, then return here to capture their timing.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-content-secondary">
          <th className="py-2 pr-3 font-medium">Step</th>
          <th className="py-2 pr-3 font-medium">Start ▾</th>
          <th className="py-2 pr-3 font-medium">End ▾</th>
          <th className="py-2 font-medium">Duration</th>
        </tr>
      </thead>
      <tbody>
        {steps.map(step => {
          const startValue = startByStep[step.id] ?? '';
          const endValue = endByStep[step.id] ?? '';
          return (
            <tr
              key={step.id}
              data-testid={`step-timing-row-${step.id}`}
              className="border-t border-edge"
            >
              <td className="py-2 pr-3 text-content font-medium">{step.name}</td>
              <td className="py-2 pr-3">
                <DateColumnSelect
                  testId={`step-timing-row-${step.id}-start`}
                  ariaLabel={`Start column for ${step.name}`}
                  value={startValue}
                  dateColumns={dateColumns}
                  onChange={value => onStartChange(step.id, value)}
                />
              </td>
              <td className="py-2 pr-3">
                <DateColumnSelect
                  testId={`step-timing-row-${step.id}-end`}
                  ariaLabel={`End column for ${step.name}`}
                  value={endValue}
                  dateColumns={dateColumns}
                  onChange={value => onEndChange(step.id, value)}
                />
              </td>
              <td
                className="py-2 text-content-secondary"
                data-testid={`step-timing-row-${step.id}-duration`}
              >
                —
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const DateColumnSelect: React.FC<{
  testId: string;
  ariaLabel: string;
  value: string;
  dateColumns: string[];
  onChange: (value: string) => void;
}> = ({ testId, ariaLabel, value, dateColumns, onChange }) => (
  <select
    data-testid={testId}
    aria-label={ariaLabel}
    value={value}
    onChange={e => onChange(e.target.value)}
    className="w-full px-2 py-1.5 bg-surface-secondary border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50"
  >
    <option value="">--</option>
    {dateColumns.map(col => (
      <option key={col} value={col}>
        {col}
      </option>
    ))}
  </select>
);

/** Build initial start/end maps from `initialBindings`. Only `'paired'` bindings
 *  contribute to By-step row pre-fill; `'duration'` bindings are owned by the
 *  By-column tab (Task 5). */
function buildInitialMap(
  initialBindings: StepTimingBinding[],
  side: 'start' | 'end'
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const b of initialBindings) {
    if (b.kind !== 'paired') continue;
    map[b.stepId] = side === 'start' ? b.startColumn : b.endColumn;
  }
  return map;
}
