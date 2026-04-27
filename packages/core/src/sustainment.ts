import { buildReviewItem } from './processHubReview';
import type {
  ProcessHubAttentionReason,
  ProcessHubInvestigation,
  ProcessHubReviewItem,
  ProcessParticipantRef,
} from './processHub';

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
export function nextDueFromCadence(cadence: SustainmentCadence, anchor: Date): string | undefined {
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
 * Tombstoned records (those whose investigation has left SUSTAINMENT_STATUSES)
 * are never due.
 */
export function isSustainmentDue(record: SustainmentRecord, now: Date): boolean {
  if (record.tombstoneAt) return false;
  if (!record.nextReviewDue) return false;
  return new Date(record.nextReviewDue).getTime() <= now.getTime();
}

/**
 * Returns true only when `now > nextReviewDue + graceDays * 24h`. The
 * grace day itself (and the due day with default `graceDays = 0`) is NOT
 * overdue — the cliff is exclusive. Tombstoned records are never overdue.
 */
export function isSustainmentOverdue(
  record: SustainmentRecord,
  now: Date,
  graceDays: number = 0
): boolean {
  if (record.tombstoneAt) return false;
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
function buildSustainmentReviewItem<TInv extends ProcessHubInvestigation>(
  investigation: TInv,
  reasons: ProcessHubAttentionReason[]
): ProcessHubReviewItem<TInv> {
  return buildReviewItem(investigation, reasons);
}

/**
 * Returns the cadence-board sustainment queue: investigations whose effective
 * status is in SUSTAINMENT_STATUSES (`resolved` or `controlled`), whose record
 * is due (per `isSustainmentDue`), and which are not opted out via a
 * ControlHandoff with `retainSustainmentReview = false`.
 *
 * Tombstoned records are excluded by the underlying `isSustainmentDue` check.
 */
export function selectSustainmentReviews<TInv extends ProcessHubInvestigation>(
  investigations: TInv[],
  records: SustainmentRecord[],
  handoffs: ControlHandoff[],
  now: Date
): ProcessHubReviewItem<TInv>[] {
  const recordByInvestigation = new Map(records.map(r => [r.investigationId, r]));
  const handoffByInvestigation = new Map(handoffs.map(h => [h.investigationId, h]));

  return investigations
    .filter(inv => {
      const status = inv.metadata?.investigationStatus;
      if (status !== 'resolved' && status !== 'controlled') return false;
      const record = recordByInvestigation.get(inv.id);
      if (!record || !isSustainmentDue(record, now)) return false;
      if (status === 'controlled') {
        const handoff = handoffByInvestigation.get(inv.id);
        if (handoff && handoff.retainSustainmentReview === false) return false;
      }
      return true;
    })
    .map(inv => buildSustainmentReviewItem(inv, ['sustainment-due']));
}

/**
 * Three-bucket projection of the sustainment review queue: items whose record
 * is due-but-not-overdue, overdue (past `graceDays`), and recently-reviewed
 * (latestReviewAt within `recentReviewWindowDays`). Excludes tombstoned and
 * handoff-opted-out records, mirroring `selectSustainmentReviews`.
 */
export interface SustainmentBuckets<TInv extends ProcessHubInvestigation> {
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

export function selectSustainmentBuckets<TInv extends ProcessHubInvestigation>(
  investigations: TInv[],
  records: SustainmentRecord[],
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
    const status = inv.metadata?.investigationStatus;
    if (status !== 'resolved' && status !== 'controlled') continue;
    const record = recordByInvestigation.get(inv.id);
    if (!record || record.tombstoneAt) continue;
    if (status === 'controlled') {
      const handoff = handoffByInvestigation.get(inv.id);
      if (handoff && handoff.retainSustainmentReview === false) continue;
    }

    if (isSustainmentOverdue(record, now, graceDays)) {
      overdue.push(buildSustainmentReviewItem(inv, ['sustainment-due']));
      continue;
    }
    if (isSustainmentDue(record, now)) {
      dueNow.push(buildSustainmentReviewItem(inv, ['sustainment-due']));
      continue;
    }
    if (record.latestReviewAt) {
      const reviewedMs = new Date(record.latestReviewAt).getTime();
      if (Number.isFinite(reviewedMs) && reviewedMs >= recentCutoffMs) {
        recentlyReviewed.push(buildSustainmentReviewItem(inv, ['sustainment']));
      }
    }
  }

  return { dueNow, overdue, recentlyReviewed };
}

/**
 * Returns investigations whose effective status is `controlled` but which lack
 * a ControlHandoff record. These should surface in the cadence board as a
 * prompt to either record the handoff or revert the status.
 */
export function selectControlHandoffCandidates<TInv extends ProcessHubInvestigation>(
  investigations: TInv[],
  handoffs: ControlHandoff[]
): ProcessHubReviewItem<TInv>[] {
  const handoffByInvestigation = new Set(handoffs.map(h => h.investigationId));
  return investigations
    .filter(
      inv =>
        inv.metadata?.investigationStatus === 'controlled' && !handoffByInvestigation.has(inv.id)
    )
    .map(inv => buildSustainmentReviewItem(inv, ['control-handoff-missing']));
}

// ── Blob path helpers ─────────────────────────────────────────────────────

function safePathSegment(value: string): string {
  return value.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
}

export function sustainmentRecordBlobPath(hubId: string, recordId: string): string {
  return [
    'process-hubs',
    safePathSegment(hubId),
    'sustainment',
    'records',
    `${safePathSegment(recordId)}.json`,
  ].join('/');
}

export function sustainmentReviewBlobPath(
  hubId: string,
  recordId: string,
  reviewId: string
): string {
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

export function sustainmentCatalogPath(hubId: string): string {
  return ['process-hubs', safePathSegment(hubId), 'sustainment', '_index.json'].join('/');
}
