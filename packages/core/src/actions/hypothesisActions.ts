import type { DisconfirmationAttempt, Hypothesis, ActionItem } from '../findings/types';

export type HypothesisAction =
  | {
      kind: 'HYPOTHESIS_ADD';
      hypothesis: Hypothesis;
    }
  | {
      kind: 'HYPOTHESIS_UPDATE';
      hypothesisId: Hypothesis['id'];
      patch: Partial<Omit<Hypothesis, 'id' | 'createdAt' | 'deletedAt'>>;
    }
  | { kind: 'HYPOTHESIS_ARCHIVE'; hypothesisId: Hypothesis['id'] }
  | {
      /**
       * Record a falsification attempt against a hypothesis (IM-4a). Appends to
       * `Hypothesis.disconfirmationAttempts[]`; the derived status
       * (`deriveHypothesisStatus`) reflects it advisorily — a `survived` attempt
       * + ≥2 evidence types makes the suggestion `evidence-survived-test`; a
       * `pending` attempt holds at `needs-disconfirmation`. Status is
       * analyst-owned (CS-10); this records the attempt only.
       */
      kind: 'HYPOTHESIS_RECORD_DISCONFIRMATION';
      hypothesisId: Hypothesis['id'];
      attempt: DisconfirmationAttempt;
    }
  | {
      /**
       * Task 3 (IM-4b) — add a general ActionItem task to a hypothesis.
       * Reuses the ActionItem model (assignee/dueDate/completedAt).
       * Distinct from MEASUREMENT_PLAN_ADD (no primaryFactor/method here).
       */
      kind: 'HYPOTHESIS_ACTION_ADD';
      hypothesisId: Hypothesis['id'];
      actionItem: ActionItem;
    }
  | {
      /** Task 3 (IM-4b) — update text/assignee/dueDate on a hypothesis action item. */
      kind: 'HYPOTHESIS_ACTION_UPDATE';
      hypothesisId: Hypothesis['id'];
      actionId: ActionItem['id'];
      patch: Partial<Pick<ActionItem, 'text' | 'assignee' | 'dueDate'>>;
    }
  | {
      /** Task 3 (IM-4b) — soft-complete a hypothesis action item (sets completedAt). */
      kind: 'HYPOTHESIS_ACTION_COMPLETE';
      hypothesisId: Hypothesis['id'];
      actionId: ActionItem['id'];
      completedAt: number;
    };
