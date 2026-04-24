import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Pencil,
  Trash2,
  Camera,
  Loader2,
  ImageIcon,
  Paperclip,
  FileText,
  X,
} from 'lucide-react';
import type { FindingComment, CommentAttachment } from '@variscout/core';
import { validateAttachmentFile, SUPPORTED_ATTACHMENT_TYPES } from '@variscout/core/ai';
import FindingEditor from './FindingEditor';
import type { VoiceInputConfig } from '../VoiceInput';

export interface FindingCommentsProps {
  comments: FindingComment[];
  findingId: string;
  onAdd: (findingId: string, text: string, attachment?: File) => void;
  onEdit: (findingId: string, commentId: string, text: string) => void;
  onDelete: (findingId: string, commentId: string) => void;
  /** Callback when a photo is attached (Team plan only, main window only) */
  onAddPhoto?: (findingId: string, commentId: string, file: File) => void;
  /** Callback to capture photo via Teams SDK (used instead of file input when available) */
  onCaptureFromTeams?: (findingId: string, commentId: string) => void;
  /** Show author names on comments */
  showAuthors?: boolean;
  /** Optional Azure-only voice input that transcribes into the comment draft */
  voiceInput?: VoiceInputConfig;
}

/** Format a relative time string (e.g., "2h ago", "3d ago") */
function relativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Format a file size in human-readable form */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  // eslint-disable-next-line variscout/no-tofixed-on-stats -- internal computation (file size formatting) per code-style.md
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  // eslint-disable-next-line variscout/no-tofixed-on-stats -- internal computation (file size formatting) per code-style.md
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** File icon for a non-image attachment */
const AttachmentIcon: React.FC<{ size?: number }> = ({ size = 10 }) => (
  <FileText size={size} className="flex-shrink-0" />
);

/** Whether a MIME type is an image (handled via photos, not attachments) */
function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Expandable comment thread inside a FindingCard.
 * Collapsed: shows "N comments" link (or "Add comment" if 0).
 * Expanded: chronological thread with add/edit/delete.
 *
 * The "add comment" area now includes a Paperclip button for attaching a file
 * (image, PDF, Excel, CSV, TXT). The file is validated client-side with
 * `validateAttachmentFile()` before being passed to `onAdd`. Upload is
 * handled at the app level (not in this component).
 */
const FindingComments: React.FC<FindingCommentsProps> = ({
  comments,
  findingId,
  onAdd,
  onEdit,
  onDelete,
  onAddPhoto,
  onCaptureFromTeams,
  showAuthors,
  voiceInput,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Photo attach (existing flow — per-comment camera button)
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoCommentId, setPendingPhotoCommentId] = useState<string | null>(null);

  // New attachment flow — shown while composing a new comment
  const attachFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  const handleAdd = (text: string) => {
    onAdd(findingId, text, pendingAttachment ?? undefined);
    setIsAdding(false);
    setPendingAttachment(null);
    setAttachmentError(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setPendingAttachment(null);
    setAttachmentError(null);
  };

  const handleEdit = (commentId: string, text: string) => {
    onEdit(findingId, commentId, text);
    setEditingId(null);
  };

  // Existing camera flow (per-comment photo)
  const handlePhotoClick = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    if (onCaptureFromTeams) {
      onCaptureFromTeams(findingId, commentId);
    } else {
      setPendingPhotoCommentId(commentId);
      photoFileInputRef.current?.click();
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddPhoto && pendingPhotoCommentId) {
      onAddPhoto(findingId, pendingPhotoCommentId, file);
    }
    if (photoFileInputRef.current) photoFileInputRef.current.value = '';
    setPendingPhotoCommentId(null);
  };

  // New attachment flow — triggered by Paperclip button when composing
  const handleAttachClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttachmentError(null);
    attachFileInputRef.current?.click();
  };

  const handleAttachFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (attachFileInputRef.current) attachFileInputRef.current.value = '';
    if (!file) return;

    const result = await validateAttachmentFile(file);
    if (!result.valid) {
      setAttachmentError(result.reason ?? 'Invalid file');
      return;
    }
    setPendingAttachment(file);
    setAttachmentError(null);
    // Open the add-comment input if not already open
    setIsAdding(true);
  };

  const handleRemoveAttachment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingAttachment(null);
    setAttachmentError(null);
  };

  /** Build the file input accept string from SUPPORTED_ATTACHMENT_TYPES */
  const acceptTypes = SUPPORTED_ATTACHMENT_TYPES.join(',');

  return (
    <div className="mt-1.5" onClick={e => e.stopPropagation()}>
      {/* Hidden file input for photo capture (per-comment camera button) */}
      {onAddPhoto && (
        <input
          ref={photoFileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoFileChange}
          className="hidden"
        />
      )}

      {/* Hidden file input for new-comment attachments */}
      <input
        ref={attachFileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleAttachFileChange}
        className="hidden"
        aria-label="Attach file to comment"
      />

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-[0.625rem] text-content-muted hover:text-content-secondary transition-colors"
      >
        <MessageSquare size={10} />
        {comments.length > 0 ? (
          <span>
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span>Add comment</span>
        )}
      </button>

      {/* Expanded thread */}
      {isExpanded && (
        <div className="mt-1.5 space-y-1.5">
          {/* Comment list (oldest first) */}
          {comments.map(comment => (
            <div key={comment.id} className="group/comment">
              {editingId === comment.id ? (
                <FindingEditor
                  initialText={comment.text}
                  placeholder="Edit comment..."
                  onSave={text => handleEdit(comment.id, text)}
                  onCancel={() => setEditingId(null)}
                  voiceInput={voiceInput}
                />
              ) : (
                <div className="flex items-start gap-1 pl-2 border-l-2 border-edge">
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.6875rem] text-content-secondary leading-relaxed">
                      {comment.text}
                    </p>
                    {/* Photo thumbnails */}
                    {comment.photos && comment.photos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comment.photos.map(photo => (
                          <div
                            key={photo.id}
                            className="relative w-16 h-16 rounded overflow-hidden bg-surface-tertiary flex-shrink-0"
                          >
                            {photo.thumbnailDataUrl &&
                            /^data:image\/(jpeg|png|webp|gif);base64,/.test(
                              photo.thumbnailDataUrl
                            ) ? (
                              <img
                                src={photo.thumbnailDataUrl}
                                alt={photo.filename}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={16} className="text-content-muted" />
                              </div>
                            )}
                            {/* Upload status overlay */}
                            {photo.uploadStatus === 'pending' && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader2 size={14} className="text-white animate-spin" />
                              </div>
                            )}
                            {photo.uploadStatus === 'failed' && (
                              <div className="absolute bottom-0 left-0 right-0 bg-red-600/80 text-white text-[0.5rem] text-center py-0.5">
                                Failed
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Non-image file attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-1">
                        {comment.attachments.map((att: CommentAttachment) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-1 text-[0.625rem] text-content-secondary"
                            data-testid={`comment-attachment-${att.id}`}
                          >
                            <AttachmentIcon size={10} />
                            {att.webUrl ? (
                              <a
                                href={att.webUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate max-w-[140px] hover:text-blue-400 transition-colors"
                                title={att.filename}
                              >
                                {att.filename}
                              </a>
                            ) : (
                              <span className="truncate max-w-[140px]" title={att.filename}>
                                {att.filename}
                              </span>
                            )}
                            <span className="text-content-muted flex-shrink-0">
                              {formatFileSize(att.sizeBytes)}
                            </span>
                            {att.uploadStatus === 'pending' && (
                              <Loader2
                                size={10}
                                className="text-content-muted animate-spin flex-shrink-0"
                              />
                            )}
                            {att.uploadStatus === 'failed' && (
                              <span className="text-red-400 flex-shrink-0 text-[0.5625rem]">
                                Failed
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <span className="text-[0.5625rem] text-content-muted whitespace-nowrap">
                      {showAuthors && comment.author && (
                        <span className="text-blue-400 mr-1">{comment.author}</span>
                      )}
                      {relativeTime(comment.createdAt)}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/comment:opacity-100 touch-show transition-opacity">
                      {onAddPhoto && (
                        <button
                          onClick={e => handlePhotoClick(e, comment.id)}
                          className="p-0.5 rounded text-content-muted hover:text-content transition-colors"
                          title="Add photo"
                          aria-label="Add photo to comment"
                        >
                          <Camera size={10} />
                        </button>
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingId(comment.id);
                        }}
                        className="p-0.5 rounded text-content-muted hover:text-content transition-colors"
                        title="Edit comment"
                        aria-label="Edit comment"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDelete(findingId, comment.id);
                        }}
                        className="p-0.5 rounded text-content-muted hover:text-red-400 transition-colors"
                        title="Delete comment"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add comment input */}
          {isAdding ? (
            <div className="space-y-1">
              {/* Pending attachment preview */}
              {pendingAttachment && (
                <div
                  className="flex items-center gap-1 px-1.5 py-1 rounded bg-surface-secondary border border-edge/50 text-[0.625rem] text-content-secondary"
                  data-testid="pending-attachment-preview"
                >
                  {isImageMime(pendingAttachment.type) ? (
                    <ImageIcon size={10} className="flex-shrink-0" />
                  ) : (
                    <FileText size={10} className="flex-shrink-0" />
                  )}
                  <span className="truncate flex-1" title={pendingAttachment.name}>
                    {pendingAttachment.name}
                  </span>
                  <span className="text-content-muted flex-shrink-0">
                    {formatFileSize(pendingAttachment.size)}
                  </span>
                  <button
                    onClick={handleRemoveAttachment}
                    className="p-0.5 rounded hover:text-red-400 transition-colors flex-shrink-0"
                    aria-label="Remove attachment"
                    title="Remove attachment"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
              {/* Validation error */}
              {attachmentError && (
                <p className="text-[0.625rem] text-red-400" role="alert">
                  {attachmentError}
                </p>
              )}
              <div className="flex items-start gap-1">
                <div className="flex-1">
                  <FindingEditor
                    placeholder="Add a comment..."
                    onSave={handleAdd}
                    onCancel={handleCancelAdd}
                    voiceInput={voiceInput}
                  />
                </div>
                {/* Paperclip button — attach file to this comment */}
                <button
                  onClick={handleAttachClick}
                  className="mt-0.5 p-1 rounded text-content-muted hover:text-content transition-colors flex-shrink-0"
                  title="Attach file (PDF, Excel, CSV, TXT, image)"
                  aria-label="Attach file to comment"
                  data-testid="attach-file-button"
                >
                  <Paperclip size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={e => {
                  e.stopPropagation();
                  setIsAdding(true);
                }}
                className="text-[0.625rem] text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Add comment
              </button>
              {/* Paperclip button — start attaching without typing */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleAttachClick(e);
                }}
                className="p-0.5 rounded text-content-muted hover:text-content transition-colors"
                title="Attach file to new comment"
                aria-label="Attach file to new comment"
                data-testid="attach-file-button-inline"
              >
                <Paperclip size={10} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindingComments;
