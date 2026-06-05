import type { Finding } from '../findings/types';
import type { ImprovementProject } from '../improvementProject';

export type FindingAction =
  | { kind: 'FINDING_ADD'; investigationId: ImprovementProject['id']; finding: Finding }
  | { kind: 'FINDING_UPDATE'; findingId: Finding['id']; patch: Partial<Finding> }
  | { kind: 'FINDING_ARCHIVE'; findingId: Finding['id'] };
