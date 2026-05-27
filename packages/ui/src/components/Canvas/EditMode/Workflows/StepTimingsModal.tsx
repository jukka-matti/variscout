import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import type { StepTimingBinding } from '@variscout/core';
import { detectPairedTimingColumns } from '@variscout/core';
import type { ColumnParsingProfile } from '@variscout/core/parser';

export interface StepTimingsModalProps {
  /** Emergent steps from the Process zone (id + display name + order). */
  steps: { id: string; name: string; order: number }[];
  /** Column parsing profiles from the canvas palette. Date-kind profiles are
   *  used to populate Start/End pickers and to auto-detect paired timing columns. */
  dateProfiles: ColumnParsingProfile[];
  /** Numeric-kind column profiles. Populate the Duration picker in the alternative
   *  section (spec §4.3.1 — duration columns are typically numeric like Cycle_time_min). */
  numericProfiles: ColumnParsingProfile[];
  /** Pre-existing bindings (for reopening the modal). Defaults to []. */
  initialBindings?: StepTimingBinding[];
  /** Receives fully-bound rows: paired (start+end both set) + duration (column set);
   *  partial-paired rows are excluded. */
  onSave: (bindings: StepTimingBinding[]) => void;
  /** Backdrop click + Escape both invoke this. */
  onClose: () => void;
}

type TabId = 'by-step' | 'by-column';

/** Role assignment in the by-column view. */
type ColumnRole = 'start' | 'end' | 'duration' | '';

/** Tracks which pickers carry auto-detected values, keyed by stepId + side. */
type AutoDetectFlags = Record<string, { start?: boolean; end?: boolean }>;

/**
 * StepTimingsModal — full implementation (Tasks 3–5).
 *
 * Mirrors `AddActionDialog` for the shell (FocusTrap + fixed backdrop + Escape +
 * click-outside close). Hosts two tabs: **By step** (active by default) and
 * **By column** (functional in Task 5).
 *
 * By-step layout: one table row per `step`, each row has a Start ▾ <select>,
 * an End ▾ <select> (both listing only date-kind columns from `dateProfiles` +
 * an empty `--` option), and a Duration preview cell. Below the table is the
 * duration alternative section ("Or use a single duration column").
 *
 * By-column layout: one row per date-kind column. Each row exposes a Step picker
 * (step names + empty `--`) and a Role picker (Start/End/Duration/`--`). Both
 * views share the SAME underlying state maps, so switching tabs preserves edits.
 *
 * Mutual exclusion is enforced in the change handlers:
 * - Picking a Start or End value → clears that step's duration + its wasAutoDetected flags.
 * - Picking a Duration value → clears that step's start + end + their wasAutoDetected flags.
 *
 * Save emits `StepTimingBinding[]` combining paired + duration bindings;
 * partial-paired (only Start or only End) are excluded.
 */
export const StepTimingsModal: React.FC<StepTimingsModalProps> = ({
  steps,
  dateProfiles,
  numericProfiles,
  initialBindings = [],
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('by-step');

  // Derive the list of date-kind column names for picker options.
  const dateColumns = useMemo(
    () => dateProfiles.filter(p => p.primary?.kind === 'date').map(p => p.columnName),
    [dateProfiles]
  );

  // Derive the list of numeric-kind column names for the duration alternative section.
  const numericColumns = useMemo(
    () => numericProfiles.filter(p => p.primary?.kind === 'numeric').map(p => p.columnName),
    [numericProfiles]
  );

  // Run detection once on mount / when dateProfiles or steps change.
  const detectedPairs = useMemo(
    () =>
      detectPairedTimingColumns(
        dateProfiles,
        steps.map(s => ({ id: s.id, name: s.name }))
      ),
    [dateProfiles, steps]
  );

  // Build initial step-binding presence set from initialBindings (paired only).
  // Steps that appear in initialBindings are NOT pre-filled from detection.
  const stepsWithInitialBindings = useMemo(() => {
    const ids = new Set<string>();
    for (const b of initialBindings) {
      if (b.kind === 'paired') ids.add(b.stepId);
    }
    return ids;
  }, [initialBindings]);

  // Per-step start/end column state. Empty string === "unbound" (matches the
  // empty `--` option's value).
  const [startByStep, setStartByStep] = useState<Record<string, string>>(() => {
    const base = buildInitialStartEndMap(initialBindings, 'start');
    // Merge auto-detected pairs — only for steps NOT covered by initialBindings.
    for (const pair of detectedPairs) {
      if (pair.matchedStepId !== null && !stepsWithInitialBindings.has(pair.matchedStepId)) {
        base[pair.matchedStepId] = pair.startColumn;
      }
    }
    return base;
  });

  const [endByStep, setEndByStep] = useState<Record<string, string>>(() => {
    const base = buildInitialStartEndMap(initialBindings, 'end');
    // Merge auto-detected pairs — only for steps NOT covered by initialBindings.
    for (const pair of detectedPairs) {
      if (pair.matchedStepId !== null && !stepsWithInitialBindings.has(pair.matchedStepId)) {
        base[pair.matchedStepId] = pair.endColumn;
      }
    }
    return base;
  });

  // Per-step duration column state. Initialized from `'duration'` kind initialBindings.
  const [durationByStep, setDurationByStep] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const b of initialBindings) {
      if (b.kind === 'duration') {
        map[b.stepId] = b.durationColumn;
      }
    }
    return map;
  });

  // Track which pickers currently carry an auto-detected value.
  // A picker is "auto-detected" only when it was filled by detection AND not
  // overridden by initialBindings AND not yet manually changed by the user.
  const [wasAutoDetected, setWasAutoDetected] = useState<AutoDetectFlags>(() => {
    const flags: AutoDetectFlags = {};
    for (const pair of detectedPairs) {
      if (pair.matchedStepId !== null && !stepsWithInitialBindings.has(pair.matchedStepId)) {
        flags[pair.matchedStepId] = { start: true, end: true };
      }
    }
    return flags;
  });

  // Per-step inline hint state — shown after mutual exclusion triggers.
  // 'duration-only' = user picked a duration, start/end were cleared.
  // 'start-end-pair' = user picked start/end, duration was cleared.
  const [hintByStep, setHintByStep] = useState<
    Record<string, 'duration-only' | 'start-end-pair' | null>
  >({});

  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus dialog on mount (mirror AddActionDialog focus pattern).
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
    // Clear the auto-detected flag for this picker only.
    setWasAutoDetected(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId], start: false },
    }));
    // Mutual exclusion: picking a Start value clears duration for that step.
    if (value !== '') {
      setDurationByStep(prev => {
        if (!prev[stepId]) return prev;
        return { ...prev, [stepId]: '' };
      });
      setHintByStep(prev => ({ ...prev, [stepId]: 'start-end-pair' }));
    }
  }, []);

  const handleEndChange = useCallback((stepId: string, value: string) => {
    setEndByStep(prev => ({ ...prev, [stepId]: value }));
    // Clear the auto-detected flag for this picker only.
    setWasAutoDetected(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId], end: false },
    }));
    // Mutual exclusion: picking an End value clears duration for that step.
    if (value !== '') {
      setDurationByStep(prev => {
        if (!prev[stepId]) return prev;
        return { ...prev, [stepId]: '' };
      });
      setHintByStep(prev => ({ ...prev, [stepId]: 'start-end-pair' }));
    }
  }, []);

  const handleDurationChange = useCallback((stepId: string, value: string) => {
    setDurationByStep(prev => ({ ...prev, [stepId]: value }));
    // Mutual exclusion: picking a Duration value clears start + end for that step.
    if (value !== '') {
      setStartByStep(prev => {
        if (!prev[stepId]) return prev;
        return { ...prev, [stepId]: '' };
      });
      setEndByStep(prev => {
        if (!prev[stepId]) return prev;
        return { ...prev, [stepId]: '' };
      });
      // Also clear the wasAutoDetected flags for start + end on this step.
      setWasAutoDetected(prev => ({
        ...prev,
        [stepId]: { start: false, end: false },
      }));
      setHintByStep(prev => ({ ...prev, [stepId]: 'duration-only' }));
    } else {
      setHintByStep(prev => ({ ...prev, [stepId]: null }));
    }
  }, []);

  // Fully-bound rows = rows where BOTH start and end are non-empty (paired)
  // OR where duration is non-empty (duration).
  const fullyBound = useMemo<StepTimingBinding[]>(() => {
    const result: StepTimingBinding[] = [];
    for (const step of steps) {
      const start = startByStep[step.id] ?? '';
      const end = endByStep[step.id] ?? '';
      const duration = durationByStep[step.id] ?? '';
      if (start && end) {
        result.push({ kind: 'paired', stepId: step.id, startColumn: start, endColumn: end });
      } else if (duration) {
        result.push({ kind: 'duration', stepId: step.id, durationColumn: duration });
      }
      // Partial-paired (only start or only end) excluded.
    }
    return result;
  }, [steps, startByStep, endByStep, durationByStep]);

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
          aria-labelledby="step-timings-modal-title"
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
              id="step-timings-tab-by-step"
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
              id="step-timings-tab-by-column"
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
                  wasAutoDetected={wasAutoDetected}
                  onStartChange={handleStartChange}
                  onEndChange={handleEndChange}
                />
                {/* Duration alternative section — always visible below the per-step table */}
                <DurationAlternativeSection
                  steps={steps}
                  numericColumns={numericColumns}
                  durationByStep={durationByStep}
                  hintByStep={hintByStep}
                  onDurationChange={handleDurationChange}
                />
              </div>
            ) : (
              <div
                role="tabpanel"
                id="step-timings-panel-by-column"
                aria-labelledby="step-timings-tab-by-column"
              >
                <ByColumnTable
                  steps={steps}
                  dateColumns={dateColumns}
                  startByStep={startByStep}
                  endByStep={endByStep}
                  durationByStep={durationByStep}
                  onStartChange={handleStartChange}
                  onEndChange={handleEndChange}
                  onDurationChange={handleDurationChange}
                />
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
 * cell.
 *
 * Auto-detected pickers display a small cyan dot (aria-label="Auto-detected")
 * to signal that the value was supplied by `detectPairedTimingColumns`.
 */
const ByStepTable: React.FC<{
  steps: { id: string; name: string; order: number }[];
  dateColumns: string[];
  startByStep: Record<string, string>;
  endByStep: Record<string, string>;
  wasAutoDetected: AutoDetectFlags;
  onStartChange: (stepId: string, value: string) => void;
  onEndChange: (stepId: string, value: string) => void;
}> = ({
  steps,
  dateColumns,
  startByStep,
  endByStep,
  wasAutoDetected,
  onStartChange,
  onEndChange,
}) => {
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
          const startAutoDetected = wasAutoDetected[step.id]?.start === true;
          const endAutoDetected = wasAutoDetected[step.id]?.end === true;
          return (
            <tr
              key={step.id}
              data-testid={`step-timing-row-${step.id}`}
              className="border-t border-edge"
            >
              <td className="py-2 pr-3 text-content font-medium">{step.name}</td>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-1.5">
                  <DateColumnSelect
                    testId={`step-timing-row-${step.id}-start`}
                    ariaLabel={`Start column for ${step.name}`}
                    value={startValue}
                    dateColumns={dateColumns}
                    onChange={value => onStartChange(step.id, value)}
                  />
                  {startAutoDetected && (
                    <AutoDetectedDot testId={`step-timing-row-${step.id}-start-auto-dot`} />
                  )}
                </div>
              </td>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-1.5">
                  <DateColumnSelect
                    testId={`step-timing-row-${step.id}-end`}
                    ariaLabel={`End column for ${step.name}`}
                    value={endValue}
                    dateColumns={dateColumns}
                    onChange={value => onEndChange(step.id, value)}
                  />
                  {endAutoDetected && (
                    <AutoDetectedDot testId={`step-timing-row-${step.id}-end-auto-dot`} />
                  )}
                </div>
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

/**
 * Duration alternative section — always visible in the by-step view below the
 * per-step table. Spec §4.3.1: one row per step, each row has a Duration column
 * picker (numeric columns only from `numericColumns`).
 *
 * Inline hints:
 * - "Using duration only" — shown when user picks a duration column that cleared start/end.
 * - "Using start/end pair" — shown when user picks start/end that cleared a duration.
 */
const DurationAlternativeSection: React.FC<{
  steps: { id: string; name: string; order: number }[];
  numericColumns: string[];
  durationByStep: Record<string, string>;
  hintByStep: Record<string, 'duration-only' | 'start-end-pair' | null>;
  onDurationChange: (stepId: string, value: string) => void;
}> = ({ steps, numericColumns, durationByStep, hintByStep, onDurationChange }) => (
  <div className="mt-6 pt-4 border-t border-edge">
    <h3 className="text-sm font-semibold text-content mb-3">Or use a single duration column</h3>
    {steps.length === 0 ? null : (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-content-secondary">
            <th className="py-2 pr-3 font-medium">Step</th>
            <th className="py-2 pr-3 font-medium">Duration column</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {steps.map(step => {
            const durationValue = durationByStep[step.id] ?? '';
            const hint = hintByStep[step.id] ?? null;
            return (
              <tr
                key={step.id}
                data-testid={`step-duration-row-${step.id}`}
                className="border-t border-edge"
              >
                <td className="py-2 pr-3 text-content font-medium">{step.name}</td>
                <td className="py-2 pr-3">
                  <select
                    data-testid={`step-duration-row-${step.id}-picker`}
                    aria-label={`Duration column for ${step.name}`}
                    value={durationValue}
                    onChange={e => onDurationChange(step.id, e.target.value)}
                    className="w-full px-2 py-1.5 bg-surface-secondary border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">--</option>
                    {numericColumns.map(col => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 text-xs text-content-secondary">
                  {hint === 'duration-only' && (
                    <span className="text-cyan-700">Using duration only</span>
                  )}
                  {hint === 'start-end-pair' && (
                    <span className="text-cyan-700">Using start/end pair</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);

/**
 * By-column table — one row per date-kind column. Each row has:
 * - Column name label
 * - Step picker (step names + empty `--`)
 * - Role picker (Start / End / Duration / `--`)
 *
 * The view DERIVES its row values from the shared `startByStep` / `endByStep` /
 * `durationByStep` maps, so switching tabs preserves edits.
 *
 * Derivation logic (column → step + role):
 *   For each date column, scan `startByStep` for a step that has this column as its
 *   start (→ role=Start), then `endByStep` (→ role=End), then `durationByStep`
 *   (→ role=Duration). First match wins per role; multiple Start columns for the same
 *   step → the step keeps only the first in iteration order (handled in Save aggregation).
 *
 * When the user changes a row's Step or Role picker, the change is translated back
 * to the shared state via the `onStartChange` / `onEndChange` / `onDurationChange`
 * handlers so by-step view stays in sync.
 */
const ByColumnTable: React.FC<{
  steps: { id: string; name: string; order: number }[];
  dateColumns: string[];
  startByStep: Record<string, string>;
  endByStep: Record<string, string>;
  durationByStep: Record<string, string>;
  onStartChange: (stepId: string, value: string) => void;
  onEndChange: (stepId: string, value: string) => void;
  onDurationChange: (stepId: string, value: string) => void;
}> = ({
  steps,
  dateColumns,
  startByStep,
  endByStep,
  durationByStep,
  onStartChange,
  onEndChange,
  onDurationChange,
}) => {
  if (dateColumns.length === 0) {
    return (
      <p className="text-sm text-content-secondary py-6 px-2">
        No date columns detected. Add date columns to the canvas palette first.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-content-secondary">
          <th className="py-2 pr-3 font-medium">Column</th>
          <th className="py-2 pr-3 font-medium">Step</th>
          <th className="py-2 font-medium">Role</th>
        </tr>
      </thead>
      <tbody>
        {dateColumns.map(col => {
          // Derive the current step + role assignment for this column from shared state.
          // Scan startByStep, endByStep, durationByStep to find a step that references
          // this column. Multiple Start columns for the same step → the first column in
          // iteration order wins for "which step claims this column as Start" (harmless
          // display; Save aggregation also uses first-wins logic).
          let derivedStepId = '';
          let derivedRole: ColumnRole = '';
          for (const step of steps) {
            if (startByStep[step.id] === col) {
              derivedStepId = step.id;
              derivedRole = 'start';
              break;
            }
          }
          if (!derivedStepId) {
            for (const step of steps) {
              if (endByStep[step.id] === col) {
                derivedStepId = step.id;
                derivedRole = 'end';
                break;
              }
            }
          }
          if (!derivedStepId) {
            for (const step of steps) {
              if (durationByStep[step.id] === col) {
                derivedStepId = step.id;
                derivedRole = 'duration';
                break;
              }
            }
          }

          const handleStepChange = (newStepId: string) => {
            if (!newStepId) {
              // Clearing the step → remove whatever role was assigned to this column
              if (derivedStepId && derivedRole === 'start') onStartChange(derivedStepId, '');
              if (derivedStepId && derivedRole === 'end') onEndChange(derivedStepId, '');
              if (derivedStepId && derivedRole === 'duration') onDurationChange(derivedStepId, '');
              return;
            }
            // Assigning to a new step: update the new step's role if a role is already selected
            if (derivedRole === 'start') {
              if (derivedStepId) onStartChange(derivedStepId, ''); // unassign from old step
              onStartChange(newStepId, col);
            } else if (derivedRole === 'end') {
              if (derivedStepId) onEndChange(derivedStepId, '');
              onEndChange(newStepId, col);
            } else if (derivedRole === 'duration') {
              if (derivedStepId) onDurationChange(derivedStepId, '');
              onDurationChange(newStepId, col);
            }
            // If no role selected yet, changing step alone doesn't bind anything.
          };

          const handleRoleChange = (newRole: ColumnRole) => {
            const targetStepId = derivedStepId;
            if (!targetStepId) return; // no step selected; role change is a no-op
            // Clear the old role
            if (derivedRole === 'start') onStartChange(targetStepId, '');
            if (derivedRole === 'end') onEndChange(targetStepId, '');
            if (derivedRole === 'duration') onDurationChange(targetStepId, '');
            // Apply the new role
            if (newRole === 'start') onStartChange(targetStepId, col);
            if (newRole === 'end') onEndChange(targetStepId, col);
            if (newRole === 'duration') onDurationChange(targetStepId, col);
          };

          return (
            <tr
              key={col}
              data-testid={`column-binding-row-${col}`}
              className="border-t border-edge"
            >
              <td className="py-2 pr-3 text-content font-medium">{col}</td>
              <td className="py-2 pr-3">
                <select
                  data-testid={`column-binding-row-${col}-step`}
                  aria-label={`Step for column ${col}`}
                  value={derivedStepId}
                  onChange={e => handleStepChange(e.target.value)}
                  className="w-full px-2 py-1.5 bg-surface-secondary border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">--</option>
                  {steps.map(step => (
                    <option key={step.id} value={step.id}>
                      {step.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2">
                <select
                  data-testid={`column-binding-row-${col}-role`}
                  aria-label={`Role for column ${col}`}
                  value={derivedRole}
                  onChange={e => handleRoleChange(e.target.value as ColumnRole)}
                  className="w-full px-2 py-1.5 bg-surface-secondary border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">--</option>
                  <option value="start">Start</option>
                  <option value="end">End</option>
                  <option value="duration">Duration</option>
                </select>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

/**
 * Cyan-dot indicator shown next to a picker whose value was auto-detected.
 * Uses bg-cyan-500/80 (mid-tone with slight transparency) as the fill.
 * Per feedback_green_400_light_contrast the fill is not 400-level alone —
 * we use 500 which is readable on the light surface.
 */
const AutoDetectedDot: React.FC<{ testId: string }> = ({ testId }) => (
  <span
    data-testid={testId}
    role="img"
    aria-label="Auto-detected"
    className="inline-block w-2 h-2 rounded-full bg-cyan-500/80 flex-shrink-0"
  />
);

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
 *  duration alternative section. */
function buildInitialStartEndMap(
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
