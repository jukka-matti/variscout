import type {
  ImprovementProject,
  ImprovementProjectFactorControl,
} from '@variscout/core/improvementProject';
import type { Hypothesis, ImprovementIdea, ActionItem } from '@variscout/core/findings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CauseStatus = 'pending-idea' | 'in-progress' | 'resolved' | 'ruled-out';

export interface CauseRow {
  factor: string;
  targetCondition: string;
  hypothesis?: Hypothesis;
  /** All ideas passed for this cause row (caller pre-filters by hypothesis if needed). */
  ideas: ImprovementIdea[];
  /** The selected idea (max 1 per D9). */
  selectedIdea?: ImprovementIdea;
  /** Actions linked to the selected idea via ActionItem.ideaId. */
  actions: ActionItem[];
  /** Derived status pill state. */
  causeStatus: CauseStatus;
}

export interface CauseProjectionInputs {
  hypotheses: readonly Hypothesis[];
  /** Ideas to consider — caller passes all approach ideas; projection selects via `selected` flag. */
  ideas: readonly ImprovementIdea[];
  actions: readonly ActionItem[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function classify(
  hypothesis: Hypothesis | undefined,
  selectedIdea: ImprovementIdea | undefined,
  actions: ActionItem[]
): CauseStatus {
  // Hypothesis explicitly refuted → ruled-out regardless of idea state.
  if (hypothesis?.status === 'refuted') return 'ruled-out';
  if (!selectedIdea) return 'pending-idea';
  if (actions.length === 0) return 'in-progress';
  const allDone = actions.every(a => a.status === 'done');
  return allDone ? 'resolved' : 'in-progress';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure projection: one `CauseRow` per `ImprovementProjectFactorControl`.
 *
 * Design notes (spec D9):
 * - Each factorControl is a SuspectedCause anchored to a Hypothesis via
 *   `linkedHypothesisId`.
 * - `ImprovementIdea` has no per-hypothesis FK; the IP owns all idea IDs in
 *   `sections.approach.improvementIdeaIds`. The caller passes the full set of
 *   ideas; this function selects the one with `selected: true` across all
 *   provided ideas for each row.
 * - `ActionItem.ideaId` is the canonical FK linking an action to an idea.
 * - `ActionItemStatus` is `'open' | 'in-progress' | 'done'`; resolved requires
 *   all actions to have `status === 'done'`.
 */
export function projectCauses(ip: ImprovementProject, inputs: CauseProjectionInputs): CauseRow[] {
  const factorControls: ImprovementProjectFactorControl[] = ip.goal.factorControls ?? [];

  return factorControls.map(fc => {
    const hypothesis = inputs.hypotheses.find(h => h.id === fc.linkedHypothesisId);

    // Ideas: all ideas passed in that are selected=true count; find first selected.
    // Callers may pre-filter by hypothesis binding once ImprovementIdea gains a
    // hypothesis FK — for now we include all and pick selected.
    const allIdeas = inputs.ideas.slice();
    const selectedIdea = allIdeas.find(i => i.selected === true);

    // Actions: linked via ActionItem.ideaId (canonical FK).
    const actions = selectedIdea ? inputs.actions.filter(a => a.ideaId === selectedIdea.id) : [];

    return {
      factor: fc.factor,
      targetCondition: fc.targetCondition,
      hypothesis,
      ideas: allIdeas,
      selectedIdea,
      actions,
      causeStatus: classify(hypothesis, selectedIdea, actions),
    };
  });
}
