/**
 * Azure AI Search client for Knowledge Base feature.
 * Searches past findings across the organization.
 */

import { isTeamAIPlan, isPreviewEnabled } from '@variscout/core';
import { getAccessToken } from '../auth/easyAuth';
import { getRuntimeConfig } from '../lib/runtimeConfig';

export interface DocumentResult {
  title: string;
  snippet: string;
  source: string;
  url?: string;
  relevanceScore: number;
}

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
  return getRuntimeConfig()?.aiSearchEndpoint || import.meta.env.VITE_AI_SEARCH_ENDPOINT || null;
}

function getSearchIndex(): string {
  return getRuntimeConfig()?.aiSearchIndex || import.meta.env.VITE_AI_SEARCH_INDEX || 'findings';
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
    const escaped = options.factor.replace(/'/g, "''");
    body.filter = `factor eq '${escaped}'`;
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

/**
 * Search documents via Foundry IQ agentic retrieval (Knowledge Base).
 * Uses the 2025-11-01-preview API with ExtractedData output mode.
 * Returns empty array on error (soft failure).
 */
export async function searchDocuments(
  query: string,
  options?: { top?: number }
): Promise<DocumentResult[]> {
  if (!isTeamAIPlan() || !isPreviewEnabled('knowledge-base')) return [];

  const endpoint = getSearchEndpoint();
  if (!endpoint) return [];

  const token = await getAccessToken();

  const body = {
    messages: [{ role: 'user', content: [{ type: 'text', text: query }] }],
    outputMode: 'ExtractedData',
    retrievalReasoningEffort: { kind: 'low' },
    ...(options?.top ? { top: options.top } : {}),
  };

  try {
    const res = await fetch(
      `${endpoint}/knowledgebases/variscout-kb/retrieve?api-version=2025-11-01-preview`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      if (res.status !== 404) {
        console.warn('[SearchService] Document search failed:', res.status);
      }
      return [];
    }

    const data = await res.json();

    // Parse ExtractedData response: response[].content[].text contains JSON chunks
    const results: DocumentResult[] = [];
    const responseItems = data.response ?? [];
    for (const item of responseItems) {
      const contentBlocks = item.content ?? [];
      for (const block of contentBlocks) {
        if (block.type === 'text' && block.text) {
          try {
            const chunks = JSON.parse(block.text);
            if (Array.isArray(chunks)) {
              for (const chunk of chunks) {
                results.push({
                  title: chunk.title ?? 'Untitled',
                  snippet: chunk.content ?? '',
                  source: chunk.source ?? 'Knowledge Base',
                  url: chunk.url,
                  relevanceScore: chunk.relevance_score ?? 0,
                });
              }
            }
          } catch {
            // Raw text (not JSON array) — treat as single document
            results.push({
              title: 'Knowledge Base result',
              snippet: block.text,
              source: 'Knowledge Base',
              relevanceScore: 0,
            });
          }
        }
      }
    }

    return results;
  } catch (err) {
    console.warn('[SearchService] Document search error:', err);
    return [];
  }
}
