import React from 'react';
import { Download, X, FileText, MessageSquare, Pin } from 'lucide-react';

export interface KnowledgeCitationData {
  // For documents:
  fileName?: string;
  chunkText?: string;
  section?: string;
  chunkIndex?: number;
  totalChunks?: number;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  // For findings:
  status?: string;
  outcome?: { effective?: string; cpkDelta?: number };
  commentCount?: number;
  linkedQuestion?: string;
  // For answers:
  answerText?: string;
  questionText?: string;
  hasAttachment?: boolean;
}

export interface KnowledgeCitationCardProps {
  refType: 'document' | 'finding' | 'answer';
  refId: string;
  displayText: string;
  citationData?: KnowledgeCitationData;
  onDownload?: () => void;
  onClose: () => void;
}

function formatFileSize(bytes?: number): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentCard({
  data,
  displayText,
  onDownload,
  onClose,
}: {
  data: KnowledgeCitationData;
  displayText: string;
  onDownload?: () => void;
  onClose: () => void;
}): React.ReactElement {
  const footerParts: string[] = [];
  if (data.chunkIndex != null && data.totalChunks != null) {
    footerParts.push(`Chunk ${data.chunkIndex} of ${data.totalChunks}`);
  }
  const size = formatFileSize(data.fileSize);
  if (size) footerParts.push(size);
  if (data.uploadedBy) footerParts.push(data.uploadedBy);
  if (data.uploadedAt) footerParts.push(data.uploadedAt);

  return (
    <div
      className="ml-4 mt-1 rounded-lg border border-blue-500/30 bg-blue-500/5 overflow-hidden"
      data-testid="citation-card-document"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-500/20">
        <FileText size={13} className="text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[0.6875rem] font-medium text-blue-300 truncate block">
            {data.fileName ?? displayText}
          </span>
          {data.section && (
            <span className="text-[0.5625rem] text-content-muted">{data.section}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="p-1 text-content-muted hover:text-blue-300 transition-colors"
              title="Download document"
              aria-label="Download document"
              data-testid="citation-download-btn"
            >
              <Download size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-content-muted hover:text-content transition-colors"
            title="Close preview"
            aria-label="Close citation preview"
            data-testid="citation-close-btn"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      {data.chunkText && (
        <p className="px-3 py-2 text-[0.625rem] text-content-secondary italic leading-relaxed line-clamp-4">
          {data.chunkText}
        </p>
      )}
      {footerParts.length > 0 && (
        <div className="px-3 pb-2 text-[0.5625rem] text-content-muted">
          {footerParts.join(' · ')}
        </div>
      )}
    </div>
  );
}

function FindingCard({
  data,
  displayText,
  onClose,
}: {
  data: KnowledgeCitationData;
  displayText: string;
  onClose: () => void;
}): React.ReactElement {
  return (
    <div
      className="ml-4 mt-1 rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden"
      data-testid="citation-card-finding"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-500/20">
        <Pin size={13} className="text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[0.6875rem] font-medium text-amber-300 truncate block">
            {displayText}
          </span>
          {data.status && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[0.5rem] font-medium mt-0.5">
              {data.status}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-content-muted hover:text-content transition-colors flex-shrink-0"
          title="Close preview"
          aria-label="Close citation preview"
          data-testid="citation-close-btn"
        >
          <X size={12} />
        </button>
      </div>
      <div className="px-3 py-2 space-y-1">
        {data.outcome && (
          <p className="text-[0.625rem] text-content-secondary">
            Outcome: <span className="text-content">{data.outcome.effective ?? 'Pending'}</span>
            {data.outcome.cpkDelta != null && (
              <span className="ml-1 text-green-400">
                (Cpk {data.outcome.cpkDelta > 0 ? '+' : ''}
                {Number.isFinite(data.outcome.cpkDelta) ? data.outcome.cpkDelta.toFixed(2) : '—'})
              </span>
            )}
          </p>
        )}
        {data.commentCount != null && data.commentCount > 0 && (
          <p className="text-[0.5625rem] text-content-muted">
            {data.commentCount} comment{data.commentCount !== 1 ? 's' : ''}
          </p>
        )}
        {data.linkedQuestion && (
          <p className="text-[0.5625rem] text-content-muted">
            Question: <span className="text-content-secondary">{data.linkedQuestion}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function AnswerCard({
  data,
  displayText,
  onClose,
}: {
  data: KnowledgeCitationData;
  displayText: string;
  onClose: () => void;
}): React.ReactElement {
  return (
    <div
      className="ml-4 mt-1 rounded-lg border border-blue-400/20 bg-blue-400/5 overflow-hidden"
      data-testid="citation-card-answer"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-400/15">
        <MessageSquare size={13} className="text-blue-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[0.6875rem] font-medium text-blue-200 truncate block">
            {displayText}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-400/15 text-blue-300 text-[0.5rem] font-medium mt-0.5">
            answer
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-content-muted hover:text-content transition-colors flex-shrink-0"
          title="Close preview"
          aria-label="Close citation preview"
          data-testid="citation-close-btn"
        >
          <X size={12} />
        </button>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {data.answerText && (
          <p className="text-[0.625rem] text-content-secondary leading-relaxed">
            {data.answerText}
          </p>
        )}
        {data.questionText && (
          <p className="text-[0.5625rem] text-content-muted">
            Answer to: <span className="text-content-secondary italic">{data.questionText}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline citation preview card for CoScout knowledge source references (ADR-060).
 * Renders below a message when a [REF:document:id] or [REF:answer:id] link is clicked.
 */
export function KnowledgeCitationCard({
  refType,
  refId: _refId,
  displayText,
  citationData = {},
  onDownload,
  onClose,
}: KnowledgeCitationCardProps): React.ReactElement {
  if (refType === 'finding') {
    return <FindingCard data={citationData} displayText={displayText} onClose={onClose} />;
  }

  if (refType === 'answer') {
    return <AnswerCard data={citationData} displayText={displayText} onClose={onClose} />;
  }

  // Default: document
  return (
    <DocumentCard
      data={citationData}
      displayText={displayText}
      onDownload={onDownload}
      onClose={onClose}
    />
  );
}
