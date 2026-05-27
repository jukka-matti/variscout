import type { ProcessHub, ProcessHubAnalyze } from '../processHub';

export type AnalyzeAction =
  | {
      kind: 'INVESTIGATION_CREATE';
      hubId: ProcessHub['id'];
      investigation: ProcessHubAnalyze;
    }
  | {
      kind: 'INVESTIGATION_UPDATE_METADATA';
      investigationId: ProcessHubAnalyze['id'];
      patch: Partial<ProcessHubAnalyze['metadata']>;
    }
  | { kind: 'INVESTIGATION_ARCHIVE'; investigationId: ProcessHubAnalyze['id'] };
