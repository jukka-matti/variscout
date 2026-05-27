import { buildReviewItem } from './processHubReview';
import type { EntityBase } from './identity';
import type {
  ProcessHub,
  ProcessHubAttentionReason,
  ProcessHubAnalyze,
  ProcessHubReviewItem,
  ProcessParticipantRef,
} from './processHub';
import type { EvidenceSnapshot } from './evidenceSources';
import type { ImprovementProjectGoal, ImprovementProjectSignoff } from './improvementProject';

export type ControlCadence =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'on-demand';

export type ControlVerdict = 'holding' | 'drifting' | 'broken' | 'inconclusive';
export type ControlStatus = 'pending' | 'confirmed-sustained' | 'drifted';
export type ControlHandoffStatus = 'pending' | 'acknowledged' | 'operational';

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
  // Set to a non-null number when the investigation leaves SUSTAINMENT_STATUSES;
  // record is archived but readable.
  investigationId: ProcessHubAnalyze['id'];
  hubId: ProcessHub['id'];
  status: ControlStatus;
  title: string;
  improvementProjectId?: string;
  goal?: ImprovementProjectGoal;
  targetSummary?: string;
  consecutiveOnTargetTicks: number;
  hasOverride: boolean;
  lastEvaluatedSnapshotId: EvidenceSnapshot['id'] | undefined;
  cadence: ControlCadence;
  nextReviewDue?: string;
  latestVerdict?: ControlVerdict;
  latestReviewAt?: string;
  latestReviewId?: ControlReview['id'];
  owner?: ProcessParticipantRef;
  openConcerns?: string;
  controlHandoffId?: ControlHandoff['id'];
  updatedAt: number;
}

export interface ControlSnapshotEvaluation {
  verdict: ControlVerdict;
  onTarget: boolean | null;
  actionableSignalCount: number;
  nextConsecutiveOnTargetTicks: number;
  nextStatus: ControlStatus;
  observation: string;
}

export interface ControlReview extends EntityBase {
  // EntityBase contributes: id, createdAt (number, Unix ms), deletedAt (number | null).
  // createdAt == reviewedAt at construction (both set to Date.now() when the review is logged).
  // reviewedAt is the domain field for "when was this review conducted";
  // createdAt is the EntityBase lifecycle field. They are set to the same value at creation.
  recordId: ControlRecord['id'];
  investigationId: ProcessHubAnalyze['id'];
  hubId: ProcessHub['id'];
  reviewedAt: number;
  reviewer: ProcessParticipantRef;
  verdict: ControlVerdict;
  snapshotId?: EvidenceSnapshot['id'];
  observation?: string;
  escalatedInvestigationId?: ProcessHubAnalyze['id'];
}

export interface ControlHandoff extends EntityBase {
  // EntityBase contributes: id, createdAt (number, Unix ms), deletedAt (number | null).
  // recordedAt was renamed to createdAt (P1.4b, 2026-05-06) — they were semantically identical
  // (the system timestamp when this handoff entity was created).
  investigationId: ProcessHubAnalyze['id'];
  hubId: ProcessHub['id'];
  status: ControlHandoffStatus;
  surface: ControlHandoffSurface;
  systemName: string;
  operationalOwner: ProcessParticipantRef;
  /** User-stated effective date of the handoff (wall-clock, Unix ms). */
  handoffDate: number;
  description: string;
  referenceUri?: string;
  retainControlReview: boolean;
  recordedBy: ProcessParticipantRef;
  acknowledgedAt?: number;
  operationalAt?: number;
  ownerAcknowledgement?: {
    acknowledgedBy: ProcessParticipantRef;
    notes?: string;
  };
  escalationPath?: string;
  reactionPlan?: string;
  signoff?: ImprovementProjectSignoff;
}

export interface SustainmentMetadataProjection {
  recordId: string;
  cadence: ControlCadence;
  nextReviewDue?: string;
  latestVerdict?: ControlVerdict;
  handoffSurface?: ControlHandoffSurface;
}

function normalizedSustainmentStatus(record: ControlRecord): ControlStatus {
  return record.status ?? 'pending';
}

function normalizedConsecutiveOnTargetTicks(record: ControlRecord): number {
  const ticks = record.consecutiveOnTargetTicks ?? 0;
  return Number.isFinite(ticks) && ticks > 0 ? Math.floor(ticks) : 0;
}

function normalizedHasOverride(record: ControlRecord): boolean {
  return record.hasOverride === true;
}

export function evaluateSustainmentSnapshot(
  record: ControlRecord,
  snapshot: EvidenceSnapshot
): ControlSnapshotEvaluation {
  const currentTicks = normalizedConsecutiveOnTargetTicks(record);
  const currentStatus = normalizedSustainmentStatus(record);
  const actionableSignals = (snapshot.latestSignals ?? []).filter(
    signal => signal.severity !== 'neutral'
  );

  if (actionableSignals.length === 0) {
    return {
      verdict: 'inconclusive',
      onTarget: null,
      actionableSignalCount: 0,
      nextConsecutiveOnTargetTicks: currentTicks,
      nextStatus: currentStatus,
      observation: 'No actionable sustainment signals were available for this snapshot.',
    };
  }

  const hasAmber = actionableSignals.some(signal => signal.severity === 'amber');
  const hasRed = actionableSignals.some(signal => signal.severity === 'red');
  if (hasAmber || hasRed) {
    return {
      verdict: 'drifting',
      onTarget: false,
      actionableSignalCount: actionableSignals.length,
      nextConsecutiveOnTargetTicks: 0,
      nextStatus: currentStatus === 'confirmed-sustained' ? 'drifted' : currentStatus,
      observation: 'An amber or red sustainment signal indicates the gain is drifting.',
    };
  }

  const nextTicks = currentTicks + 1;
  const nextStatus =
    nextTicks >= 4 && !normalizedHasOverride(record) ? 'confirmed-sustained' : currentStatus;

  return {
    verdict: 'holding',
    onTarget: true,
    actionableSignalCount: actionableSignals.length,
    nextConsecutiveOnTargetTicks: nextTicks,
    nextStatus,
    observation:
      nextStatus === 'confirmed-sustained'
        ? 'Control target held for four consecutive ticks.'
        : 'All actionable sustainment signals are on target.',
  };
}

export function applySustainmentTick(
  record: ControlRecord,
  snapshot: EvidenceSnapshot,
  now: number = Date.now()
): { record: ControlRecord; review: ControlReview } {
  const evaluation = evaluateSustainmentSnapshot(record, snapshot);
  const nextRecord: ControlRecord = {
    ...record,
    status: evaluation.nextStatus,
    consecutiveOnTargetTicks: evaluation.nextConsecutiveOnTargetTicks,
    hasOverride: normalizedHasOverride(record),
    lastEvaluatedSnapshotId: snapshot.id,
    latestVerdict: evaluation.verdict,
    latestReviewAt: new Date(now).toISOString(),
    updatedAt: now,
  };

  const review: ControlReview = {
    id: `${record.id}:${snapshot.id}:review`,
    recordId: record.id,
    investigationId: record.investigationId,
    hubId: record.hubId,
    reviewedAt: now,
    reviewer: { displayName: 'System' },
    verdict: evaluation.verdict,
    snapshotId: snapshot.id,
    observation: evaluation.observation,
    createdAt: now,
    deletedAt: null,
  };

  return { record: nextRecord, review };
}

/**
 * Return the ISO-8601 timestamp of the next review due date, computed from
 * a cadence and an anchor (typically the most recent review's `reviewedAt`,
 * else the investigation's verification date).
 *
 * Calendar-aware for month-based cadences: e.g. monthly applied to
 * Jan 31 lands on Feb 28 (or Feb 29 in a leap year), not Mar 2.
 *
 * Returns `undefined` for `'on-demand'` cadence — caller must surface a
 * "no due date" state in the UI.
 *
 * The returned ISO string preserves the anchor's time-of-day in UTC.
 * Callers that want start-of-day semantics should normalise the anchor
 * before calling.
 */
export function nextDueFromCadence(cadence: ControlCadence, anchor: Date): string | undefined {
  if (cadence === 'on-demand') return undefined;
  const result = new Date(anchor.getTime());
  switch (cadence) {
    case 'weekly':
      result.setUTCDate(result.getUTCDate() + 7);
      break;
    case 'biweekly':
      result.setUTCDate(result.getUTCDate() + 14);
      break;
    case 'monthly':
      addMonthsClamped(result, 1);
      break;
    case 'quarterly':
      addMonthsClamped(result, 3);
      break;
    case 'semiannual':
      addMonthsClamped(result, 6);
      break;
    case 'annual':
      addMonthsClamped(result, 12);
      break;
  }
  return result.toISOString();
}

/**
 * Add `months` to `date` in-place, clamping to the last day of the target
 * month if the anchor day doesn't exist there (e.g. Jan 31 + 1 month → Feb 28
 * in a non-leap year, not Mar 2/3 from JS's natural overflow).
 */
function addMonthsClamped(date: Date, months: number): void {
  const originalDay = date.getUTCDate();
  // Move to day 1 before adjusting the month so JS can't overflow into the next month.
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  // Clamp to the last day of the new month if the original day exceeds it.
  const lastDayOfNewMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDayOfNewMonth));
}

/**
 * Returns true when a sustainment record's next review is at or before `now`.
 * Soft-deleted records (deletedAt !== null; formerly tombstoneAt) are never due.
 */
export function isSustainmentDue(record: ControlRecord, now: Date): boolean {
  if (record.deletedAt !== null) return false;
  if (!record.nextReviewDue) return false;
  return new Date(record.nextReviewDue).getTime() <= now.getTime();
}

/**
 * Returns true only when `now > nextReviewDue + graceDays * 24h`. The
 * grace day itself (and the due day with default `graceDays = 0`) is NOT
 * overdue — the cliff is exclusive. Soft-deleted records are never overdue.
 */
export function isSustainmentOverdue(
  record: ControlRecord,
  now: Date,
  graceDays: number = 0
): boolean {
  if (record.deletedAt !== null) return false;
  if (!record.nextReviewDue) return false;
  const safeGraceDays = Math.max(0, graceDays);
  const dueMs = new Date(record.nextReviewDue).getTime();
  const cutoffMs = dueMs + safeGraceDays * 24 * 60 * 60 * 1000;
  return now.getTime() > cutoffMs;
}

/**
 * Wrap the canonical `buildReviewItem` factory so both sustainment selectors
 * project the same fields (`cpkGap`, `topFocusVariationPct`, etc.) that the
 * rest of the cadence board surfaces. Keeps the call sites in this file
 * narrow on the `<TInv>` generic.
 */
function buildControlReviewItem<TInv extends ProcessHubAnalyze>(
  investigation: TInv,
  reasons: ProcessHubAttentionReason[]
): ProcessHubReviewItem<TInv> {
  return buildReviewItem(investigation, reasons);
}

/**
 * Returns the cadence-board sustainment queue: investigations whose effective
 * status is in SUSTAINMENT_STATUSES (`resolved` or `controlled`), whose record
 * is due (per `isSustainmentDue`), and which are not opted out via a
 * ControlHandoff with `retainControlReview = false`.
 *
 * Tombstoned records are excluded by the underlying `isSustainmentDue` check.
 */
export function selectControlReviews<TInv extends ProcessHubAnalyze>(
  investigations: TInv[],
  records: ControlRecord[],
  handoffs: ControlHandoff[],
  now: Date
): ProcessHubReviewItem<TInv>[] {
  const recordByInvestigation = new Map(records.map(r => [r.investigationId, r]));
  const handoffByInvestigation = new Map(handoffs.map(h => [h.investigationId, h]));

  return investigations
    .filter(inv => {
      const status = inv.metadata?.analyzeStatus;
      if (status !== 'resolved' && status !== 'controlled') return false;
      const record = recordByInvestigation.get(inv.id);
      if (!record || !isSustainmentDue(record, now)) return false;
      if (status === 'controlled') {
        const handoff = handoffByInvestigation.get(inv.id);
        if (handoff && handoff.retainControlReview === false) return false;
      }
      return true;
    })
    .map(inv => buildControlReviewItem(inv, ['sustainment-due']));
}

/**
 * Three-bucket projection of the sustainment review queue: items whose record
 * is due-but-not-overdue, overdue (past `graceDays`), and recently-reviewed
 * (latestReviewAt within `recentReviewWindowDays`). Excludes tombstoned and
 * handoff-opted-out records, mirroring `selectControlReviews`.
 */
export interface SustainmentBuckets<TInv extends ProcessHubAnalyze> {
  dueNow: ProcessHubReviewItem<TInv>[];
  overdue: ProcessHubReviewItem<TInv>[];
  recentlyReviewed: ProcessHubReviewItem<TInv>[];
}

export interface SustainmentBucketOptions {
  /** Days past the cliff before counting as overdue. Default 0 (any time strictly after due is overdue). */
  graceDays?: number;
  /** Window before `now` to count a record as recently-reviewed. Default 14 days. */
  recentReviewWindowDays?: number;
}

export function selectSustainmentBuckets<TInv extends ProcessHubAnalyze>(
  investigations: TInv[],
  records: ControlRecord[],
  handoffs: ControlHandoff[],
  now: Date,
  options: SustainmentBucketOptions = {}
): SustainmentBuckets<TInv> {
  const graceDays = Math.max(0, options.graceDays ?? 0);
  const recentReviewWindowDays = Math.max(0, options.recentReviewWindowDays ?? 14);
  const recentCutoffMs = now.getTime() - recentReviewWindowDays * 24 * 60 * 60 * 1000;

  const recordByInvestigation = new Map(records.map(r => [r.investigationId, r]));
  const handoffByInvestigation = new Map(handoffs.map(h => [h.investigationId, h]));

  const dueNow: ProcessHubReviewItem<TInv>[] = [];
  const overdue: ProcessHubReviewItem<TInv>[] = [];
  const recentlyReviewed: ProcessHubReviewItem<TInv>[] = [];

  for (const inv of investigations) {
    const status = inv.metadata?.analyzeStatus;
    if (status !== 'resolved' && status !== 'controlled') continue;
    const record = recordByInvestigation.get(inv.id);
    if (!record || record.deletedAt !== null) continue;
    if (status === 'controlled') {
      const handoff = handoffByInvestigation.get(inv.id);
      if (handoff && handoff.retainControlReview === false) continue;
    }

    if (isSustainmentOverdue(record, now, graceDays)) {
      overdue.push(buildControlReviewItem(inv, ['sustainment-due']));
      continue;
    }
    if (isSustainmentDue(record, now)) {
      dueNow.push(buildControlReviewItem(inv, ['sustainment-due']));
      continue;
    }
    if (record.latestReviewAt) {
      const reviewedMs = new Date(record.latestReviewAt).getTime();
      if (Number.isFinite(reviewedMs) && reviewedMs >= recentCutoffMs) {
        recentlyReviewed.push(buildControlReviewItem(inv, ['sustainment']));
      }
    }
  }

  return { dueNow, overdue, recentlyReviewed };
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
