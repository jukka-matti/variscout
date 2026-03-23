/**
 * Deep link utilities for URL-based navigation and Teams tab sharing.
 *
 * Supports two entry points:
 * 1. URL query params: ?project=<id>&finding=<id> or ?project=<id>&chart=<type>
 * 2. Teams subPageId: same param format, parsed from ctx.page.subPageId
 *
 * IMPORTANT: Uses `tab=` parameter (not `view=`) for within-project navigation.
 * The `view=` parameter is reserved for popout window routing in App.tsx.
 */

export type DeepLinkChart = 'ichart' | 'boxplot' | 'pareto' | 'stats';

export type DeepLinkMode = 'dashboard' | 'report' | 'improvement';

export type DeepLinkTab = 'overview';

export interface DeepLinkParams {
  project: string | null;
  findingId: string | null;
  hypothesisId: string | null;
  chart: DeepLinkChart | null;
  mode: DeepLinkMode | null;
  tab: DeepLinkTab | null;
}

export interface DeepLinkValidation {
  valid: boolean;
  error?: 'project-not-found' | 'target-not-found';
  errorMessage?: string;
}

const VALID_CHARTS = new Set<string>(['ichart', 'boxplot', 'pareto', 'stats']);
const VALID_MODES = new Set<string>(['dashboard', 'report', 'improvement']);
const VALID_TABS = new Set<string>(['overview']);

/** Parse deep link params from a URL search string (e.g. "?project=foo&finding=abc") */
export function parseDeepLink(search: string): DeepLinkParams {
  const params = new URLSearchParams(search);
  const project = params.get('project');
  const findingId = params.get('finding');
  const hypothesisId = params.get('hypothesis');
  const chartRaw = params.get('chart');
  const chart = chartRaw && VALID_CHARTS.has(chartRaw) ? (chartRaw as DeepLinkChart) : null;
  const modeRaw = params.get('mode');
  const mode = modeRaw && VALID_MODES.has(modeRaw) ? (modeRaw as DeepLinkMode) : null;
  const tabRaw = params.get('tab');
  const tab = tabRaw && VALID_TABS.has(tabRaw) ? (tabRaw as DeepLinkTab) : null;

  return { project, findingId, hypothesisId, chart, mode, tab };
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

/** Build a deep link URL that opens directly into Report View */
export function buildReportLink(baseUrl: string, project: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', project);
  url.searchParams.set('mode', 'report');
  return url.toString();
}

/** Build a deep link URL for a project (no specific target) */
export function buildProjectLink(baseUrl: string, projectId: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', projectId);
  return url.toString();
}

/** Build a deep link URL that opens a specific hypothesis in the investigation view */
export function buildHypothesisLink(
  baseUrl: string,
  projectId: string,
  hypothesisId: string
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', projectId);
  url.searchParams.set('hypothesis', hypothesisId);
  return url.toString();
}

/** Build a deep link URL that opens directly into Improvement View */
export function buildImprovementLink(baseUrl: string, projectId: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', projectId);
  url.searchParams.set('mode', 'improvement');
  return url.toString();
}

/** Build a deep link URL that opens the project overview tab (uses tab=overview, NOT view=) */
export function buildOverviewLink(baseUrl: string, projectId: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', projectId);
  url.searchParams.set('tab', 'overview');
  return url.toString();
}

/** Build a Teams subPageId string (reuses query param format) */
export function buildSubPageId(
  project: string,
  target: {
    findingId?: string;
    hypothesisId?: string;
    chart?: string;
    mode?: DeepLinkMode;
    tab?: DeepLinkTab;
  }
): string {
  const params = new URLSearchParams();
  params.set('project', project);
  if (target.findingId) params.set('finding', target.findingId);
  if (target.hypothesisId) params.set('hypothesis', target.hypothesisId);
  if (target.chart) params.set('chart', target.chart);
  if (target.mode) params.set('mode', target.mode);
  if (target.tab) params.set('tab', target.tab);
  return params.toString();
}

/** Parse a Teams subPageId string back to DeepLinkParams */
export function parseSubPageId(subPageId: string): DeepLinkParams {
  // subPageId uses the same format as URL search params (without leading ?)
  return parseDeepLink(subPageId.startsWith('?') ? subPageId : `?${subPageId}`);
}

/** Build a deep link for the current editor view state */
export function buildCurrentViewLink(
  baseUrl: string,
  project: string,
  state: { focusedChart?: string; findingId?: string; mode?: string }
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', project);
  if (state.focusedChart) url.searchParams.set('chart', state.focusedChart);
  if (state.findingId) url.searchParams.set('finding', state.findingId);
  if (state.mode) url.searchParams.set('mode', state.mode);
  return url.toString();
}

/**
 * Validate a parsed deep link against the current app state.
 *
 * Plan-aware error messages:
 * - Team plan: projects are shared — a missing project was likely moved or deleted.
 * - Standard plan: projects are device-local — a missing project may just not exist on this device.
 */
export function validateDeepLink(
  params: DeepLinkParams,
  projectExists: (id: string) => boolean,
  isStandardPlan: boolean
): DeepLinkValidation {
  if (!params.project) {
    return { valid: true };
  }

  if (!projectExists(params.project)) {
    const errorMessage = isStandardPlan
      ? 'This project was not found locally. Standard plan projects are stored on this device only — Team plan enables shared access.'
      : 'This project may have been moved or deleted.';

    return {
      valid: false,
      error: 'project-not-found',
      errorMessage,
    };
  }

  return { valid: true };
}
