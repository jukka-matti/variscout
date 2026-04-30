/**
 * TimelineWindowPicker — four-kind window selector with secondary inputs.
 *
 * Renders four pill-style chips (Fixed / Rolling / Open-ended / Cumulative)
 * that switch the active TimelineWindow kind, plus a kind-specific
 * secondary input (date range, days, or start date) when applicable.
 *
 * Uses semantic Tailwind classes per packages/ui/CLAUDE.md hard rule.
 * Pill pattern mirrors DefectTypeSelector for cross-component consistency.
 */

import type { TimelineWindow } from '@variscout/core';

export interface TimelineWindowPickerProps {
  window: TimelineWindow;
  onChange: (w: TimelineWindow) => void;
  className?: string;
}

const KINDS: TimelineWindow['kind'][] = ['fixed', 'rolling', 'openEnded', 'cumulative'];

// TODO(i18n): route through @variscout/core/i18n in V1.5 (Task 16 sweep).
const LABELS: Record<TimelineWindow['kind'], string> = {
  fixed: 'Fixed',
  rolling: 'Rolling',
  openEnded: 'Open-ended',
  cumulative: 'Cumulative',
};

const pillBase =
  'inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border whitespace-nowrap transition-colors cursor-pointer';
const pillActive = 'bg-blue-500 border-blue-500 text-white';
const pillInactive = 'bg-surface-secondary border-edge text-content hover:bg-surface-tertiary';

const inputClass =
  'px-2 py-1 text-xs bg-surface-secondary border border-edge rounded text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50';

/**
 * Build a default TimelineWindow for a given kind. Lazy — `now` is captured
 * at click-time so `openEnded.startISO` means "now-when-clicked", not
 * module-load time.
 */
function defaultForKind(kind: TimelineWindow['kind']): TimelineWindow {
  const now = new Date().toISOString();
  switch (kind) {
    case 'fixed':
      return { kind: 'fixed', startISO: '1970-01-01T00:00:00Z', endISO: now };
    case 'rolling':
      return { kind: 'rolling', windowDays: 30 };
    case 'openEnded':
      return { kind: 'openEnded', startISO: now };
    case 'cumulative':
      return { kind: 'cumulative' };
  }
}

export function TimelineWindowPicker({ window, onChange, className }: TimelineWindowPickerProps) {
  const containerClass = ['flex flex-wrap gap-2 items-center', className].filter(Boolean).join(' ');

  return (
    <div className={containerClass} role="group" aria-label="Timeline window">
      {KINDS.map(kind => {
        const isActive = window.kind === kind;
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={isActive}
            data-testid={`timeline-window-chip-${kind}`}
            className={`${pillBase} ${isActive ? pillActive : pillInactive}`}
            onClick={() => onChange(isActive ? window : defaultForKind(kind))}
          >
            {LABELS[kind]}
          </button>
        );
      })}
      {window.kind === 'fixed' && <FixedRangeInputs window={window} onChange={onChange} />}
      {window.kind === 'rolling' && <RollingDaysInput window={window} onChange={onChange} />}
      {window.kind === 'openEnded' && <OpenEndedStartInput window={window} onChange={onChange} />}
    </div>
  );
}

// Compact secondary-input components — kept in this same file for V1.

function FixedRangeInputs({
  window,
  onChange,
}: {
  window: Extract<TimelineWindow, { kind: 'fixed' }>;
  onChange: (w: TimelineWindow) => void;
}) {
  return (
    <>
      <input
        type="datetime-local"
        aria-label="Start date"
        className={inputClass}
        value={window.startISO.slice(0, 16)}
        onChange={e => onChange({ ...window, startISO: new Date(e.target.value).toISOString() })}
      />
      <input
        type="datetime-local"
        aria-label="End date"
        className={inputClass}
        value={window.endISO.slice(0, 16)}
        onChange={e => onChange({ ...window, endISO: new Date(e.target.value).toISOString() })}
      />
    </>
  );
}

function RollingDaysInput({
  window,
  onChange,
}: {
  window: Extract<TimelineWindow, { kind: 'rolling' }>;
  onChange: (w: TimelineWindow) => void;
}) {
  return (
    <input
      type="number"
      min={1}
      aria-label="Window days"
      className={`${inputClass} w-20`}
      value={window.windowDays}
      onChange={e => onChange({ kind: 'rolling', windowDays: Math.max(1, Number(e.target.value)) })}
    />
  );
}

function OpenEndedStartInput({
  window,
  onChange,
}: {
  window: Extract<TimelineWindow, { kind: 'openEnded' }>;
  onChange: (w: TimelineWindow) => void;
}) {
  return (
    <input
      type="datetime-local"
      aria-label="Start date"
      className={inputClass}
      value={window.startISO.slice(0, 16)}
      onChange={e =>
        onChange({ kind: 'openEnded', startISO: new Date(e.target.value).toISOString() })
      }
    />
  );
}
