/**
 * YPickerSection — FRAME b0 Y-picker UI.
 *
 * Renders the question prompt + a row of `<ColumnCandidateChip />` instances
 * for the user to pick a single Y measure (output / outcome). Once an Y is
 * selected, surfaces a "Selected" subsection at the top with an inline
 * `+ add spec` link (full inline editor lands in W3-5).
 *
 * Hard rules:
 * - Presentational primitive — props-based, no Zustand access (per packages/ui/CLAUDE.md).
 * - i18n via useTranslation hook — no hardcoded English strings.
 * - Semantic Tailwind only (no color-scheme props).
 * - No nested <button> in <button>: `+ add spec` is a separate sibling button.
 */

import type { ReactNode } from 'react';
import { useTranslation } from '@variscout/hooks';
import type { ColumnAnalysis } from '@variscout/core';
import { ColumnCandidateChip } from '../ColumnCandidateChip';

export interface YPickerSectionCandidate {
  /** Column metadata (already-filtered/ranked upstream by rankYCandidates). */
  column: ColumnAnalysis;
  /** Already-extracted numeric values for the chip's sparkline preview. */
  numericValues: readonly number[];
}

export interface YPickerSectionProps {
  /** All ranked Y candidates (already filtered + sorted by rankYCandidates upstream). */
  candidates: ReadonlyArray<YPickerSectionCandidate>;
  /** Currently selected Y column name (or null/undefined for none). */
  selectedY: string | null | undefined;
  /** Fired when a chip is clicked. */
  onSelectY: (columnName: string) => void;
  /** Optional: open the inline spec editor for the selected Y. Wired in W3-5. */
  onAddSpec?: (columnName: string) => void;
  /** Whether the selected Y has a spec set (drives "spec: not set" vs "spec: set" inline). */
  hasSpecForSelected?: boolean;
  /**
   * Optional inline spec editor element. When present, renders as a floating
   * popover anchored to the +add spec trigger inside the selected row. The
   * caller controls open/close state and the editor's lifecycle — this slot
   * just positions whatever ReactNode is passed in.
   */
  inlineSpecEditor?: ReactNode;
  /** Optional className for layout. */
  className?: string;
}

/**
 * Locate the candidate whose column.name matches selectedY, returning
 * undefined when there is no match (or no selection). Used to render the
 * "Selected" subsection without re-iterating the candidate list.
 */
function findSelectedCandidate(
  candidates: ReadonlyArray<YPickerSectionCandidate>,
  selectedY: string | null | undefined
): YPickerSectionCandidate | undefined {
  if (!selectedY) return undefined;
  return candidates.find(c => c.column.name === selectedY);
}

export function YPickerSection({
  candidates,
  selectedY,
  onSelectY,
  onAddSpec,
  hasSpecForSelected,
  inlineSpecEditor,
  className,
}: YPickerSectionProps) {
  const { t } = useTranslation();
  const selected = findSelectedCandidate(candidates, selectedY);

  const headline = t('frame.b0.q1.headline');
  const hint = t('frame.b0.q1.hint');
  const addSpecLabel = t('frame.spec.add');
  // "spec: set" is intentionally a plain English string in this task; the full
  // inline editor (W3-5) introduces the proper "spec: set" i18n key. Until then,
  // we surface the "not set" message via i18n and a stub for the set state.
  const specStatus = hasSpecForSelected ? t('frame.spec.set') : t('frame.spec.notSet');

  const containerClass = ['flex flex-col gap-3', className].filter(Boolean).join(' ');

  return (
    <section
      className={containerClass}
      data-testid="y-picker-section"
      aria-labelledby="y-picker-headline"
    >
      {/* Headline + hint row */}
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2
          id="y-picker-headline"
          className="text-base font-semibold text-content"
          data-testid="y-picker-headline"
        >
          {headline}
        </h2>
        <span className="text-xs text-content-muted" data-testid="y-picker-hint">
          {hint}
        </span>
      </header>

      {/* Empty-state path: no plausible Y candidates */}
      {candidates.length === 0 ? (
        <p className="text-sm text-content-muted italic" data-testid="y-picker-empty">
          {t('frame.b0.q1.empty')}
        </p>
      ) : (
        <>
          {/* "Selected" subsection — only when a chip is currently chosen.
              `relative` makes it the positioned ancestor for the inline spec
              editor popover (rendered below the row, overlapping the candidate
              grid rather than pushing it down). */}
          {selected && (
            <div
              className="relative flex items-center gap-3 flex-wrap rounded-lg border border-edge bg-surface-secondary p-3"
              data-testid="y-picker-selected-row"
            >
              <ColumnCandidateChip
                column={selected.column}
                numericValues={selected.numericValues}
                state="selected-as-Y"
                onClick={() => onSelectY(selected.column.name)}
              />
              <button
                type="button"
                onClick={() => onAddSpec?.(selected.column.name)}
                className="text-xs text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline transition-colors"
                data-testid="y-picker-add-spec"
              >
                {addSpecLabel}
              </button>
              <span className="text-xs text-content-muted" data-testid="y-picker-spec-status">
                {specStatus}
              </span>
              {inlineSpecEditor && (
                <div
                  className="absolute left-3 top-full z-20 mt-2"
                  data-testid="frame-view-b0-spec-editor-anchor"
                >
                  {inlineSpecEditor}
                </div>
              )}
            </div>
          )}

          {/* Candidate chip row — all candidates always visible. The selected
              chip stays here too (it's both surfaced above and present below)
              so the user can see ranking context and re-pick at will. */}
          <div
            className="flex flex-wrap gap-2"
            role="list"
            aria-label={t('frame.b0.aria.yCandidates')}
            data-testid="y-picker-candidate-row"
          >
            {candidates.map(({ column, numericValues }) => {
              const isSelected = column.name === selectedY;
              return (
                <div role="listitem" key={column.name}>
                  <ColumnCandidateChip
                    column={column}
                    numericValues={numericValues}
                    state={isSelected ? 'selected-as-Y' : 'idle'}
                    onClick={() => onSelectY(column.name)}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
