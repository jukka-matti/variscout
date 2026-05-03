/**
 * XPickerSection — FRAME b0 X-picker UI.
 *
 * Multi-select picker for X candidates (factors / inputs) that reveals after
 * the user has chosen a Y. Renders the question prompt + a "Selected" subsection
 * (when any X is selected) + an "Available" subsection of unselected chips.
 * Optionally surfaces an auto-detected run-order column as a small grey hint
 * beneath (read-only — not a chip; not interactive).
 *
 * Mirrors the structural pattern from W3-3 `<YPickerSection />`. Differences:
 * - Multi-select (an array of selected names) instead of single Y.
 * - No inline "+ add spec" link (specs are Y-only at this stage).
 * - Run-order hint footer (Y picker has no equivalent).
 *
 * Hard rules:
 * - Presentational primitive — props-based, no Zustand access (per packages/ui/CLAUDE.md).
 * - i18n via useTranslation hook — no hardcoded English strings.
 * - Semantic Tailwind only (no color-scheme props).
 * - Single <button> per chip; never nested.
 *
 * Note on "Selected" / "Available" sectioning: visual structure does the work
 * here — the selected row sits in a bordered surface-secondary container, the
 * available row sits flush below. No explicit "Selected:" label is rendered,
 * matching YPickerSection's pattern (which also uses container styling, not a
 * label, to mark the selected row). This avoids hardcoded English text and
 * keeps the picker visually aligned with the Y-picker.
 */

import { useTranslation } from '@variscout/hooks';
import type { ColumnAnalysis } from '@variscout/core';
import { ColumnCandidateChip } from '../ColumnCandidateChip';

export interface XCandidate {
  /** Column metadata (already filtered upstream to "not Y, not run-order, plausible"). */
  column: ColumnAnalysis;
  /** For numeric chips — already-extracted values for sparkline. */
  numericValues?: readonly number[];
  /** For categorical chips — level breakdown. */
  levels?: ReadonlyArray<{ label: string; count: number }>;
}

export interface XPickerSectionProps {
  /** All X candidates (already filtered to "not Y, not run-order, plausible"). */
  candidates: ReadonlyArray<XCandidate>;
  /** Names of currently selected X columns. */
  selectedXs: readonly string[];
  /** Fired when a chip is clicked — toggles selection. */
  onToggleX: (columnName: string) => void;
  /** The auto-detected run-order column (datetime). Shown beneath, never in picker. */
  runOrderColumn?: string | null;
  /** Optional className for layout. */
  className?: string;
}

/**
 * Partition candidates into (selected, available) preserving the upstream
 * ranking order within each subsection. We render selected chips above
 * available chips so the user can scan their current picks at a glance
 * without losing the remaining-options context.
 */
function partitionCandidates(
  candidates: ReadonlyArray<XCandidate>,
  selectedXs: readonly string[]
): { selected: XCandidate[]; available: XCandidate[] } {
  const selectedSet = new Set(selectedXs);
  const selected: XCandidate[] = [];
  const available: XCandidate[] = [];
  for (const c of candidates) {
    if (selectedSet.has(c.column.name)) selected.push(c);
    else available.push(c);
  }
  return { selected, available };
}

export function XPickerSection({
  candidates,
  selectedXs,
  onToggleX,
  runOrderColumn,
  className,
}: XPickerSectionProps) {
  const { t, tf } = useTranslation();

  const headline = t('frame.b0.q2.headline');
  const hint = t('frame.b0.q2.hint');

  const containerClass = ['flex flex-col gap-3', className].filter(Boolean).join(' ');

  const { selected, available } = partitionCandidates(candidates, selectedXs);
  const hasSelection = selected.length > 0;

  return (
    <section
      className={containerClass}
      data-testid="x-picker-section"
      aria-labelledby="x-picker-headline"
    >
      {/* Headline + hint row */}
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2
          id="x-picker-headline"
          className="text-base font-semibold text-content"
          data-testid="x-picker-headline"
        >
          {headline}
        </h2>
        <span className="text-xs text-content-muted" data-testid="x-picker-hint">
          {hint}
        </span>
      </header>

      {/* Empty-state path: no X candidates available. */}
      {candidates.length === 0 ? (
        <p className="text-sm text-content-muted italic" data-testid="x-picker-empty">
          {t('frame.b0.q2.empty')}
        </p>
      ) : (
        <>
          {/* "Selected" subsection — only when at least one X chosen.
              Bordered surface-secondary container (matches YPickerSection's
              selected-row styling) signals the picked group visually. */}
          {hasSelection && (
            <div
              className="flex flex-wrap gap-2 rounded-lg border border-edge bg-surface-secondary p-3"
              role="list"
              aria-label={t('frame.b0.aria.selectedXs')}
              data-testid="x-picker-selected-row"
            >
              {selected.map(({ column, numericValues, levels }) => (
                <div role="listitem" key={column.name}>
                  <ColumnCandidateChip
                    column={column}
                    numericValues={numericValues}
                    levels={levels}
                    state="selected-as-X"
                    onClick={() => onToggleX(column.name)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* "Available" subsection — unselected chips in idle state. */}
          {available.length > 0 && (
            <div
              className="flex flex-wrap gap-2"
              role="list"
              aria-label={t('frame.b0.aria.availableXs')}
              data-testid="x-picker-available-row"
            >
              {available.map(({ column, numericValues, levels }) => (
                <div role="listitem" key={column.name}>
                  <ColumnCandidateChip
                    column={column}
                    numericValues={numericValues}
                    levels={levels}
                    state="idle"
                    onClick={() => onToggleX(column.name)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Run-order hint footer — not a chip; not interactive. role="note"
          tells screen readers this is metadata, not a selectable element. */}
      {runOrderColumn && (
        <p role="note" className="text-xs text-content-muted" data-testid="x-picker-run-order-hint">
          {tf('frame.b0.runOrderHint', { column: runOrderColumn })}
        </p>
      )}
    </section>
  );
}
