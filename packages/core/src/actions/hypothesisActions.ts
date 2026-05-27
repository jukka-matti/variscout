import type { Hypothesis } from '../findings/types';
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
  | { kind: 'HYPOTHESIS_ARCHIVE'; hypothesisId: Hypothesis['id'] };
