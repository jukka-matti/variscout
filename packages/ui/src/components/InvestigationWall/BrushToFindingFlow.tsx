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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Hypothesis } from '@variscout/core';
import type { ChartSelection } from '@variscout/core/findings';
import type { FindingSource, FindingContext } from '@variscout/core/findings';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import { useInvestigationStore, usePreferencesStore } from '@variscout/stores';
import { useWallLocale } from './hooks/useWallLocale';

// ── Chart slot position constants (mirrors HypothesisCard slot) ────────────
export const CHART_SLOT_X = 16;
export const CHART_SLOT_Y = 64;
export const CHART_SLOT_W = 248;
export const CHART_SLOT_H = 80;

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

// ── Component ────────────────────────────────────────────────────────────────

export function BrushToFindingFlow({
  hub,
  factor,
  outcomeColumn,
  rows,
  children,
}: BrushToFindingFlowProps): React.ReactElement {
  const locale = useWallLocale();
  const [pendingSelection, setPendingSelection] = useState<ChartSelection | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingSelection) {
      dialogRef.current?.focus();
    }
  }, [pendingSelection]);

  const onBrushEnd = useCallback((range: { startIdx: number; endIdx: number }) => {
    setPendingSelection({
      kind: 'range',
      chartType: 'ichart',
      startIdx: range.startIdx,
      endIdx: range.endIdx,
    });
  }, []);

  const onCategorySelect = useCallback((category: string) => {
    setPendingSelection({ kind: 'category', chartType: 'boxplot', category });
  }, []);

  const handleCancel = useCallback(() => {
    setPendingSelection(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pendingSelection) return;

    const timeLens = usePreferencesStore.getState().timeLens;
    const store = useInvestigationStore.getState();

    const text = buildPersistedText(pendingSelection, factor);
    const context: FindingContext = { activeFilters: {}, cumulativeScope: null };

    let source: FindingSource;
    if (pendingSelection.kind === 'range') {
      const midIdx = Math.round((pendingSelection.startIdx + pendingSelection.endIdx) / 2);
      const anchorRow = rows[midIdx];
      const rawX = factor && anchorRow ? Number(anchorRow[factor]) : midIdx;
      const rawY = outcomeColumn && anchorRow ? Number(anchorRow[outcomeColumn]) : 0;
      source = {
        chart: 'ichart',
        anchorX: Number.isFinite(rawX) ? rawX : midIdx,
        anchorY: Number.isFinite(rawY) ? rawY : 0,
        timeLens,
        brushedRange: {
          startIdx: pendingSelection.startIdx,
          endIdx: pendingSelection.endIdx,
        },
      };
    } else {
      source = {
        chart: 'boxplot',
        category: pendingSelection.category,
        timeLens,
      };
    }

    // F5 will subscribe addFinding to HubAction persistence; we don't dispatch FINDING_ADD here.
    const finding = store.addFinding(text, context, source);
    store.connectFindingToHub(hub.id, finding.id);
    setPendingSelection(null);
  }, [pendingSelection, factor, outcomeColumn, rows, hub.id]);

  // ── Localised dialog summary ─────────────────────────────────────────────

  let dialogSummary = '';
  if (pendingSelection) {
    if (pendingSelection.kind === 'range') {
      dialogSummary = factor
        ? formatMessage(locale, 'wall.brush.confirmIChart', {
            start: pendingSelection.startIdx,
            end: pendingSelection.endIdx,
            factor,
          })
        : getMessage(locale, 'wall.brush.confirmIChartNoFactor');
    } else {
      dialogSummary = factor
        ? formatMessage(locale, 'wall.brush.confirmBoxplot', {
            category: pendingSelection.category,
            factor,
          })
        : formatMessage(locale, 'wall.brush.confirmBoxplotNoFactor', {
            category: pendingSelection.category,
          });
    }
  }

  const pinLabel = getMessage(locale, 'wall.brush.pin');
  const cancelLabel = getMessage(locale, 'wall.brush.cancel');
  const dialogAriaLabel = getMessage(locale, 'wall.brush.dialogAriaLabel');

  return (
    <>
      {children({ onBrushEnd, onCategorySelect })}
      {pendingSelection && (
        <foreignObject x={CHART_SLOT_X} y={CHART_SLOT_Y} width={CHART_SLOT_W} height={CHART_SLOT_H}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={dialogAriaLabel}
            className="flex h-full w-full flex-col items-center justify-center gap-1 rounded bg-surface-secondary px-3 py-1 shadow-sm ring-1 ring-edge text-xs"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Escape') handleCancel();
            }}
          >
            <p className="text-center text-content leading-tight">{dialogSummary}</p>
            <div className="flex gap-2">
              <button
                className="rounded bg-brand px-2 py-0.5 font-medium text-white hover:bg-brand-hover"
                onClick={handleConfirm}
              >
                {pinLabel}
              </button>
              <button
                className="rounded bg-surface px-2 py-0.5 text-content-muted ring-1 ring-edge hover:bg-surface-hover"
                onClick={handleCancel}
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </foreignObject>
      )}
    </>
  );
}
