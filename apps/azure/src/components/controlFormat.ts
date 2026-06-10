/**
 * Project-typed Control formatters serving the re-homed ControlRegion.
 * These survive long-term.
 */
import type { ControlVerdict, ControlHandoffSurface } from '@variscout/core';
import { formatPlural } from '@variscout/core/i18n';

const VERDICT_LABELS: Record<ControlVerdict, string> = {
  holding: 'Holding',
  drifted: 'Drifted',
  inconclusive: 'Inconclusive',
};

export const formatSustainmentVerdict = (v: ControlVerdict): string => VERDICT_LABELS[v];

export const formatSustainmentDue = (
  nextCheckSuggestedAt: string | undefined,
  now: Date
): string => {
  if (!nextCheckSuggestedAt) return 'No re-check suggestion set';
  const dueMs = new Date(nextCheckSuggestedAt).getTime();
  const days = Math.round((dueMs - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) {
    const elapsed = Math.abs(days);
    return `Suggested ${elapsed} ${formatPlural(elapsed, { one: 'day', other: 'days' })} ago`;
  }
  if (days === 0) return 'Suggested today';
  return `Suggested in ${days} ${formatPlural(days, { one: 'day', other: 'days' })}`;
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
