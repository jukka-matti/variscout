/**
 * BrushToFindingFlow — render-prop wrapper for mini-chart brush confirmation.
 *
 * Holds local state for a pending chart selection (range or category gesture),
 * renders a confirmation panel when a selection is pending, and on confirm
 * calls addFinding + connectFindingToHub directly from the Zustand stores.
 *
 * V1 scope: inline confirmation panel (foreignObject overlay), no click-outside.
 * F5 will subscribe addFinding to HubAction persistence; we don't dispatch
 * FINDING_ADD here.
 */

import React, { useState, useCallback } from 'react';
import type { Hypothesis } from '@variscout/core';
import type { ChartSelection } from '@variscout/core/findings';
import type { FindingSource, FindingContext } from '@variscout/core/findings';
import { useAnalyzeStore, usePreferencesStore } from '@variscout/stores';
import type { CaptureDraft } from '@variscout/hooks';
import { CaptureCard } from '../CaptureCard';

// ── Chart slot position constants (mirrors HypothesisCard slot) ────────────
export const CHART_SLOT_X = 16;
export const CHART_SLOT_Y = 64;
export const CHART_SLOT_W = 360;
export const CHART_SLOT_H = 260;

// ── Component types ──────────────────────────────────────────────────────────

export interface BrushToFindingFlowProps {
  hub: Hypothesis;
  /** Factor column referenced by the hypothesis condition (used for finding source + text). */
  factor: string | undefined;
  /** Outcome column when present (used for stats anchor on i-chart finding). */
  outcomeColumn: string | null;
  /** Underlying rows from the active EvidenceSnapshot — used to compute anchorX/anchorY. */
  rows: ReadonlyArray<Record<string, unknown>>;
  /**
   * Render prop: BrushToFindingFlow gives the child its onBrushEnd + onCategorySelect callbacks.
   * The child wraps MiniIChart / MiniBoxplot with these handlers.
   */
  children: (handlers: {
    onBrushEnd: (range: { startIdx: number; endIdx: number }) => void;
    onCategorySelect: (category: string) => void;
  }) => React.ReactNode;
}

// ── Locale-independent persisted text (stable identifier, analyst can edit) ─

function buildPersistedText(selection: ChartSelection, factor: string | undefined): string {
  if (selection.kind === 'range') {
    return factor
      ? `Brushed indices ${selection.startIdx}-${selection.endIdx} on ${factor}`
      : 'Brushed range';
  }
  return factor ? `Selected category ${selection.category} on ${factor}` : 'Selected category';
}

function buildRangeSource(
  selection: Extract<ChartSelection, { kind: 'range' }>,
  factor: string | undefined,
  outcomeColumn: string | null,
  rows: ReadonlyArray<Record<string, unknown>>
): FindingSource {
  const timeLens = usePreferencesStore.getState().timeLens;
  const midIdx = Math.round((selection.startIdx + selection.endIdx) / 2);
  const anchorRow = rows[midIdx];
  const rawX = factor && anchorRow ? Number(anchorRow[factor]) : midIdx;
  const rawY = outcomeColumn && anchorRow ? Number(anchorRow[outcomeColumn]) : 0;

  return {
    chart: 'ichart',
    anchorX: Number.isFinite(rawX) ? rawX : midIdx,
    anchorY: Number.isFinite(rawY) ? rawY : 0,
    timeLens,
    brushedRange: {
      startIdx: selection.startIdx,
      endIdx: selection.endIdx,
    },
  };
}

function buildCaptureDraft(
  selection: ChartSelection,
  factor: string | undefined,
  outcomeColumn: string | null,
  rows: ReadonlyArray<Record<string, unknown>>
): CaptureDraft {
  if (selection.kind === 'range') {
    const proposedFactorName = `obs ${selection.startIdx + 1}-${selection.endIdx + 1}`;
    return {
      entryKind: 'brush',
      source: buildRangeSource(selection, factor, outcomeColumn, rows),
      activeFilters: {},
      conditionLabel: factor ? `${factor} x ${proposedFactorName}` : proposedFactorName,
      evidenceLabel: `indices ${selection.startIdx}-${selection.endIdx}`,
      note: '',
    };
  }

  return {
    entryKind: 'point',
    source: {
      chart: 'boxplot',
      category: selection.category,
      timeLens: usePreferencesStore.getState().timeLens,
    },
    activeFilters: factor ? { [factor]: [selection.category] } : {},
    conditionLabel: factor ? `${factor} = ${selection.category}` : `category ${selection.category}`,
    evidenceLabel: `category ${selection.category}`,
    note: '',
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function BrushToFindingFlow({
  hub,
  factor,
  outcomeColumn,
  rows,
  children,
}: BrushToFindingFlowProps): React.ReactElement {
  const [pendingSelection, setPendingSelection] = useState<ChartSelection | null>(null);
  const [draft, setDraft] = useState<CaptureDraft | null>(null);

  const onBrushEnd = useCallback(
    (range: { startIdx: number; endIdx: number }) => {
      const nextSelection: ChartSelection = {
        kind: 'range',
        chartType: 'ichart',
        startIdx: range.startIdx,
        endIdx: range.endIdx,
      };
      setPendingSelection(nextSelection);
      setDraft(buildCaptureDraft(nextSelection, factor, outcomeColumn, rows));
    },
    [factor, outcomeColumn, rows]
  );

  const onCategorySelect = useCallback(
    (category: string) => {
      const nextSelection: ChartSelection = { kind: 'category', chartType: 'boxplot', category };
      setPendingSelection(nextSelection);
      setDraft(buildCaptureDraft(nextSelection, factor, outcomeColumn, rows));
    },
    [factor, outcomeColumn, rows]
  );

  const handleCancel = useCallback(() => {
    setPendingSelection(null);
    setDraft(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pendingSelection || !draft) return;
    const store = useAnalyzeStore.getState();

    const text = buildPersistedText(pendingSelection, factor);
    const context: FindingContext = { activeFilters: draft.activeFilters, cumulativeScope: null };

    // F5 will subscribe addFinding to HubAction persistence; we don't dispatch FINDING_ADD here.
    const finding = store.addFinding(text, context, draft.source);
    store.connectFindingToHub(hub.id, finding.id);
    setPendingSelection(null);
    setDraft(null);
  }, [pendingSelection, draft, factor, hub.id]);

  return (
    <>
      {children({ onBrushEnd, onCategorySelect })}
      {draft && (
        <foreignObject x={CHART_SLOT_X} y={CHART_SLOT_Y} width={CHART_SLOT_W} height={CHART_SLOT_H}>
          <CaptureCard
            draft={draft}
            onDraftChange={patch =>
              setDraft(current => (current ? { ...current, ...patch } : current))
            }
            onCapture={handleConfirm}
            onCancel={handleCancel}
          />
        </foreignObject>
      )}
    </>
  );
}
