import type { AnalyzeStatus, ControlVerdict, ControlHandoffSurface } from '@variscout/core';
import { formatStatistic, formatPlural } from '@variscout/core/i18n';

export const formatMetric = (value: number): string => formatStatistic(value, 'en', 2);

export const formatStatus = (status?: AnalyzeStatus): string =>
  (status ?? 'scouting').replace(/-/g, ' ');

export const formatLatestActivity = (value: number | null): string => {
  if (value === null || value === undefined) return 'No activity yet';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Activity date unknown';
  return `Latest activity ${date.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const VERDICT_LABELS: Record<ControlVerdict, string> = {
  holding: 'Holding',
  drifting: 'Drifting',
  broken: 'Broken',
  inconclusive: 'Inconclusive',
};

export const formatSustainmentVerdict = (v: ControlVerdict): string => VERDICT_LABELS[v];

export const formatSustainmentDue = (nextReviewDue: string | undefined, now: Date): string => {
  if (!nextReviewDue) return 'No cadence set';
  const dueMs = new Date(nextReviewDue).getTime();
  const days = Math.round((dueMs - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) {
    const overdue = Math.abs(days);
    return `${overdue} ${formatPlural(overdue, { one: 'day', other: 'days' })} overdue`;
  }
  if (days === 0) return 'Due today';
  return `Due in ${days} ${formatPlural(days, { one: 'day', other: 'days' })}`;
};

const HANDOFF_LABELS: Record<ControlHandoffSurface, string> = {
  'mes-recipe': 'MES recipe',
  'scada-alarm': 'SCADA alarm',
  'qms-procedure': 'QMS procedure',
  'work-instruction': 'Work instruction',
  'training-record': 'Training record',
  'audit-program': 'Audit program',
  'dashboard-only': 'Dashboard only',
  'ticket-queue': 'Ticket queue',
  other: 'Other',
};

export const formatHandoffSurface = (s: ControlHandoffSurface): string => HANDOFF_LABELS[s];
