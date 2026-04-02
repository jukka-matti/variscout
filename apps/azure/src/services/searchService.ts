/**
 * Azure AI Search client for Knowledge Base feature.
 *
 * ADR-060: Foundry IQ agentic retrieval for project-scoped knowledge search.
 * - searchDocuments() uses Foundry IQ agentic retrieval via the server-side proxy
 * - Folder-scoped search available via KQL filter when folderScope is provided
 */

import { hasKnowledgeBase, isPreviewEnabled } from '@variscout/core';
import { getAccessToken } from '../auth/easyAuth';
import { getRuntimeConfig } from '../lib/runtimeConfig';

// Knowledge Base is enabled when the preview toggle is on (controlled by admin UI).
// The actual availability check (isKnowledgeBaseAvailable) validates Team tier + search endpoint.
const KNOWLEDGE_BASE_ENABLED = true;

export interface DocumentResult {
  title: string;
  snippet: string;
  source: string;
  url?: string;
  relevanceScore: number;
}

function getSearchEndpoint(): string | null {
  return getRuntimeConfig()?.aiSearchEndpoint || import.meta.env.VITE_AI_SEARCH_ENDPOINT || null;
}

/**
 * Check if the Knowledge Base feature is available.
 * Requires Team plan (with KB access), configured search endpoint, and preview toggle enabled.
 */
export function isKnowledgeBaseAvailable(): boolean {
  if (!KNOWLEDGE_BASE_ENABLED) return false;
  return hasKnowledgeBase() && getSearchEndpoint() !== null && isPreviewEnabled('knowledge-base');
}

/**
 * Check if Knowledge Base permissions are available.
 */
export async function checkKnowledgeBasePermissions(): Promise<{
  available: boolean;
  hasSharePointAccess: boolean;
}> {
  if (!isKnowledgeBaseAvailable()) return { available: false, hasSharePointAccess: false };
  return { available: true, hasSharePointAccess: false };
}

/**
 * Search documents via Foundry IQ agentic retrieval (Knowledge Base).
 *
 * ADR-060: Foundry IQ agentic retrieval.
 * - Supports folder-scoped search via KQL filter when folderScope is provided
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
  if (!KNOWLEDGE_BASE_ENABLED) return [];
  if (!hasKnowledgeBase() || !isPreviewEnabled('knowledge-base')) return [];

  const endpoint = getSearchEndpoint();
  if (!endpoint) return [];

  const serviceToken = await getAccessToken();

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
