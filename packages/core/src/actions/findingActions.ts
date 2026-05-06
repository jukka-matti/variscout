import type { Finding } from '../findings/types';
import type { ProcessHubInvestigation } from '../processHub';

export type FindingAction =
  | { kind: 'FINDING_ADD'; investigationId: ProcessHubInvestigation['id']; finding: Finding }
  | { kind: 'FINDING_UPDATE'; findingId: Finding['id']; patch: Partial<Finding> }
  | { kind: 'FINDING_ARCHIVE'; findingId: Finding['id'] };
