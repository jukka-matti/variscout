/**
 * Client-side trigger for indexing findings to Azure AI Search.
 * Called after successful cloud saves for Team AI plan.
 */

import { isTeamAIPlan, isPreviewEnabled } from '@variscout/core';
import type { Finding, Hypothesis } from '@variscout/core';
import { getRuntimeConfig } from '../lib/runtimeConfig';
import { getAccessToken } from '../auth/easyAuth';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get the Function App URL for API calls.
 */
function getFunctionUrl(): string {
  return getRuntimeConfig()?.functionUrl || import.meta.env.VITE_FUNCTION_URL || '';
}

/**
 * Index findings to Azure AI Search via the Function App.
 * Debounced (5 seconds) to avoid indexing on rapid saves.
 * Fire-and-forget: errors are logged, never block the save flow.
 */
export function indexFindingsToSearch(
  projectName: string,
  projectId: string,
  findings: Finding[],
  hypotheses?: Hypothesis[]
): void {
  // Only index for Team AI plan with Knowledge Base preview enabled
  if (!isTeamAIPlan() || !isPreviewEnabled('knowledge-base')) return;

  const functionUrl = getFunctionUrl();
  if (!functionUrl) return;

  // Debounce: cancel previous pending index
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    debounceTimer = null;
    try {
      const token = await getAccessToken();
      const res = await fetch(`${functionUrl}/api/index-findings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectName,
          projectId,
          findings,
          hypotheses: hypotheses ?? [],
        }),
      });

      if (!res.ok) {
        console.warn('[indexService] Indexing failed:', res.status);
      }
    } catch (err) {
      console.warn('[indexService] Indexing error:', err);
    }
  }, 5000);
}
