/**
 * Deep link utilities for URL-based navigation and Teams tab sharing.
 *
 * Supports two entry points:
 * 1. URL query params: ?project=<name>&finding=<id> or ?project=<name>&chart=<type>
 * 2. Teams subPageId: same param format, parsed from ctx.page.subPageId
 */

export type DeepLinkChart = 'ichart' | 'boxplot' | 'pareto' | 'stats';

export interface DeepLinkParams {
  project: string | null;
  findingId: string | null;
  chart: DeepLinkChart | null;
}

const VALID_CHARTS = new Set<string>(['ichart', 'boxplot', 'pareto', 'stats']);

/** Parse deep link params from a URL search string (e.g. "?project=foo&finding=abc") */
export function parseDeepLink(search: string): DeepLinkParams {
  const params = new URLSearchParams(search);
  const project = params.get('project');
  const findingId = params.get('finding');
  const chartRaw = params.get('chart');
  const chart = chartRaw && VALID_CHARTS.has(chartRaw) ? (chartRaw as DeepLinkChart) : null;

  return { project, findingId, chart };
}

/** Build a deep link URL for a finding */
export function buildFindingLink(baseUrl: string, project: string, findingId: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', project);
  url.searchParams.set('finding', findingId);
  return url.toString();
}

/** Build a deep link URL for a chart */
export function buildChartLink(baseUrl: string, project: string, chart: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', project);
  url.searchParams.set('chart', chart);
  return url.toString();
}

/** Build a Teams subPageId string (reuses query param format) */
export function buildSubPageId(
  project: string,
  target: { findingId?: string; chart?: string }
): string {
  const params = new URLSearchParams();
  params.set('project', project);
  if (target.findingId) params.set('finding', target.findingId);
  if (target.chart) params.set('chart', target.chart);
  return params.toString();
}

/** Parse a Teams subPageId string back to DeepLinkParams */
export function parseSubPageId(subPageId: string): DeepLinkParams {
  // subPageId uses the same format as URL search params (without leading ?)
  return parseDeepLink(subPageId.startsWith('?') ? subPageId : `?${subPageId}`);
}
