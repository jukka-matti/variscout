/**
 * Pure functions to build share payloads for findings and charts.
 * No side effects — easily testable.
 */

import type { Finding } from '@variscout/core';
import { buildFindingLink, buildChartLink, buildReportLink } from './deepLinks';

export interface SharePayload {
  title: string;
  url: string;
  previewText: string;
}

/** Truncate text to a max length, adding ellipsis if needed */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '\u2026';
}

/** Build share payload for a finding */
export function buildFindingSharePayload(
  finding: Finding,
  projectName: string,
  baseUrl: string
): SharePayload {
  const notePreview = finding.text ? truncate(finding.text, 50) : 'No note';
  const title = `Finding: ${notePreview}`;

  const url = buildFindingLink(baseUrl, projectName, finding.id);

  const parts: string[] = [`[${finding.status}]`, `in ${projectName}`];
  if (finding.context.stats?.cpk !== undefined) {
    parts.push(`Cpk ${finding.context.stats.cpk.toFixed(1)}`);
  }
  const previewText = parts.join(' \u2014 ');

  return { title, url, previewText };
}

/** Build share payload for a chart view */
export function buildChartSharePayload(
  chartType: string,
  projectName: string,
  baseUrl: string,
  context?: { cpk?: number; filters?: string }
): SharePayload {
  const chartLabel =
    chartType === 'ichart'
      ? 'I-Chart'
      : chartType === 'boxplot'
        ? 'Boxplot'
        : chartType === 'pareto'
          ? 'Pareto'
          : chartType === 'stats'
            ? 'Stats'
            : chartType;
  const title = `${chartLabel}: ${projectName}`;

  const url = buildChartLink(baseUrl, projectName, chartType);

  const parts: string[] = [chartLabel, `in ${projectName}`];
  if (context?.cpk !== undefined) {
    parts.push(`Cpk ${context.cpk.toFixed(1)}`);
  }
  if (context?.filters) {
    parts.push(context.filters);
  }
  const previewText = parts.join(' \u2014 ');

  return { title, url, previewText };
}

/** Build share payload for a report view */
export function buildReportSharePayload(
  processName: string,
  projectName: string,
  baseUrl: string,
  keyCpk?: number
): SharePayload {
  const title = `Scouting Report: ${processName}`;
  const url = buildReportLink(baseUrl, projectName);

  const parts: string[] = [processName];
  if (keyCpk !== undefined) {
    parts.push(`Cpk ${keyCpk.toFixed(1)}`);
  }
  const previewText = parts.join(' \u2014 ');

  return { title, url, previewText };
}
