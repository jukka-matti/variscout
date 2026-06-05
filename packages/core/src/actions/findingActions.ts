import type { Finding } from '../findings/types';

export type FindingAction =
  | { kind: 'FINDING_ADD'; finding: Finding }
  | { kind: 'FINDING_UPDATE'; findingId: Finding['id']; patch: Partial<Finding> }
  | { kind: 'FINDING_ARCHIVE'; findingId: Finding['id'] };
