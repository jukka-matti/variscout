/** Panel-scoped formatters for ProcessHubReviewPanel — these die with the panel in PO-3. */
import type { AnalyzeStatus } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';

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
