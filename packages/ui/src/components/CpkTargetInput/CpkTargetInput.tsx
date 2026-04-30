/**
 * CpkTargetInput — small numeric input for committing a Cpk target value.
 *
 * Presentation-only primitive: caller controls persistence via `onCommit`.
 * Commits on blur and on Enter. Empty input clears the value (commits
 * `undefined`). Invalid numbers reset the input to the last committed value.
 *
 * Used by surfaces that write a cascade level directly (e.g., the Hub
 * Capability tab header writes `processHub.reviewSignal.capability.cpkTarget`).
 *
 * See `docs/05-technical/architecture/capability-target-cascade.md`.
 */
import React, { useEffect, useState } from 'react';

export interface CpkTargetInputProps {
  /** Current committed value. `undefined` renders the placeholder. */
  value: number | undefined;
  /** Called on blur or Enter with the new value (or `undefined` to clear). */
  onCommit: (next: number | undefined) => void;
  /** Optional label rendered before the input (defaults to "Cpk target"). */
  label?: string;
  /** Optional scope chip rendered after the input (e.g. "hub: My Hub"). */
  columnLabel?: string;
  className?: string;
  'data-testid'?: string;
}

function formatValue(v: number | undefined): string {
  return v === undefined ? '' : String(v);
}

export const CpkTargetInput: React.FC<CpkTargetInputProps> = ({
  value,
  onCommit,
  label = 'Cpk target',
  columnLabel,
  className,
  'data-testid': testId,
}) => {
  const [draft, setDraft] = useState<string>(formatValue(value));

  // Sync external value changes into the draft (e.g. cascade resolution).
  useEffect(() => {
    setDraft(formatValue(value));
  }, [value]);

  const commit = (): void => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onCommit(undefined);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      // Reject invalid → reset draft to last committed value.
      setDraft(formatValue(value));
      return;
    }
    onCommit(parsed);
  };

  return (
    <div
      className={className ?? 'flex items-center gap-2 text-xs text-content-secondary'}
      data-testid={testId}
    >
      <label className="text-content-muted">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        value={draft}
        placeholder="—"
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="w-16 rounded border border-edge bg-surface-primary px-1.5 py-0.5 text-xs font-mono text-content focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {columnLabel && <span className="text-content-muted">for {columnLabel}</span>}
    </div>
  );
};

export default CpkTargetInput;
