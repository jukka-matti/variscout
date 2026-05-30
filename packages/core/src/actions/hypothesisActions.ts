import type { DisconfirmationAttempt, Hypothesis } from '../findings/types';
import type { ProcessHubAnalyze } from '../processHub';

export type HypothesisAction =
  | {
      kind: 'HYPOTHESIS_ADD';
      investigationId: ProcessHubAnalyze['id'];
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
       * (`deriveHypothesisStatus`) reflects it — a `survived` attempt + ≥2
       * evidence types promotes to `confirmed`; a `pending` attempt holds the
       * hypothesis at `needs-disconfirmation`.
       */
      kind: 'HYPOTHESIS_RECORD_DISCONFIRMATION';
      hypothesisId: Hypothesis['id'];
      attempt: DisconfirmationAttempt;
    };
