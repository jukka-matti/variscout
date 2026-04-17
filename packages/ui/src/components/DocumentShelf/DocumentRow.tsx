import React, { useCallback } from 'react';
import { FileText, FileSpreadsheet, File, Download, Trash2 } from 'lucide-react';
import type { DocumentInfo } from './types';

export interface DocumentRowProps {
  document: DocumentInfo;
  onDelete: (documentId: string, fileName: string) => void;
  onDownload: (documentId: string, fileName: string) => void;
  highlightText?: string;
}

function getFileIcon(mimeType?: string, fileName?: string): React.ReactNode {
  const ext = fileName?.split('.').pop()?.toLowerCase() ?? '';
  const mime = mimeType ?? '';

  if (
    mime.includes('pdf') ||
    ext === 'pdf' ||
    mime.includes('text') ||
    ext === 'txt' ||
    ext === 'md'
  ) {
    return <FileText size={14} className="shrink-0 text-content-secondary" />;
  }
  if (mime.includes('spreadsheet') || mime.includes('excel') || ext === 'xlsx' || ext === 'csv') {
    return <FileSpreadsheet size={14} className="shrink-0 text-content-secondary" />;
  }
  return <File size={14} className="shrink-0 text-content-secondary" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  // eslint-disable-next-line variscout/no-tofixed-on-stats -- internal computation (file size formatting) per code-style.md
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  // eslint-disable-next-line variscout/no-tofixed-on-stats -- internal computation (file size formatting) per code-style.md
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function highlightMatch(text: string, highlight?: string): React.ReactNode {
  if (!highlight) return text;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-400/30 text-content rounded-sm">
        {text.slice(idx, idx + highlight.length)}
      </mark>
      {text.slice(idx + highlight.length)}
    </>
  );
}

const DocumentRow: React.FC<DocumentRowProps> = ({
  document,
  onDelete,
  onDownload,
  highlightText,
}) => {
  const handleDownload = useCallback(() => {
    onDownload(document.id, document.fileName);
  }, [document.id, document.fileName, onDownload]);

  const handleDelete = useCallback(() => {
    onDelete(document.id, document.fileName);
  }, [document.id, document.fileName, onDelete]);

  return (
    <div
      className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-surface-tertiary/50 group transition-colors"
      data-testid={`document-row-${document.id}`}
    >
      {getFileIcon(document.mimeType, document.fileName)}

      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium text-content truncate"
          title={document.fileName}
          data-testid={`document-name-${document.id}`}
        >
          {highlightMatch(document.fileName, highlightText)}
        </p>
        <p className="text-[0.625rem] text-content-muted mt-0.5">
          {formatFileSize(document.fileSize)}
          {document.uploadedBy && <> · {document.uploadedBy}</>}
          {' · '}
          {formatDate(document.uploadedAt)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleDownload}
          className="p-1 rounded text-content-secondary hover:text-content transition-colors"
          title={`Download ${document.fileName}`}
          aria-label={`Download ${document.fileName}`}
          data-testid={`document-download-${document.id}`}
        >
          <Download size={12} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1 rounded text-content-secondary hover:text-red-400 transition-colors"
          title={`Delete ${document.fileName}`}
          aria-label={`Delete ${document.fileName}`}
          data-testid={`document-delete-${document.id}`}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default DocumentRow;
