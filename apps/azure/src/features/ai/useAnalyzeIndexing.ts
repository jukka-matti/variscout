/**
 * useAnalyzeIndexing — local-first no-op after ADR-093 D2.
 *
 * The previous implementation serialized investigation artifacts to Blob
 * Storage for Foundry IQ indexing. V1 keeps typed CoScout but removes Azure
 * document persistence and Blob-backed artifact indexing.
 */

import { useCallback } from 'react';
import type { Finding, ProblemStatementScope } from '@variscout/core';

export interface UseInvestigationIndexingOptions {
  /** The current project ID — determines blob path prefix */
  projectId: string | undefined;
  /** Enable serialization (Team plan + KB preview enabled) */
  enabled: boolean;
}

export interface UseInvestigationIndexingReturn {
  /** Call after findings array changes to schedule a debounced JSONL upload */
  onFindingsChange: (findings: Finding[]) => void;
  /** Call after scopes array changes to schedule a debounced JSONL upload */
  onScopesChange: (scopes: ProblemStatementScope[]) => void;
}

export function useAnalyzeIndexing({
  projectId: _projectId,
  enabled: _enabled,
}: UseInvestigationIndexingOptions): UseInvestigationIndexingReturn {
  const onFindingsChange = useCallback((_findings: Finding[]) => {
    // Intentionally no-op: no Blob indexing in the local-first V1 product.
  }, []);

  const onScopesChange = useCallback((_scopes: ProblemStatementScope[]) => {
    // Intentionally no-op: no Blob indexing in the local-first V1 product.
  }, []);

  return { onFindingsChange, onScopesChange };
}
