/**
 * IM-3 re-evaluation (core-pure) — the REPLACE-cascade missing-column pass.
 *
 * When a re-ingest REPLACES data and some columns disappear, conditions that
 * reference a now-absent column become un-evaluable. Per LOCKED #3 we FLAG these,
 * NEVER delete them — no silent orphaning.
 *
 * # TELEMETRY-ONLY CONTRACT (REPLACE branch)
 *
 * The no-silent-orphan guarantee (spec §7.2) is provided by the REACTIVE WallCanvas
 * badge: `conditionHasMissingColumn(hub.condition, columnSet)` in `WallCanvas.tsx`
 * re-evaluates on every render against the live column set, so the badge is always
 * current without any persisted record. This helper is the pure, testable computation
 * behind that badge + the hook's `onMissingColumns` logging/telemetry callback.
 *
 * IM-3 does NOT persist a missing-column record for the REPLACE path, and does NOT
 * dispatch any HubAction from this branch. Persisting a separate missing-column
 * record would be redundant with the reactive badge and would add a second source of
 * truth that can drift (spec §4.5/§5.2 — REPLACE-path telemetry-only contract). If a future initiative
 * needs persisted column-gap alerts (e.g. push notifications to plan owners), that
 * is an explicit scope extension — not implicit in the current design.
 *
 * PLANS ONLY auto-link (LOCKED #1) — but the missing-column FLAG legitimately covers
 * hypotheses/findings (the things that own conditions). This helper only REPORTS
 * which entities are affected; it returns no delete/mutate instructions.
 */

import { conditionHasMissingColumn } from '../findings/hypothesisCondition';
import type { Hypothesis } from '../findings/types';

/** Report of which condition-bearing entities reference now-absent columns. */
export interface MissingColumnFlags {
  /** Hypothesis ids whose `condition` references at least one absent column. */
  hypothesisIds: string[];
}

/**
 * Compute which hypotheses reference a column not present in `availableColumns`.
 *
 * Pure + order-preserving (follows `hypotheses` order). A hypothesis with no
 * `condition` is never flagged (`conditionHasMissingColumn(undefined, …) === false`).
 * NOTHING is deleted — the caller surfaces the flag (badge) and leaves the entity
 * intact so the analyst can re-supply the column or edit the condition.
 */
export function computeMissingColumnFlags(
  hypotheses: readonly Hypothesis[],
  availableColumns: ReadonlySet<string>
): MissingColumnFlags {
  const hypothesisIds: string[] = [];
  for (const h of hypotheses) {
    if (conditionHasMissingColumn(h.condition, availableColumns)) {
      hypothesisIds.push(h.id);
    }
  }
  return { hypothesisIds };
}
