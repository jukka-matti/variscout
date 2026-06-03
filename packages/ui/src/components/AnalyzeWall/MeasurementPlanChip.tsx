/**
 * MeasurementPlanChip — compact one-row DOM display of a MeasurementPlan plus,
 * in PR-CS-11 (Task 5), the analyst's APPLY surface for it:
 *
 *   1. The re-ingest pending-match prompt ("hints navigate, chips apply"). The
 *      chip is the ONE place the analyst applies a needed factor that just
 *      arrived on re-ingest — Link finding… (reuses the existing onLinkFinding
 *      flow), Mark in-progress (one-click, only while planned), and a dismiss.
 *   2. The analyst-owned 4-state plan-status select (planned | in-progress |
 *      complete | skipped) — free choice, no validation, no auto-anything; the
 *      CS-10 hypothesis-status pattern re-applied. Gated on edit rights.
 *
 * Pure DOM component (no SVG). Mounted inside <HypothesisCard> via foreignObject.
 * Presentational — props-based, no store access. It receives the pending match +
 * callbacks; it never computes which factor matched, nor dispatches actions.
 */

import type { MeasurementPlan, MeasurementPlanStatus } from '@variscout/core/measurementPlan';
import { getMessage } from '@variscout/core/i18n';
import { useWallLocale } from './hooks/useWallLocale';

/**
 * A re-ingest pending match surfaced to THIS chip (one plan). The host computes
 * it from the engine's `ReingestPendingMatch` descriptors (Task 6); the chip
 * only renders + dispatches the analyst's decision back via callbacks.
 */
export interface MeasurementPlanChipPendingMatch {
  /** The descriptor's deterministic id (`${planId}:${column}`) — echoed to dismiss. */
  id: string;
  /** The newly-arrived dataset column this plan needs. */
  column: string;
}

export interface MeasurementPlanChipProps {
  plan: MeasurementPlan;
  ownerName: string;
  canEdit: boolean;
  onEdit: (planId: MeasurementPlan['id']) => void;
  onLinkFinding: (planId: MeasurementPlan['id']) => void;
  /**
   * PR-CS-11 — the re-ingest pending match for this plan (a needed factor just
   * arrived). When provided AND `canEdit`, the chip renders the apply prompt.
   * `null`/omitted → the quiet default (no prompt). The host resolves the match
   * for this plan from the engine descriptors.
   */
  pendingMatch?: MeasurementPlanChipPendingMatch | null;
  /**
   * PR-CS-11 — analyst-owned plan-status setter. When wired AND `canEdit`, the
   * chip renders the 4-state status select (free choice, no validation) and, in
   * the pending prompt, the one-click "Mark in-progress" (shown only while the
   * plan is still `planned`). Omit to hide both the select and Mark in-progress.
   */
  onSetPlanStatus?: (planId: MeasurementPlan['id'], status: MeasurementPlanStatus) => void;
  /**
   * PR-CS-11 — dismiss this pending match. Called with the descriptor id. The
   * host drops the match so it stops re-surfacing. Omit to hide the dismiss ✕.
   */
  onDismissPendingMatch?: (id: string) => void;
}

const STATUS_INDICATOR: Record<MeasurementPlan['status'], { icon: string; className: string }> = {
  planned: { icon: '⏳', className: 'text-amber-500' },
  'in-progress': { icon: '⏳', className: 'text-amber-500' },
  complete: { icon: '✓', className: 'text-green-700' },
  skipped: { icon: '✗', className: 'text-gray-500' },
};

/**
 * PR-CS-11 — the 4 analyst-selectable plan statuses (free choice — the select
 * offers every state, no gating). Order mirrors the collection progression.
 */
const PLAN_STATUS_OPTIONS: ReadonlyArray<MeasurementPlanStatus> = [
  'planned',
  'in-progress',
  'complete',
  'skipped',
];

/** PR-CS-11 — status → i18n label key (reuses the existing `wall.collect.status.*`). */
const PLAN_STATUS_LABEL_KEY: Record<MeasurementPlanStatus, Parameters<typeof getMessage>[1]> = {
  planned: 'wall.collect.status.planned',
  'in-progress': 'wall.collect.status.inProgress',
  complete: 'wall.collect.status.complete',
  skipped: 'wall.collect.status.skipped',
};

export function MeasurementPlanChip({
  plan,
  ownerName,
  canEdit,
  onEdit,
  onLinkFinding,
  pendingMatch,
  onSetPlanStatus,
  onDismissPendingMatch,
}: MeasurementPlanChipProps) {
  const locale = useWallLocale();
  const indicator = STATUS_INDICATOR[plan.status];
  const showLinkButton = canEdit && (plan.status === 'planned' || plan.status === 'in-progress');

  // PR-CS-11 — the pending-match prompt is the analyst's apply surface. Shown
  // only when the host supplies a match AND the user can edit. Gated exactly like
  // the chip's existing edit affordances.
  const showPendingPrompt = canEdit && Boolean(pendingMatch);
  // "Mark in-progress" is a one-click status bump — meaningful only while the
  // plan is still `planned` (and only when the setter is wired).
  const showMarkInProgress = Boolean(onSetPlanStatus) && plan.status === 'planned';
  // The analyst-owned status select. Same edit gate as CS-10's hypothesis
  // status control: shown when the parent wires onSetPlanStatus AND the user
  // can edit. Free choice — no validation, no auto-anything.
  const showStatusSelect = canEdit && Boolean(onSetPlanStatus);

  return (
    <div className="flex flex-col">
      {/* PR-CS-11 — re-ingest pending-match prompt. An accent that reads as
          "new info" (info/blue family, V1 surface palette). "Link finding…"
          reuses the chip's existing onLinkFinding open-picker path. */}
      {showPendingPrompt && pendingMatch && (
        <div
          data-testid="pending-match-prompt"
          className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-900"
        >
          <span className="flex-1 min-w-0">
            {getMessage(locale, 'wall.collect.pending.prompt').replace(
              '{column}',
              pendingMatch.column
            )}
          </span>
          <button
            type="button"
            data-testid="pending-link-finding"
            className="flex-shrink-0 font-medium text-blue-700 underline hover:text-blue-900"
            onClick={() => onLinkFinding(plan.id)}
          >
            {getMessage(locale, 'wall.collect.pending.linkFinding')}
          </button>
          {showMarkInProgress && (
            <button
              type="button"
              data-testid="pending-mark-in-progress"
              className="flex-shrink-0 rounded border border-blue-300 px-1.5 py-0.5 text-blue-800 hover:bg-blue-100"
              onClick={() => onSetPlanStatus?.(plan.id, 'in-progress')}
            >
              {getMessage(locale, 'wall.collect.pending.markInProgress')}
            </button>
          )}
          <button
            type="button"
            data-testid="pending-match-dismiss"
            aria-label={getMessage(locale, 'wall.collect.pending.dismiss')}
            className="flex-shrink-0 text-blue-500 hover:text-blue-800"
            onClick={() => onDismissPendingMatch?.(pendingMatch.id)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Plan summary row. */}
      <div
        data-testid="chip-body"
        role={canEdit ? 'button' : undefined}
        aria-label={canEdit ? `Edit plan for ${plan.primaryFactor}, ${plan.method}` : undefined}
        className={`flex items-center gap-2 px-2 py-1 text-sm border-b border-gray-200 ${
          canEdit ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={canEdit ? () => onEdit(plan.id) : undefined}
        onKeyDown={
          canEdit
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') onEdit(plan.id);
              }
            : undefined
        }
        tabIndex={canEdit ? 0 : undefined}
      >
        <span data-testid="status-indicator" className={`font-semibold ${indicator.className}`}>
          {indicator.icon}
        </span>
        <span className="text-gray-600">{plan.method}</span>
        <span className="text-gray-400">•</span>
        <span className="font-medium">{plan.primaryFactor}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">n={plan.sampleSize}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">{ownerName}</span>
        {showLinkButton && (
          <button
            type="button"
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline"
            onClick={e => {
              e.stopPropagation();
              onLinkFinding(plan.id);
            }}
          >
            Link Finding…
          </button>
        )}
      </div>

      {/* PR-CS-11 — the analyst-owned 4-state plan-status select. Free choice
          (every state offered, no gating, no validation, no auto-anything) —
          the CS-10 hypothesis-status pattern re-applied. Rendered outside the
          clickable chip body so changing status never fires the edit handler. */}
      {showStatusSelect && (
        <label className="flex items-center gap-1.5 border-b border-gray-200 px-2 py-1 text-xs text-gray-600">
          <span className="flex-shrink-0">{getMessage(locale, 'wall.collect.setStatusLabel')}</span>
          <select
            data-testid="plan-status-select"
            aria-label={getMessage(locale, 'wall.collect.setStatusLabel')}
            className="flex-1 rounded border border-gray-300 px-1.5 py-0.5 text-xs"
            value={plan.status}
            onChange={e => onSetPlanStatus?.(plan.id, e.target.value as MeasurementPlanStatus)}
          >
            {PLAN_STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {getMessage(locale, PLAN_STATUS_LABEL_KEY[s])}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
