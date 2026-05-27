import type { Finding } from '../findings/types';
import type { ProcessHubAnalyze } from '../processHub';

export type FindingAction =
  | { kind: 'FINDING_ADD'; investigationId: ProcessHubAnalyze['id']; finding: Finding }
  | { kind: 'FINDING_UPDATE'; findingId: Finding['id']; patch: Partial<Finding> }
  | { kind: 'FINDING_ARCHIVE'; findingId: Finding['id'] };
