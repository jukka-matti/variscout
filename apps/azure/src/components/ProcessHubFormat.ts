import type {
  InvestigationStatus,
  ProcessHubInvestigation,
  ProcessHubReviewItem,
  ProcessHubRollup,
  SustainmentVerdict,
  ControlHandoffSurface,
} from '@variscout/core';
import { formatStatistic, formatPlural } from '@variscout/core/i18n';

export const formatMetric = (value: number): string => formatStatistic(value, 'en', 2);

export const formatStatus = (status?: InvestigationStatus): string =>
  (status ?? 'scouting').replace(/-/g, ' ');

export const formatChangeSignals = (count: number): string =>
  `${count} ${formatPlural(count, { one: 'change signal', other: 'change signals' })}`;

export const formatOverdueActions = (count: number): string =>
  `${count} ${formatPlural(count, { one: 'overdue action', other: 'overdue actions' })}`;

export const formatLatestActivity = (value: string | null): string => {
  if (!value) return 'No activity yet';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Activity date unknown';
  return `Latest activity ${date.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

export const formatTopFocus = (item: ProcessHubReviewItem): string | null => {
  const topFocus = item.investigation.metadata?.reviewSignal?.topFocus;
  if (!topFocus) return null;
  return topFocus.value === undefined ? topFocus.factor : `${topFocus.factor} / ${topFocus.value}`;
};

export const formatHubTopFocus = (
  rollup: ProcessHubRollup<ProcessHubInvestigation>
): string | null => {
  const topFocus = rollup.reviewSignal?.topFocus;
  if (!topFocus) return null;
  return topFocus.value === undefined ? topFocus.factor : `${topFocus.factor} / ${topFocus.value}`;
};

export const formatCapability = (item: ProcessHubReviewItem): string | null => {
  const capability = item.investigation.metadata?.reviewSignal?.capability;
  if (capability?.cpk === undefined || capability.cpkTarget === undefined) return null;
  return `Cpk ${formatMetric(capability.cpk)} vs target ${formatMetric(capability.cpkTarget)}`;
};

export const formatHubCapability = (
  rollup: ProcessHubRollup<ProcessHubInvestigation>
): string | null => {
  const capability = rollup.reviewSignal?.capability;
  if (capability?.cpk === undefined || capability.cpkTarget === undefined) return null;
  return `Cpk ${formatMetric(capability.cpk)} vs target ${formatMetric(capability.cpkTarget)}`;
};

const firstDefined = <T>(values: Array<T | undefined>): T | undefined =>
  values.find(value => value !== undefined && value !== null);

export const requirementSummary = (
  rollup: ProcessHubRollup<ProcessHubInvestigation>
): string | null =>
  firstDefined(
    rollup.investigations.map(
      investigation =>
        investigation.metadata?.customerRequirementSummary ??
        investigation.metadata?.processMapSummary?.ctsColumn
    )
  ) ?? null;

export const processQuestionAnswers = (
  rollup: ProcessHubRollup<ProcessHubInvestigation>
): { requirement: string; change: string; focus: string } => {
  const requirement = requirementSummary(rollup);
  const capability = formatHubCapability(rollup);
  const topFocus = formatHubTopFocus(rollup);
  const latestChangeSignalCount = rollup.reviewSignal?.changeSignals.total ?? 0;

  return {
    requirement: requirement ?? capability ?? 'No requirement signal yet',
    change:
      latestChangeSignalCount > 0
        ? `Latest evidence has ${formatChangeSignals(latestChangeSignalCount)}.`
        : 'No change signal yet',
    focus:
      (topFocus && `Focus on ${topFocus}.`) ??
      (rollup.problemConditionSummary && `Focus on ${rollup.problemConditionSummary}.`) ??
      (rollup.nextMove && `Next move: ${rollup.nextMove}`) ??
      'No focus signal yet',
  };
};

const VERDICT_LABELS: Record<SustainmentVerdict, string> = {
  holding: 'Holding',
  drifting: 'Drifting',
  broken: 'Broken',
  inconclusive: 'Inconclusive',
};

export const formatSustainmentVerdict = (v: SustainmentVerdict): string => VERDICT_LABELS[v];

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

export const sustainmentBandAnswer = (
  rollup: ProcessHubRollup<ProcessHubInvestigation>,
  now: Date
): string | null => {
  const records = rollup.sustainmentRecords ?? [];
  const sustainmentEligible = rollup.investigations.some(
    inv =>
      inv.metadata?.investigationStatus === 'resolved' ||
      inv.metadata?.investigationStatus === 'controlled'
  );
  if (!sustainmentEligible) return null;
  const due = records.filter(
    r => r.nextReviewDue && new Date(r.nextReviewDue) <= now && !r.tombstoneAt
  ).length;
  const holdingCount = records.filter(r => r.latestVerdict === 'holding' && !r.tombstoneAt).length;
  if (due === 0 && holdingCount > 0) {
    return `${holdingCount} ${holdingCount === 1 ? 'investigation is' : 'investigations are'} holding; no review due.`;
  }
  if (due > 0) {
    return `${due} sustainment ${due === 1 ? 'review' : 'reviews'} due now.`;
  }
  return 'Set up sustainment cadence to monitor this.';
};
