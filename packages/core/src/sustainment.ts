// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ProcessHub, ProcessHubInvestigation, ProcessHubRollup } from './processHub';

export interface ProcessParticipantRef {
  id: string;
  displayName: string;
  email?: string;
}

export type SustainmentCadence =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'on-demand';

export type SustainmentVerdict = 'holding' | 'drifting' | 'broken' | 'inconclusive';

export type ControlHandoffSurface =
  | 'mes-recipe'
  | 'scada-alarm'
  | 'qms-procedure'
  | 'work-instruction'
  | 'training-record'
  | 'audit-program'
  | 'dashboard-only'
  | 'ticket-queue'
  | 'other';

export interface SustainmentRecord {
  id: string;
  investigationId: string;
  hubId: string;
  cadence: SustainmentCadence;
  nextReviewDue?: string;
  latestVerdict?: SustainmentVerdict;
  latestReviewAt?: string;
  latestReviewId?: string;
  owner?: ProcessParticipantRef;
  openConcerns?: string;
  controlHandoffId?: string;
  /** Set when the investigation has left SUSTAINMENT_STATUSES; record is archived but readable. */
  tombstoneAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SustainmentReview {
  id: string;
  recordId: string;
  investigationId: string;
  hubId: string;
  reviewedAt: string;
  reviewer: ProcessParticipantRef;
  verdict: SustainmentVerdict;
  snapshotId?: string;
  observation?: string;
  escalatedInvestigationId?: string;
}

export interface ControlHandoff {
  id: string;
  investigationId: string;
  hubId: string;
  surface: ControlHandoffSurface;
  systemName: string;
  operationalOwner: ProcessParticipantRef;
  handoffDate: string;
  description: string;
  referenceUri?: string;
  retainSustainmentReview: boolean;
  recordedAt: string;
  recordedBy: ProcessParticipantRef;
}

export interface SustainmentMetadataProjection {
  recordId: string;
  cadence: SustainmentCadence;
  nextReviewDue?: string;
  latestVerdict?: SustainmentVerdict;
  handoffSurface?: ControlHandoffSurface;
}

const CADENCE_DAYS: Record<SustainmentCadence, number | null> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 91,
  semiannual: 182,
  annual: 365,
  'on-demand': null,
};

export function nextDueFromCadence(cadence: SustainmentCadence, anchor: Date): string | undefined {
  const days = CADENCE_DAYS[cadence];
  if (days === null) return undefined;
  const result = new Date(anchor.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString();
}
