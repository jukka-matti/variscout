import type { ProcessHub, ProcessHubInvestigation } from '../processHub';

export type InvestigationAction =
  | {
      kind: 'INVESTIGATION_CREATE';
      hubId: ProcessHub['id'];
      investigation: ProcessHubInvestigation;
    }
  | {
      kind: 'INVESTIGATION_UPDATE_METADATA';
      investigationId: ProcessHubInvestigation['id'];
      patch: Partial<ProcessHubInvestigation['metadata']>;
    }
  | { kind: 'INVESTIGATION_ARCHIVE'; investigationId: ProcessHubInvestigation['id'] };
