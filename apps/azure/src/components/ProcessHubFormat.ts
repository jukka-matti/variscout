import type {
  InvestigationStatus,
  ProcessHubInvestigation,
  ProcessHubReviewItem,
  ProcessHubRollup,
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
