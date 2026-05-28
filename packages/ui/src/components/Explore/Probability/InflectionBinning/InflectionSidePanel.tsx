/**
 * Side panel UI for the Probability lens inflection-binning workflow.
 *
 * Renders one of three layouts based on the state machine in
 * `useInflectionBinningState`:
 *
 *   idle      — once-per-session banner + Detect button
 *   proposing — segment table with stats + rename + remove + "Create bin column"
 *   committed — same table + "Remove binning" CTA at the bottom
 *
 * Direct manipulation in committed state: every drag / add / remove / rename
 * patches the active IP immediately (no second confirm step). Matches
 * Figma / Tableau direct-manipulation discipline.
 *
 * Styling uses semantic Tailwind tokens (`bg-surface-secondary`, `text-content`,
 * `border-edge`) and `chartColors.control` (cyan-500) for inflection
 * affordances — never hardcoded hex colors, never `dark:` variants.
 *
 * @module Explore/Probability/InflectionBinning/InflectionSidePanel
 */

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { BinnedFactorBinding, SegmentStats } from '@variscout/core/binning';
import { formatStatistic } from '@variscout/core/i18n';
import { useInflectionBinningState } from './useInflectionBinningState';

export interface InflectionSidePanelProps {
  /** Numeric column being analyzed (the Y of the probability plot). */
  sourceColumn: string;
  /** Raw values from the column (numeric only; caller filters nulls). */
  values: number[];
  /** Sorted ascending value array (precomputed by caller to match the prob plot). */
  sortedValues: number[];
  /** Existing bindings on the active IP. */
  existingBindings: BinnedFactorBinding[];
  /** Patch handler called for every mutation (commit, drag, add, remove, rename). */
  patchBindings: (next: BinnedFactorBinding[]) => void;
}

const CONFIRM_REMOVE_MESSAGE_FN = (sourceColumn: string): string =>
  `Remove the bin column? Charts using ${sourceColumn}_bin as a factor will lose this dimension.`;

export function InflectionSidePanel({
  sourceColumn,
  values,
  sortedValues,
  existingBindings,
  patchBindings,
}: InflectionSidePanelProps) {
  const {
    state,
    dismissBanner,
    detectInflections,
    addCut: _addCut,
    removeCut,
    renameLevel,
    commit,
    removeBinning,
  } = useInflectionBinningState({
    sourceColumn,
    values,
    sortedValues,
    existingBindings,
    patchBindings,
  });
  // `addCut` is reserved for future direct-canvas affordances (click on the prob
  // plot to add a cut). The panel does not expose a separate "+ Add" control
  // today — V1 ships with detect → drag → remove only.
  void _addCut;

  // ── State A: idle ────────────────────────────────────────────────────────
  if (state.kind === 'idle') {
    return (
      <aside
        data-testid="inflection-side-panel"
        className="flex flex-col gap-3 border border-edge bg-surface-secondary p-3 text-sm text-content"
        aria-label="Inflection binning"
      >
        {state.canShowBanner && (
          <div
            data-testid="inflection-banner"
            className="flex items-start gap-2 rounded border border-edge bg-surface-tertiary p-2"
          >
            <span aria-hidden="true">💡</span>
            <p className="flex-1 text-content">
              We can detect inflection points on this column — try?
            </p>
            <button
              type="button"
              data-testid="dismiss-inflection-banner"
              onClick={dismissBanner}
              className="rounded p-0.5 text-content hover:bg-surface-hover"
              aria-label="Dismiss inflection suggestion"
            >
              ×
            </button>
          </div>
        )}
        <button
          type="button"
          data-testid="detect-inflections-button"
          onClick={detectInflections}
          className="rounded border border-edge bg-surface-secondary px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-hover"
        >
          Detect inflections
        </button>
      </aside>
    );
  }

  // ── State B: proposing ───────────────────────────────────────────────────
  if (state.kind === 'proposing') {
    return (
      <aside
        data-testid="inflection-side-panel"
        className="flex flex-col gap-3 border border-edge bg-surface-secondary p-3 text-sm text-content"
        aria-label="Inflection binning"
      >
        <header className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-content">Proposed bins from {sourceColumn}</h3>
          <p className="text-xs text-content-secondary">
            {state.cuts.length} cut{state.cuts.length === 1 ? '' : 's'} · {state.segments.length}{' '}
            level{state.segments.length === 1 ? '' : 's'}
          </p>
        </header>

        <SegmentTable
          segments={state.segments}
          levelNames={state.levelNames}
          onRename={renameLevel}
          onRemoveSegment={segmentIdx =>
            removeCut(Math.max(0, segmentIdx === 0 ? 0 : segmentIdx - 1))
          }
        />

        <button
          type="button"
          data-testid="create-bin-column-button"
          onClick={commit}
          disabled={state.cuts.length === 0}
          className="self-end rounded bg-cyan-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create bin column →
        </button>
      </aside>
    );
  }

  // ── State C: committed ───────────────────────────────────────────────────
  const { binding, segments } = state;
  const handleRemoveBinning = () => {
    if (window.confirm(CONFIRM_REMOVE_MESSAGE_FN(sourceColumn))) {
      removeBinning();
    }
  };

  return (
    <aside
      data-testid="inflection-side-panel"
      className="flex flex-col gap-3 border border-edge bg-surface-secondary p-3 text-sm text-content"
      aria-label="Inflection binning"
    >
      <header className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-content">{sourceColumn}_bin</h3>
        <p className="text-xs text-content-secondary">
          {binding.cuts.length} cut{binding.cuts.length === 1 ? '' : 's'} · {segments.length} level
          {segments.length === 1 ? '' : 's'}
        </p>
      </header>

      <SegmentTable
        segments={segments}
        levelNames={binding.levelNames}
        onRename={renameLevel}
        onRemoveSegment={segmentIdx =>
          removeCut(Math.max(0, segmentIdx === 0 ? 0 : segmentIdx - 1))
        }
      />

      <button
        type="button"
        data-testid="remove-binning-button"
        onClick={handleRemoveBinning}
        className="self-end rounded border border-edge bg-surface-secondary px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-hover"
      >
        Remove binning
      </button>
    </aside>
  );
}

// ============================================================================
// Segment table — used in both proposing + committed states
// ============================================================================

interface SegmentTableProps {
  segments: SegmentStats[];
  levelNames: string[];
  onRename: (levelIndex: number, newName: string) => void;
  onRemoveSegment: (segmentIndex: number) => void;
}

function SegmentTable({ segments, levelNames, onRename, onRemoveSegment }: SegmentTableProps) {
  return (
    <ul className="flex flex-col gap-2" data-testid="inflection-segment-table">
      {segments.map((segment, idx) => (
        <SegmentRow
          key={idx}
          segmentIndex={idx}
          segment={segment}
          levelName={levelNames[idx] ?? ''}
          onRename={newName => onRename(idx, newName)}
          onRemove={() => onRemoveSegment(idx)}
        />
      ))}
    </ul>
  );
}

interface SegmentRowProps {
  segmentIndex: number;
  segment: SegmentStats;
  levelName: string;
  onRename: (newName: string) => void;
  onRemove: () => void;
}

function SegmentRow({ segmentIndex, segment, levelName, onRename, onRemove }: SegmentRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(levelName);

  const startEdit = () => {
    setDraft(levelName);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed !== levelName) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(levelName);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <li
      data-testid={`inflection-segment-row-${segmentIndex}`}
      className="flex items-center gap-2 rounded border border-edge bg-surface-primary px-2 py-1.5"
    >
      <span className="text-xs font-medium text-content-secondary">Seg {segmentIndex + 1}</span>
      {editing ? (
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          aria-label={`Rename segment ${segmentIndex + 1}`}
          data-testid={`inflection-segment-rename-input-${segmentIndex}`}
          className="min-w-0 flex-shrink-0 rounded border border-edge bg-surface-primary px-1.5 py-0.5 text-sm text-content"
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          data-testid={`inflection-segment-label-${segmentIndex}`}
          className="rounded px-1 py-0.5 text-left text-sm text-content hover:bg-surface-hover"
          aria-label={`Rename segment ${segmentIndex + 1} (current label ${levelName})`}
        >
          {levelName}
        </button>
      )}
      <span className="flex-1 truncate text-xs text-content-secondary">
        n={segment.n} · {formatStatistic(segment.percentShare, 'en', 0)}%
        {segment.mean !== undefined && <> · mean {formatStatistic(segment.mean)}</>}
        {segment.adPValue !== undefined && (
          <> · AD p={formatStatistic(segment.adPValue, 'en', 3)}</>
        )}
      </span>
      <button
        type="button"
        onClick={onRemove}
        data-testid={`inflection-segment-remove-${segmentIndex}`}
        className="rounded p-0.5 text-content-secondary hover:bg-surface-hover hover:text-content"
        aria-label={`Remove segment ${segmentIndex + 1}`}
      >
        ×
      </button>
    </li>
  );
}
