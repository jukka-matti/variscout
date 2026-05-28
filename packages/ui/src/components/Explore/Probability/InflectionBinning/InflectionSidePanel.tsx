/**
 * Side panel UI for the Probability lens inflection-binning workflow.
 *
 * Two layers:
 *
 * - `InflectionSidePanelView` (presentation) — accepts a `controller` prop
 *   (the return of `useInflectionBinningState`) and the `sourceColumn`. Use
 *   this when the hook is lifted to a parent (Dashboard) so that a sibling
 *   chart overlay can read the same `state.cuts` without instantiating a
 *   second state machine.
 *
 * - `InflectionSidePanel` (self-contained) — instantiates the hook internally
 *   from props. This is the convenience API for hosts that don't need to
 *   share cuts with a sibling.
 *
 * Renders one of three layouts based on the state machine in
 * `useInflectionBinningState`:
 *
 *   idle      — once-per-session banner + Detect button
 *   proposing — segment table with stats + rename + remove + "Create bin column"
 *   committed — same table + "Remove binning" CTA at the bottom
 *
 * Per-segment × button semantics: segment K's × removes cut K-1 (merges
 * the segment with its left neighbor). When there are ≥ 2 cuts the button
 * gets an explanatory `title` so the merge direction is explicit.
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
import {
  useInflectionBinningState,
  type UseInflectionBinningStateReturn,
} from './useInflectionBinningState';

// ============================================================================
// Self-contained API (existing — preserved for backward compatibility)
// ============================================================================

export interface InflectionSidePanelProps {
  /** Numeric column being analyzed (the Y of the probability plot). */
  sourceColumn: string;
  /** Raw values from the column (numeric only; caller filters nulls). */
  values: number[];
  /** Sorted ascending value array (precomputed by caller to match the prob plot). */
  sortedValues: number[];
  /** Existing bindings on the active IP. */
  existingBindings: BinnedFactorBinding[];
  /**
   * Patch handler called for every mutation (commit, drag, add, remove, rename).
   *
   * IMPORTANT: this MUST update `existingBindings` synchronously in the same
   * React tick (i.e., a React `setState` call). The state machine reads
   * `existingBindings` to map cut mutations onto the new binding shape; an
   * async-only writer would race with subsequent dispatches. If the upstream
   * persistence layer is async (e.g., Dexie/Blob), wrap it so that the local
   * domain store updates immediately and the async write fires in the
   * background.
   */
  patchBindings: (next: BinnedFactorBinding[]) => void;
}

export function InflectionSidePanel(props: InflectionSidePanelProps) {
  const controller = useInflectionBinningState({
    sourceColumn: props.sourceColumn,
    values: props.values,
    sortedValues: props.sortedValues,
    existingBindings: props.existingBindings,
    patchBindings: props.patchBindings,
  });
  return <InflectionSidePanelView sourceColumn={props.sourceColumn} controller={controller} />;
}

// ============================================================================
// Controller-based API (new — for lifted-hook layouts)
// ============================================================================

export interface InflectionSidePanelViewProps {
  /** Numeric column being analyzed (the Y of the probability plot). */
  sourceColumn: string;
  /** State machine controller — typically `useInflectionBinningState(...)` called by a parent. */
  controller: UseInflectionBinningStateReturn;
}

export function InflectionSidePanelView({
  sourceColumn,
  controller,
}: InflectionSidePanelViewProps) {
  const {
    state,
    canDetect,
    valueCount,
    dismissBanner,
    detectInflections,
    addCut: _addCut,
    removeCut,
    renameLevel,
    commit,
    removeBinning,
  } = controller;
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
        {!canDetect ? (
          <p data-testid="inflection-insufficient-rows" className="text-xs text-content-muted">
            Need ≥30 rows for inflection detection (current: {valueCount})
          </p>
        ) : (
          <>
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
          </>
        )}
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
          cutCount={state.cuts.length}
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
        cutCount={binding.cuts.length}
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

const CONFIRM_REMOVE_MESSAGE_FN = (sourceColumn: string): string =>
  `Remove the bin column? Charts using ${sourceColumn}_bin as a factor will lose this dimension.`;

// ============================================================================
// Segment table — used in both proposing + committed states
// ============================================================================

interface SegmentTableProps {
  segments: SegmentStats[];
  levelNames: string[];
  /**
   * Total cut count (segments.length − 1 in well-formed states). Used to
   * decide whether the per-segment × button needs an explanatory tooltip —
   * with ≥ 2 cuts (i.e. ≥ 3 segments), removing a middle segment's cut
   * collapses it leftward into segment K-1, which is non-obvious to the user.
   */
  cutCount: number;
  onRename: (levelIndex: number, newName: string) => void;
  onRemoveSegment: (segmentIndex: number) => void;
}

function SegmentTable({
  segments,
  levelNames,
  cutCount,
  onRename,
  onRemoveSegment,
}: SegmentTableProps) {
  return (
    <ul className="flex flex-col gap-2" data-testid="inflection-segment-table">
      {segments.map((segment, idx) => (
        <SegmentRow
          key={idx}
          segmentIndex={idx}
          segment={segment}
          levelName={levelNames[idx] ?? ''}
          ambiguousMerge={cutCount >= 2 && idx > 0}
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
  /**
   * True when the × button's effect is non-obvious (middle segments with
   * ≥ 2 cuts in the binding). Renders an explanatory `title` so the user
   * sees the merge direction on hover.
   */
  ambiguousMerge: boolean;
  onRename: (newName: string) => void;
  onRemove: () => void;
}

function SegmentRow({
  segmentIndex,
  segment,
  levelName,
  ambiguousMerge,
  onRename,
  onRemove,
}: SegmentRowProps) {
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
        title={ambiguousMerge ? 'Remove the cut before this segment' : undefined}
      >
        ×
      </button>
    </li>
  );
}
