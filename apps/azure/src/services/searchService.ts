/**
 * Azure AI Search client for Knowledge Base feature.
 * Searches past findings across the organization.
 */

import { isTeamAIPlan, isPreviewEnabled } from '@variscout/core';
import { getAccessToken } from '../auth/easyAuth';

export interface SearchResult {
  findingId: string;
  projectName: string;
  factor: string;
  status: string;
  etaSquared: number | null;
  cpkBefore: number | null;
  cpkAfter: number | null;
  suspectedCause: string;
  actionsText: string;
  outcomeEffective: boolean | null;
  score: number;
}

function getSearchEndpoint(): string | null {
  return import.meta.env.VITE_AI_SEARCH_ENDPOINT || null;
}

function getSearchIndex(): string {
  return import.meta.env.VITE_AI_SEARCH_INDEX || 'findings';
}

/**
 * Check if the Knowledge Base feature is available.
 * Requires Team AI plan, configured search endpoint, and preview toggle enabled.
 */
export function isKnowledgeBaseAvailable(): boolean {
  return isTeamAIPlan() && getSearchEndpoint() !== null && isPreviewEnabled('knowledge-base');
}

/**
 * Search for related findings in Azure AI Search.
 * Returns empty array on error (soft failure).
 */
export async function searchRelatedFindings(
  query: string,
  options?: { factor?: string; top?: number }
): Promise<SearchResult[]> {
  const endpoint = getSearchEndpoint();
  if (!endpoint) return [];

  const token = await getAccessToken();
  const index = getSearchIndex();
  const top = options?.top ?? 5;

  const body: Record<string, unknown> = {
    search: query,
    queryType: 'semantic',
    semanticConfiguration: 'findings-semantic',
    top,
    select:
      'finding_id,project_name,factor,status,eta_squared,cpk_before,cpk_after,suspected_cause,actions_text,outcome_effective',
  };

  if (options?.factor) {
    body.filter = `factor eq '${options.factor}'`;
  }

  const res = await fetch(`${endpoint}/indexes/${index}/docs/search?api-version=2024-07-01`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn('[SearchService] Search failed:', res.status);
    return [];
  }

  const data = await res.json();
  return (data.value ?? []).map((doc: Record<string, unknown>) => ({
    findingId: doc.finding_id,
    projectName: doc.project_name,
    factor: doc.factor,
    status: doc.status,
    etaSquared: doc.eta_squared ?? null,
    cpkBefore: doc.cpk_before ?? null,
    cpkAfter: doc.cpk_after ?? null,
    suspectedCause: doc.suspected_cause ?? '',
    actionsText: doc.actions_text ?? '',
    outcomeEffective: doc.outcome_effective ?? null,
    score: doc['@search.score'] ?? 0,
  }));
}
