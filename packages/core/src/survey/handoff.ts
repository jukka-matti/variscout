import type { ControlHandoff, ControlRecord } from '../control';
import type { SurveyHint, SurveyRule } from './types';

function isLiveRecord(record: ControlRecord): boolean {
  return record.deletedAt === null;
}

function isLiveHandoff(handoff: ControlHandoff): boolean {
  return handoff.deletedAt === null;
}

function hasLiveHandoff(record: ControlRecord, handoffs: ControlHandoff[]): boolean {
  return handoffs.some(
    handoff =>
      isLiveHandoff(handoff) &&
      (handoff.id === record.controlHandoffId || handoff.projectId === record.projectId)
  );
}

export const surveyHandoffRules: SurveyRule = ctx => {
  const hints: SurveyHint[] = [];
  const handoffs = ctx.controlHandoffs ?? [];

  for (const record of ctx.controlRecords ?? []) {
    if (!isLiveRecord(record)) continue;
    if (record.status !== 'confirmed-sustained') continue;
    if (hasLiveHandoff(record, handoffs)) continue;

    hints.push({
      kind: 'lifecycle-gap',
      surface: 'sustainment',
      targetEntityId: record.id,
      message: `${record.title} is confirmed sustained without a recorded handoff`,
      severity: 'warning',
      action: {
        label: 'Record control handoff',
        opensSurface: 'sustainment',
        opensId: record.id,
      },
    });
  }

  return hints;
};
