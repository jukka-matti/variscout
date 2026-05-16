import type { EntityBase } from '../identity';
import type { Finding } from '../findings/types';
import type { Hypothesis } from '../findings/types';
import type { ProjectMember } from '../projectMembership/types';

export type MeasurementMethod =
  | 'sensor'
  | 'manual-count'
  | 'gemba-walk'
  | 'expert-assessment'
  | 'other';

export type MeasurementPlanStatus = 'planned' | 'in-progress' | 'complete' | 'skipped';

export interface MeasurementPlan extends EntityBase {
  hypothesisId: Hypothesis['id'];
  factor: string;
  method: MeasurementMethod;
  sampleSize: number;
  owner: ProjectMember['id'];
  status: MeasurementPlanStatus;
  linkedFindingIds?: Finding['id'][];
  msaRequired?: boolean;
}
