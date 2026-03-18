/**
 * Azure AI Search client for Knowledge Base feature.
 *
 * ADR-026: SharePoint-first strategy with Remote SharePoint knowledge sources.
 * - searchDocuments() uses Foundry IQ agentic retrieval with user token passthrough
 * - searchRelatedFindings() is deprecated (no dedicated findings index)
 * - Folder-scoped via KQL filter on the channel's SharePoint path
 */

import { isTeamAIPlan, isPreviewEnabled } from '@variscout/core';
import { getGraphTokenWithScopes } from '../auth/graphToken';
import { getAccessToken } from '../auth/easyAuth';
import { getRuntimeConfig } from '../lib/runtimeConfig';

export interface DocumentResult {
  title: string;
  snippet: string;
  source: string;
  url?: string;
  relevanceScore: number;
}

/** @deprecated ADR-026: Dedicated findings index replaced by SharePoint reports */
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

/**
 * Check if the Knowledge Base feature is available.
 * Requires Team AI plan, configured search endpoint, and preview toggle enabled.
 */
export function isKnowledgeBaseAvailable(): boolean {
  return isTeamAIPlan() && getSearchEndpoint() !== null && isPreviewEnabled('knowledge-base');
}

/**
 * @deprecated ADR-026: No longer using a dedicated findings index.
 * Knowledge comes from SharePoint documents via searchDocuments().
 * Kept for backward compatibility — returns empty array.
 */
export async function searchRelatedFindings(
  _query: string,
  _options?: { factor?: string; top?: number }
): Promise<SearchResult[]> {
  console.warn(
    '[SearchService] searchRelatedFindings() is deprecated (ADR-026). Use searchDocuments() instead.'
  );
  return [];
}

/**
 * Search documents via Foundry IQ agentic retrieval (Knowledge Base).
 *
 * ADR-026 changes:
 * - Passes user's delegated token via xMsQuerySourceAuthorization for per-user permissions
 * - Supports folder-scoped search via KQL filter on SharePoint path
 * - Uses maxOutputSize and maxRuntimeInSeconds for operational control
 */
export async function searchDocuments(
  query: string,
  options?: {
    top?: number;
    /** SharePoint folder path for scoped search (KQL filter) */
    folderScope?: string;
  }
): Promise<DocumentResult[]> {
  if (!isTeamAIPlan() || !isPreviewEnabled('knowledge-base')) return [];

  const endpoint = getSearchEndpoint();
  if (!endpoint) return [];

  // Get tokens: service token for AI Search, user token for SharePoint passthrough
  const [serviceToken, userToken] = await Promise.all([
    getAccessToken(),
    getGraphTokenWithScopes(['Sites.Read.All']).catch(() => null),
  ]);

  const body: Record<string, unknown> = {
    messages: [{ role: 'user', content: [{ type: 'text', text: query }] }],
    outputMode: 'ExtractedData',
    retrievalReasoningEffort: { kind: 'low' },
    maxOutputSize: 2048,
    maxRuntimeInSeconds: 15,
    ...(options?.top ? { top: options.top } : {}),
  };

  // Add folder scope filter if provided (KQL filter on SharePoint path)
  if (options?.folderScope) {
    const escaped = options.folderScope.replace(/"/g, '\\"');
    body.filter = `path:"${escaped}"`;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${serviceToken}`,
    'Content-Type': 'application/json',
  };

  // Pass user's delegated token for per-user SharePoint permissions (ADR-026)
  if (userToken) {
    headers['x-ms-query-source-authorization'] = `Bearer ${userToken}`;
  }

  try {
    const res = await fetch(
      `${endpoint}/knowledgebases/variscout-kb/retrieve?api-version=2025-11-01-preview`,
      {
        method: 'POST',
        headers,
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
