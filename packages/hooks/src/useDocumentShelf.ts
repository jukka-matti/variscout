import { useCallback, useMemo, useState } from 'react';

export interface DocumentInfo {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBy?: string;
  uploadedAt: string;
  mimeType?: string;
}

export interface UseDocumentShelfOptions {
  projectId: string | undefined;
  enabled: boolean;
  apiBase?: string;
}

export interface UseDocumentShelfReturn {
  documents: DocumentInfo[];
  filteredDocuments: DocumentInfo[];
  filterText: string;
  setFilterText: (text: string) => void;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress?: string;
  error?: string;
  upload: (file: File) => Promise<void>;
  uploadMultiple: (files: File[]) => Promise<void>;
  remove: (documentId: string, fileName: string) => Promise<void>;
  download: (documentId: string, fileName: string) => void;
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
  projectId: _projectId,
  enabled: _enabled,
  apiBase: _apiBase = '',
}: UseDocumentShelfOptions): UseDocumentShelfReturn {
  const [documents] = useState<DocumentInfo[]>([]);
  const [filterText, setFilterText] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const sortedDocuments = useMemo(() => sortDocuments(documents), [documents]);
  const filteredDocuments = useMemo(
    () => filterDocuments(sortedDocuments, filterText),
    [filterText, sortedDocuments]
  );

  const unsupported = useCallback(async () => {
    const message = 'Document shelf upload is not available in the local-first Workspace.';
    setError(message);
    throw new Error(message);
  }, []);

  const refresh = useCallback(async () => {
    setError(undefined);
  }, []);

  return {
    documents: sortedDocuments,
    filteredDocuments,
    filterText,
    setFilterText,
    isLoading: false,
    isUploading: false,
    uploadProgress: undefined,
    error,
    upload: unsupported,
    uploadMultiple: unsupported,
    remove: unsupported,
    download: () => {
      setError('Document shelf download is not available in the local-first Workspace.');
    },
    refresh,
  };
}
