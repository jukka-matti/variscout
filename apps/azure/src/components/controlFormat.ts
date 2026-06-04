/**
 * Project-typed Control formatters serving the re-homed ControlRegion.
 * These survive long-term; ProcessHubFormat.ts houses the panel helpers that
 * die with ProcessHubReviewPanel in PO-3.
 */
import type { ControlVerdict, ControlHandoffSurface } from '@variscout/core';
import { formatPlural } from '@variscout/core/i18n';

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

// Tested-but-unmounted; the #12 closure-model design decides its surface.
export const formatHandoffSurface = (s: ControlHandoffSurface): string => HANDOFF_LABELS[s];
