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
