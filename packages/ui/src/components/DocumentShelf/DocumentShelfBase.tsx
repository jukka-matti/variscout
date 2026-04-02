import React, { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { DocumentInfo, AutoIndexSummaryData } from './types';
import DocumentDropZone from './DocumentDropZone';
import DocumentRow from './DocumentRow';
import AutoIndexSummary from './AutoIndexSummary';

export interface DocumentShelfBaseProps {
  documents: DocumentInfo[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (documentId: string, fileName: string) => void;
  onDownload: (documentId: string, fileName: string) => void;
  isUploading?: boolean;
  uploadProgress?: string;
  error?: string;
  autoIndexSummary?: AutoIndexSummaryData;
}

const DocumentShelfBase: React.FC<DocumentShelfBaseProps> = ({
  documents,
  onUpload,
  onDelete,
  onDownload,
  isUploading = false,
  uploadProgress,
  error,
  autoIndexSummary,
}) => {
  const [filterText, setFilterText] = useState('');

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        await onUpload(file);
      }
    },
    [onUpload]
  );

  const filteredDocuments = useMemo(() => {
    const sorted = [...documents].sort((a, b) =>
      a.fileName.localeCompare(b.fileName, undefined, { sensitivity: 'base' })
    );
    if (!filterText.trim()) return sorted;
    const lower = filterText.toLowerCase();
    return sorted.filter(doc => doc.fileName.toLowerCase().includes(lower));
  }, [documents, filterText]);

  const handleClearFilter = useCallback(() => {
    setFilterText('');
  }, []);

  return (
    <div className="flex flex-col h-full" data-testid="document-shelf">
      {/* Drop zone — pinned */}
      <div className="shrink-0 p-2">
        <DocumentDropZone
          onFilesSelected={handleFilesSelected}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={error}
        />
      </div>

      {/* Filter input — pinned */}
      <div className="shrink-0 px-2 pb-2">
        <div className="relative flex items-center">
          <Search size={12} className="absolute left-2 text-content-muted pointer-events-none" />
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter documents..."
            className="w-full pl-7 pr-7 py-1.5 text-xs bg-surface-tertiary/50 border border-edge rounded-lg text-content placeholder:text-content-muted focus:outline-none focus:border-blue-500/50 transition-colors"
            data-testid="document-filter-input"
            aria-label="Filter documents"
          />
          {filterText && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="absolute right-2 text-content-muted hover:text-content transition-colors"
              aria-label="Clear filter"
              data-testid="document-filter-clear"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Document list — scrollable */}
      <div className="flex-1 min-h-0 overflow-auto px-2" data-testid="document-list">
        {documents.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-24 gap-1.5 text-center"
            data-testid="document-empty-state"
          >
            <p className="text-xs text-content-muted italic">No documents uploaded yet</p>
            <p className="text-[0.625rem] text-content-muted">
              Upload PDFs, spreadsheets, or text files for CoScout to reference
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div
            className="flex items-center justify-center h-16 text-xs text-content-muted italic"
            data-testid="document-no-results"
          >
            No documents match &ldquo;{filterText}&rdquo;
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredDocuments.map(doc => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDelete={onDelete}
                onDownload={onDownload}
                highlightText={filterText || undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Auto-index summary — pinned at bottom */}
      {autoIndexSummary && (
        <div className="shrink-0">
          <AutoIndexSummary
            findings={autoIndexSummary.findings}
            answers={autoIndexSummary.answers}
            conclusions={autoIndexSummary.conclusions}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentShelfBase;
