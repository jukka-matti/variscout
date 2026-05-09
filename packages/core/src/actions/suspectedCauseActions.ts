import type { Hypothesis } from '../findings/types';
import type { ProcessHubInvestigation } from '../processHub';

export type SuspectedCauseAction =
  | {
      kind: 'SUSPECTED_CAUSE_ADD';
      investigationId: ProcessHubInvestigation['id'];
      cause: Hypothesis;
    }
  | {
      kind: 'SUSPECTED_CAUSE_UPDATE';
      causeId: Hypothesis['id'];
      patch: Partial<Hypothesis>;
    }
  | { kind: 'SUSPECTED_CAUSE_ARCHIVE'; causeId: Hypothesis['id'] };
