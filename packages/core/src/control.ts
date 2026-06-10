import type { EntityBase } from './identity';
import type { ProcessHub, ProcessParticipantRef } from './processHub';
import type { EvidenceSnapshot } from './evidenceSources';
import type { ImprovementProject, ImprovementProjectGoal } from './improvementProject';
import type { ControlBaseline } from './control/comparison';

export type ControlVerdict = 'holding' | 'drifted' | 'inconclusive';
export type ControlStatus = 'verifying' | 'confirmed-sustained' | 'drifted';

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

export interface ControlRecord extends EntityBase {
  // EntityBase contributes: id, createdAt (number, Unix ms), deletedAt (number | null)
  // deletedAt replaces the former tombstoneAt field (renamed 2026-05-06, P1.4b).
  // Archived-but-readable when the owning project leaves the control surface.
  /**
   * The Control join key (PO-7 honest rename of the former FK — name-only; join
   * semantics unchanged). Usually the owning ImprovementProject id under
   * Project⟷Hub 1:1; records created without an associated closed project carry
   * the synthetic `${hub.id}:sustainment` fallback (see
   * `useControlPanelModel.buildDraftRecord`), so this is NOT guaranteed to
   * resolve to a live project. The OTHER member below — the direct optional
   * project FK — is distinct; THIS field is the bridge key handoffs join through.
   */
  projectId: ImprovementProject['id'];
  hubId: ProcessHub['id'];
  status: ControlStatus;
  title: string;
  improvementDate: string;
  baseline: ControlBaseline;
  ladder: number[];
  ladderStep: number;
  nextCheckSuggestedAt?: string;
  improvementProjectId?: string;
  goal?: ImprovementProjectGoal;
  targetSummary?: string;
  lastEvaluatedSnapshotId: EvidenceSnapshot['id'] | undefined;
  latestReviewAt?: string;
  latestReviewId?: ControlReview['id'];
  owner?: ProcessParticipantRef;
  openConcerns?: string;
  controlHandoffId?: ControlHandoff['id'];
  updatedAt: number;
}

export interface ControlReview extends EntityBase {
  // EntityBase contributes: id, createdAt (number, Unix ms), deletedAt (number | null).
  // createdAt == reviewedAt at construction (both set to Date.now() when the review is logged).
  // reviewedAt is the domain field for "when was this review conducted";
  // createdAt is the EntityBase lifecycle field. They are set to the same value at creation.
  recordId: ControlRecord['id'];
  projectId: ImprovementProject['id'];
  hubId: ProcessHub['id'];
  reviewedAt: number;
  reviewer: ProcessParticipantRef;
  verdict: ControlVerdict;
  snapshotId?: EvidenceSnapshot['id'];
  nowStats: {
    window: { startISO: string; endISO: string };
    n: number;
    mean: number;
    sigma: number;
    cpk?: number;
  };
  dataStamp: {
    rowCount: number;
    rowTimestampRange?: { startISO: string; endISO: string };
    snapshotId?: EvidenceSnapshot['id'];
  };
  observation?: string;
}

export interface ControlHandoff extends EntityBase {
  // EntityBase contributes: id, createdAt (number, Unix ms), deletedAt (number | null).
  // recordedAt was renamed to createdAt (P1.4b, 2026-05-06) — they were semantically identical
  // (the system timestamp when this handoff entity was created).
  projectId: ImprovementProject['id'];
  hubId: ProcessHub['id'];
  surface: ControlHandoffSurface;
  systemName: string;
  operationalOwner: ProcessParticipantRef;
  /** User-stated effective date of the handoff (wall-clock, Unix ms). */
  handoffDate: number;
  description: string;
  referenceUri?: string;
  recordedBy: ProcessParticipantRef;
  escalationPath?: string;
  reactionPlan?: string;
}

export interface ControlMetadataProjection {
  recordId: string;
  ladderStep: number;
  nextCheckSuggestedAt?: string;
  status: ControlStatus;
  handoffSurface?: ControlHandoffSurface;
}

export function isCheckSuggested(record: ControlRecord, now: Date): boolean {
  if (record.deletedAt !== null) return false;
  if (!record.nextCheckSuggestedAt) return false;
  const suggestedAtMs = Date.parse(record.nextCheckSuggestedAt);
  if (!Number.isFinite(suggestedAtMs)) return false;
  return suggestedAtMs <= now.getTime();
}

export function advanceLadder(record: ControlRecord, anchorISO: string): ControlRecord {
  const ladder = normalizedLadder(record.ladder);
  const currentStep = normalizedLadderStep(record.ladderStep, ladder);
  const nextStep = Math.min(currentStep + 1, ladder.length - 1);
  return {
    ...record,
    ladder,
    ladderStep: nextStep,
    nextCheckSuggestedAt: addDaysISO(anchorISO, ladder[nextStep]),
  };
}

export function resetLadder(record: ControlRecord, anchorISO: string): ControlRecord {
  const ladder = normalizedLadder(record.ladder);
  return {
    ...record,
    ladder,
    ladderStep: 0,
    nextCheckSuggestedAt: addDaysISO(anchorISO, ladder[0]),
  };
}

function normalizedLadder(ladder: number[]): number[] {
  const safe = ladder
    .filter(days => Number.isFinite(days) && days > 0)
    .map(days => Math.floor(days));
  return safe.length > 0 ? safe : [7];
}

function normalizedLadderStep(step: number, ladder: number[]): number {
  if (!Number.isFinite(step) || step < 0) return 0;
  return Math.min(Math.floor(step), ladder.length - 1);
}

function addDaysISO(anchorISO: string, days: number): string {
  const anchorMs = Date.parse(anchorISO);
  const safeAnchorMs = Number.isFinite(anchorMs) ? anchorMs : Date.now();
  const result = new Date(safeAnchorMs);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString();
}

// ── Blob path helpers ─────────────────────────────────────────────────────

function safePathSegment(value: string): string {
  return value.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
}

export function controlRecordBlobPath(hubId: string, recordId: string): string {
  return [
    'process-hubs',
    safePathSegment(hubId),
    'sustainment',
    'records',
    `${safePathSegment(recordId)}.json`,
  ].join('/');
}

export function controlReviewBlobPath(hubId: string, recordId: string, reviewId: string): string {
  return [
    'process-hubs',
    safePathSegment(hubId),
    'sustainment',
    'reviews',
    safePathSegment(recordId),
    `${safePathSegment(reviewId)}.json`,
  ].join('/');
}

export function controlHandoffBlobPath(hubId: string, handoffId: string): string {
  return [
    'process-hubs',
    safePathSegment(hubId),
    'sustainment',
    'handoffs',
    `${safePathSegment(handoffId)}.json`,
  ].join('/');
}

export function controlCatalogPath(hubId: string): string {
  return ['process-hubs', safePathSegment(hubId), 'sustainment', '_index.json'].join('/');
}
