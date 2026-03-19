/**
 * useKnowledgeSearch - Wraps Knowledge Base search with state management.
 * Called explicitly before CoScout API calls to enrich context.
 * Supports dual-path search: findings (semantic) + documents (agentic retrieval).
 */

import { useState, useCallback } from 'react';

export interface KnowledgeResult {
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

export interface DocumentResult {
  title: string;
  snippet: string;
  source: string;
  url?: string;
  relevanceScore: number;
}

export interface UseKnowledgeSearchOptions {
  /** Injected search function for findings (from searchService.ts) */
  searchFn?: (
    query: string,
    options?: { factor?: string; top?: number }
  ) => Promise<KnowledgeResult[]>;
  /** Injected search function for documents (from searchService.ts) */
  searchDocumentsFn?: (
    query: string,
    options?: { top?: number; folderScope?: string }
  ) => Promise<DocumentResult[]>;
  /** Whether the Knowledge Base feature is enabled */
  enabled?: boolean;
  /** Custom SharePoint folder path for scoped search (ADR-026) */
  folderScope?: string;
}

export interface UseKnowledgeSearchReturn {
  results: KnowledgeResult[];
  documents: DocumentResult[];
  isSearching: boolean;
  /** Whether knowledge search is available (enabled + has search function) */
  isAvailable: boolean;
  /** Timestamp of the last completed search */
  lastSearchTimestamp: number | undefined;
  search: (
    query: string,
    factor?: string
  ) => Promise<{ findings: KnowledgeResult[]; documents: DocumentResult[] }>;
  clear: () => void;
}

export function useKnowledgeSearch(
  options: UseKnowledgeSearchOptions = {}
): UseKnowledgeSearchReturn {
  const { searchFn, searchDocumentsFn, enabled = false, folderScope } = options;

  const [results, setResults] = useState<KnowledgeResult[]>([]);
  const [documents, setDocuments] = useState<DocumentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchTimestamp, setLastSearchTimestamp] = useState<number | undefined>(undefined);

  const search = useCallback(
    async (
      query: string,
      factor?: string
    ): Promise<{ findings: KnowledgeResult[]; documents: DocumentResult[] }> => {
      const empty = { findings: [], documents: [] };
      if (!enabled || !query.trim()) {
        return empty;
      }

      // Need at least one search function
      if (!searchFn && !searchDocumentsFn) {
        return empty;
      }

      setIsSearching(true);
      try {
        // Run both searches in parallel
        const [findingsResults, docResults] = await Promise.all([
          searchFn ? searchFn(query, { factor }) : Promise.resolve([]),
          searchDocumentsFn ? searchDocumentsFn(query, { folderScope }) : Promise.resolve([]),
        ]);
        setResults(findingsResults);
        setDocuments(docResults);
        setLastSearchTimestamp(Date.now());
        return { findings: findingsResults, documents: docResults };
      } catch (err) {
        console.warn('[useKnowledgeSearch] Search failed:', err);
        return empty;
      } finally {
        setIsSearching(false);
      }
    },
    [enabled, searchFn, searchDocumentsFn, folderScope]
  );

  const clear = useCallback(() => {
    setResults([]);
    setDocuments([]);
  }, []);

  return {
    results,
    documents,
    isSearching,
    isAvailable: enabled && (!!searchFn || !!searchDocumentsFn),
    lastSearchTimestamp,
    search,
    clear,
  };
}
