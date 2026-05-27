import type { ControlHandoff, ControlRecord } from '../control';
import type { SurveyHint, SurveyRule } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const CONFIRMED_WITHOUT_HANDOFF_DAYS = 42;
const PENDING_ACKNOWLEDGEMENT_DAYS = 7;

function timestamp(value: Date | number | string | undefined): number | undefined {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isLiveRecord(record: ControlRecord): boolean {
  return record.deletedAt === null;
}

function isLiveHandoff(handoff: ControlHandoff): boolean {
  return handoff.deletedAt === null;
}

function confirmedAt(record: ControlRecord): number {
  return timestamp(record.latestReviewAt) ?? record.updatedAt ?? record.createdAt;
}

function hasLiveHandoff(record: ControlRecord, handoffs: ControlHandoff[]): boolean {
  return handoffs.some(
    handoff =>
      isLiveHandoff(handoff) &&
      (handoff.id === record.controlHandoffId || handoff.investigationId === record.investigationId)
  );
}

function needsOwnerAcknowledgement(handoff: ControlHandoff): boolean {
  return (
    isLiveHandoff(handoff) &&
    handoff.status === 'pending' &&
    handoff.acknowledgedAt === undefined &&
    handoff.ownerAcknowledgement === undefined
  );
}

export const surveyHandoffRules: SurveyRule = ctx => {
  const hints: SurveyHint[] = [];
  const now = timestamp(ctx.now);
  if (now === undefined) return hints;

  const handoffs = ctx.controlHandoffs ?? [];

  for (const record of ctx.controlRecords ?? []) {
    if (!isLiveRecord(record)) continue;
    if (record.status !== 'confirmed-sustained') continue;
    if (hasLiveHandoff(record, handoffs)) continue;

    const ageMs = now - confirmedAt(record);
    if (ageMs < CONFIRMED_WITHOUT_HANDOFF_DAYS * DAY_MS) continue;

    hints.push({
      kind: 'lifecycle-gap',
      surface: 'sustainment',
      targetEntityId: record.id,
      message: `${record.title} confirmed sustained more than 6 weeks ago without live handoff`,
      severity: 'warning',
      action: {
        label: 'Record control handoff',
        opensSurface: 'sustainment',
        opensId: record.id,
      },
    });
  }

  for (const handoff of handoffs) {
    if (!needsOwnerAcknowledgement(handoff)) continue;

    const recordedAt = timestamp(handoff.createdAt);
    if (recordedAt === undefined) continue;

    const ageMs = now - recordedAt;
    if (ageMs < PENDING_ACKNOWLEDGEMENT_DAYS * DAY_MS) continue;

    hints.push({
      kind: 'lifecycle-gap',
      surface: 'sustainment',
      targetEntityId: handoff.id,
      message: `${handoff.operationalOwner.displayName} has not acknowledged ${handoff.systemName} handoff`,
      severity: 'warning',
      action: {
        label: 'Open handoff',
        opensSurface: 'sustainment',
        opensId: handoff.id,
      },
    });
  }

  return hints;
};
