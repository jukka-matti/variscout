import type { SuspectedCause } from '../findings/types';
import type { ProcessHubInvestigation } from '../processHub';

export type SuspectedCauseAction =
  | {
      kind: 'SUSPECTED_CAUSE_ADD';
      investigationId: ProcessHubInvestigation['id'];
      cause: SuspectedCause;
    }
  | {
      kind: 'SUSPECTED_CAUSE_UPDATE';
      causeId: SuspectedCause['id'];
      patch: Partial<SuspectedCause>;
    }
  | { kind: 'SUSPECTED_CAUSE_ARCHIVE'; causeId: SuspectedCause['id'] };
