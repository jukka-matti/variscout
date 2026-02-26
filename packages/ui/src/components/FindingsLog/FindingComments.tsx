import React, { useState } from 'react';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import type { FindingComment } from '@variscout/core';
import FindingEditor from './FindingEditor';

export interface FindingCommentsProps {
  comments: FindingComment[];
  findingId: string;
  onAdd: (findingId: string, text: string) => void;
  onEdit: (findingId: string, commentId: string, text: string) => void;
  onDelete: (findingId: string, commentId: string) => void;
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  return (
    <div className="mt-1.5" onClick={e => e.stopPropagation()}>
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
                  <p className="flex-1 text-[11px] text-content-secondary leading-relaxed">
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <span className="text-[9px] text-content-muted whitespace-nowrap">
                      {relativeTime(comment.createdAt)}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/comment:opacity-100 transition-opacity">
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
