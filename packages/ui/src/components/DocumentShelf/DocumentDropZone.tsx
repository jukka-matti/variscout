import React, { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

export interface DocumentDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: string;
  error?: string;
}

const ACCEPTED_TYPES = '.pdf,.xlsx,.docx,.csv,.txt,.md';

const DocumentDropZone: React.FC<DocumentDropZoneProps> = ({
  onFilesSelected,
  isUploading = false,
  uploadProgress,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFilesSelected(Array.from(files));
    },
    [onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFiles]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const borderClass = isDragOver
    ? 'border-blue-500 bg-blue-500/5'
    : 'border-edge hover:border-content-secondary';

  return (
    <div
      className={`rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${borderClass}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="document-drop-zone"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleInputChange}
        data-testid="document-file-input"
        aria-label="Upload files"
      />

      {isUploading ? (
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <Upload size={14} className="animate-pulse text-blue-400" />
          <span data-testid="upload-progress">{uploadProgress ?? 'Uploading...'}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-content-muted">
          <Upload size={14} />
          <span>
            Drop files or{' '}
            <button
              type="button"
              onClick={handleBrowseClick}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
              data-testid="document-browse-button"
            >
              browse
            </button>
          </span>
        </div>
      )}

      <p className="mt-1 text-[0.625rem] text-content-muted">PDF, XLSX, DOCX, CSV, TXT, MD</p>

      {error && (
        <p className="mt-1 text-[0.625rem] text-red-400" data-testid="upload-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default DocumentDropZone;
