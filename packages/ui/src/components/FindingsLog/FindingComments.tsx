import React, { useState, useRef } from 'react';
import { MessageSquare, Pencil, Trash2, Camera, Loader2, ImageIcon } from 'lucide-react';
import type { FindingComment } from '@variscout/core';
import FindingEditor from './FindingEditor';

export interface FindingCommentsProps {
  comments: FindingComment[];
  findingId: string;
  onAdd: (findingId: string, text: string) => void;
  onEdit: (findingId: string, commentId: string, text: string) => void;
  onDelete: (findingId: string, commentId: string) => void;
  /** Callback when a photo is attached (Team plan only, main window only) */
  onAddPhoto?: (findingId: string, commentId: string, file: File) => void;
  /** Callback to capture photo via Teams SDK (used instead of file input when available) */
  onCaptureFromTeams?: (findingId: string, commentId: string) => void;
  /** Show author names on comments */
  showAuthors?: boolean;
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

/**
 * Expandable comment thread inside a FindingCard.
 * Collapsed: shows "N comments" link (or "Add comment" if 0).
 * Expanded: chronological thread with add/edit/delete.
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoCommentId, setPendingPhotoCommentId] = useState<string | null>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  const handleAdd = (text: string) => {
    onAdd(findingId, text);
    setIsAdding(false);
  };

  const handleEdit = (commentId: string, text: string) => {
    onEdit(findingId, commentId, text);
    setEditingId(null);
  };

  const handlePhotoClick = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    if (onCaptureFromTeams) {
      onCaptureFromTeams(findingId, commentId);
    } else {
      setPendingPhotoCommentId(commentId);
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddPhoto && pendingPhotoCommentId) {
      onAddPhoto(findingId, pendingPhotoCommentId, file);
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPendingPhotoCommentId(null);
  };

  return (
    <div className="mt-1.5" onClick={e => e.stopPropagation()}>
      {/* Hidden file input for photo capture */}
      {onAddPhoto && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content-secondary transition-colors"
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
                />
              ) : (
                <div className="flex items-start gap-1 pl-2 border-l-2 border-edge">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-content-secondary leading-relaxed">
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
                              <div className="absolute bottom-0 left-0 right-0 bg-red-600/80 text-white text-[8px] text-center py-0.5">
                                Failed
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <span className="text-[9px] text-content-muted whitespace-nowrap">
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
            <FindingEditor
              placeholder="Add a comment..."
              onSave={handleAdd}
              onCancel={() => setIsAdding(false)}
            />
          ) : (
            <button
              onClick={e => {
                e.stopPropagation();
                setIsAdding(true);
              }}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Add comment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FindingComments;
