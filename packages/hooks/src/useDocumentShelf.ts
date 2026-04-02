/**
 * useDocumentShelf - Document shelf state management for KB document CRUD.
 * Handles fetch, upload (single and multiple), delete, download, and client-side filtering.
 * Only active when enabled (Team tier + preview gate). ADR-060.
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Metadata for a single document stored in the Knowledge Base.
 * Defined here (hooks layer) so that @variscout/ui can import it downward.
 */
export interface DocumentInfo {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBy?: string;
  uploadedAt: string;
  mimeType?: string;
}

export interface UseDocumentShelfOptions {
  /** Project ID scoping all operations */
  projectId: string | undefined;
  /** Whether the Document Shelf is active (Team tier + preview enabled) */
  enabled: boolean;
  /** API base URL, defaults to '' (same origin) */
  apiBase?: string;
}

export interface UseDocumentShelfReturn {
  /** All documents fetched from the server */
  documents: DocumentInfo[];
  /** Documents after client-side filter applied (always alphabetically sorted) */
  filteredDocuments: DocumentInfo[];
  /** Current filter text */
  filterText: string;
  /** Update the filter text */
  setFilterText: (text: string) => void;
  /** True while fetching the document list */
  isLoading: boolean;
  /** True while one or more files are being uploaded */
  isUploading: boolean;
  /** Human-readable upload progress e.g. "Uploading 2 of 5..." */
  uploadProgress?: string;
  /** Last error message, cleared on the next successful operation */
  error?: string;
  /** Upload a single file */
  upload: (file: File) => Promise<void>;
  /** Upload multiple files sequentially with progress reporting */
  uploadMultiple: (files: File[]) => Promise<void>;
  /** Remove a document (optimistic) */
  remove: (documentId: string, fileName: string) => Promise<void>;
  /** Open the document in a new tab (or trigger browser download via constructed URL) */
  download: (documentId: string, fileName: string) => void;
  /** Re-fetch the document list */
  refresh: () => Promise<void>;
}

function sortDocuments(docs: DocumentInfo[]): DocumentInfo[] {
  return [...docs].sort((a, b) => a.fileName.toLowerCase().localeCompare(b.fileName.toLowerCase()));
}

function filterDocuments(docs: DocumentInfo[], text: string): DocumentInfo[] {
  if (!text.trim()) return docs;
  const lower = text.toLowerCase();
  return docs.filter(d => d.fileName.toLowerCase().includes(lower));
}

export function useDocumentShelf({
  projectId,
  enabled,
  apiBase = '',
}: UseDocumentShelfOptions): UseDocumentShelfReturn {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  // Derived: always sorted alphabetically, then filtered
  const sortedDocuments = sortDocuments(documents);
  const filteredDocuments = filterDocuments(sortedDocuments, filterText);

  const fetchDocuments = useCallback(async (): Promise<void> => {
    if (!enabled || !projectId) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/kb-list?projectId=${encodeURIComponent(projectId)}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch documents: ${res.status}`);
      }
      const data = (await res.json()) as DocumentInfo[];
      setDocuments(data);
      setError(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(message);
      console.warn('[useDocumentShelf] Fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, projectId, apiBase]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const upload = useCallback(
    async (file: File): Promise<void> => {
      if (!enabled || !projectId) return;

      setIsUploading(true);
      setUploadProgress(undefined);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

        const res = await fetch(`${apiBase}/api/kb-upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) {
          throw new Error(`Upload failed: ${res.status}`);
        }
        setError(undefined);
        // Refresh to get server-assigned ID and metadata
        await fetchDocuments();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        console.warn('[useDocumentShelf] Upload failed:', err);
        throw err;
      } finally {
        setIsUploading(false);
        setUploadProgress(undefined);
      }
    },
    [enabled, projectId, apiBase, fetchDocuments]
  );

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<void> => {
      if (!enabled || !projectId || files.length === 0) return;

      setIsUploading(true);
      const total = files.length;

      try {
        for (let i = 0; i < total; i++) {
          setUploadProgress(`Uploading ${i + 1} of ${total}...`);

          const formData = new FormData();
          formData.append('file', files[i]);
          formData.append('projectId', projectId);

          const res = await fetch(`${apiBase}/api/kb-upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });
          if (!res.ok) {
            throw new Error(`Upload failed for "${files[i].name}": ${res.status}`);
          }
        }
        setError(undefined);
        await fetchDocuments();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        console.warn('[useDocumentShelf] uploadMultiple failed:', err);
        throw err;
      } finally {
        setIsUploading(false);
        setUploadProgress(undefined);
      }
    },
    [enabled, projectId, apiBase, fetchDocuments]
  );

  const remove = useCallback(
    async (documentId: string, fileName: string): Promise<void> => {
      if (!enabled || !projectId) return;

      // Optimistic removal
      setDocuments(prev => prev.filter(d => d.id !== documentId));

      try {
        const res = await fetch(`${apiBase}/api/kb-delete`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, documentId, fileName }),
        });
        if (!res.ok) {
          throw new Error(`Delete failed: ${res.status}`);
        }
        setError(undefined);
      } catch (err) {
        // Roll back optimistic removal
        const message = err instanceof Error ? err.message : 'Delete failed';
        setError(message);
        console.warn('[useDocumentShelf] Delete failed:', err);
        // Re-fetch to restore state
        void fetchDocuments();
        throw err;
      }
    },
    [enabled, projectId, apiBase, fetchDocuments]
  );

  const download = useCallback(
    (documentId: string, fileName: string): void => {
      if (!enabled || !projectId) return;
      // Construct a download URL; the server may return a SAS token redirect
      const url = `${apiBase}/api/kb-download?projectId=${encodeURIComponent(projectId)}&documentId=${encodeURIComponent(documentId)}&fileName=${encodeURIComponent(fileName)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [enabled, projectId, apiBase]
  );

  const refresh = useCallback(async (): Promise<void> => {
    await fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents: sortedDocuments,
    filteredDocuments,
    filterText,
    setFilterText,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    upload,
    uploadMultiple,
    remove,
    download,
    refresh,
  };
}
