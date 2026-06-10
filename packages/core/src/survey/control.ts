import type { ImprovementProject } from '../improvementProject';
import { isCheckSuggested, type ControlRecord } from '../control';
import type { SurveyHint, SurveyRule } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const LIFECYCLE_GAP_DAYS = 30;

function timestamp(value: Date | number | undefined): number | undefined {
  if (value instanceof Date) return value.getTime();
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function projectClosedAt(project: ImprovementProject): number {
  return project.updatedAt ?? project.createdAt;
}

function isLiveRecord(record: ControlRecord): boolean {
  return record.deletedAt === null;
}

function isLiveProject(project: ImprovementProject): boolean {
  return project.deletedAt === null;
}

function hasLinkedLiveSustainment(project: ImprovementProject, records: ControlRecord[]): boolean {
  const referencedRecordId = project.sections.outcomeReference.sustainmentRecordId;
  return records.some(
    record =>
      isLiveRecord(record) &&
      (record.improvementProjectId === project.id ||
        (referencedRecordId !== undefined && record.id === referencedRecordId))
  );
}

function driftSeverity(record: ControlRecord): SurveyHint['severity'] | undefined {
  if (record.status === 'drifted') return 'critical';
  return undefined;
}

export const surveySustainmentRules: SurveyRule = ctx => {
  const hints: SurveyHint[] = [];
  const records = ctx.controlRecords ?? [];
  const projects = ctx.improvementProject ? [ctx.improvementProject] : [];

  for (const record of records.filter(isLiveRecord)) {
    const severity = driftSeverity(record);
    if (severity) {
      hints.push({
        kind: 'drift-detection',
        surface: 'sustainment',
        targetEntityId: record.id,
        message: `${record.title} drift detected`,
        severity,
        action: {
          label: 'Open sustainment record',
          opensSurface: 'sustainment',
          opensId: record.id,
        },
      });
      continue;
    }

    if (
      isCheckSuggested(
        record,
        ctx.now instanceof Date ? ctx.now : new Date(timestamp(ctx.now) ?? 0)
      )
    ) {
      hints.push({
        kind: 'drift-detection',
        surface: 'sustainment',
        targetEntityId: record.id,
        message: `${record.title} is ready for a sustainment re-check`,
        severity: 'info',
        action: {
          label: 'Open sustainment record',
          opensSurface: 'sustainment',
          opensId: record.id,
        },
      });
    }
  }

  const now = timestamp(ctx.now);
  if (now === undefined) return hints;

  for (const project of projects) {
    if (!isLiveProject(project)) continue;
    if (project.status !== 'closed') continue;
    if (hasLinkedLiveSustainment(project, records)) continue;

    const ageMs = now - projectClosedAt(project);
    if (ageMs < LIFECYCLE_GAP_DAYS * DAY_MS) continue;

    hints.push({
      kind: 'lifecycle-gap',
      surface: 'inbox',
      targetEntityId: project.id,
      message: `${project.metadata.title} closed more than 30 days ago without live sustainment`,
      severity: 'warning',
      action: {
        label: 'Set up sustainment',
        opensSurface: 'sustainment',
        opensId: project.id,
      },
    });
  }

  return hints;
};
