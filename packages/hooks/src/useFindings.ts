import { useState, useCallback } from 'react';
import {
  createFinding,
  createFindingComment,
  createActionItem,
  findDuplicateFinding,
  findDuplicateBySource,
  migrateFindings,
  type ActionItem,
  type CommentAttachment,
  type Finding,
  type FindingAssignee,
  type FindingComment,
  type FindingContext,
  type FindingOutcome,
  type FindingProjection,
  type FindingSource,
  type FindingStatus,
  type FindingTag,
  type PhotoAttachment,
  type PhotoUploadStatus,
  type BenchmarkStats,
} from '@variscout/core';

export interface UseFindingsOptions {
  /** Initial findings (for restoring persisted state) */
  initialFindings?: Finding[];
  /** Callback when findings change (for external persistence) */
  onFindingsChange?: (findings: Finding[]) => void;
  /** Callback when a finding's status changes (for external integrations like Teams cards) */
  onStatusChange?: (finding: Finding, newStatus: FindingStatus) => void;
}

export interface UseFindingsReturn {
  /** Current findings list */
  findings: Finding[];
  /** Add a new finding with the given note and context, optionally linked to a chart source */
  addFinding: (text: string, context: FindingContext, source?: FindingSource) => Finding;
  /** Update an existing finding's note text */
  editFinding: (id: string, text: string) => void;
  /** Delete a finding */
  deleteFinding: (id: string) => void;
  /** Get a finding's context (for filter restoration) */
  getFindingContext: (id: string) => FindingContext | undefined;
  /** Find an existing finding with matching filters (for duplicate detection) */
  findDuplicate: (activeFilters: Record<string, (string | number)[]>) => Finding | undefined;
  /** Find an existing finding with matching chart source (for duplicate detection) */
  findDuplicateSource: (source: FindingSource) => Finding | undefined;
  /** Get findings linked to a specific chart type */
  getChartFindings: (chartType: FindingSource['chart']) => Finding[];
  /** Change a finding's investigation status */
  setFindingStatus: (id: string, status: FindingStatus) => void;
  /** Set or clear a finding's classification tag */
  setFindingTag: (id: string, tag: FindingTag | null) => void;
  /** Add a comment to a finding. Returns the created comment. */
  addFindingComment: (id: string, text: string, author?: string) => FindingComment;
  /** Edit an existing comment */
  editFindingComment: (findingId: string, commentId: string, text: string) => void;
  /** Delete a comment */
  deleteFindingComment: (findingId: string, commentId: string) => void;
  /** Set or clear a finding's assignee (Team plan @mention workflow) */
  setFindingAssignee: (id: string, assignee: FindingAssignee | null) => void;
  /** Add a photo attachment to an existing comment */
  addPhotoToComment: (findingId: string, commentId: string, photo: PhotoAttachment) => void;
  /** Update a photo's upload status (and optionally set driveItemId) */
  updatePhotoStatus: (
    findingId: string,
    commentId: string,
    photoId: string,
    status: PhotoUploadStatus,
    driveItemId?: string
  ) => void;
  /** Add a non-image file attachment to an existing comment */
  addAttachmentToComment: (
    findingId: string,
    commentId: string,
    attachment: CommentAttachment
  ) => void;
  /** Update a non-image attachment's upload status (and optionally set driveItemId + webUrl) */
  updateAttachmentStatus: (
    findingId: string,
    commentId: string,
    attachmentId: string,
    status: PhotoUploadStatus,
    driveItemId?: string,
    webUrl?: string
  ) => void;
  /** Link a finding to a hypothesis */
  linkHypothesis: (
    id: string,
    hypothesisId: string,
    validationStatus?: 'supports' | 'contradicts' | 'inconclusive'
  ) => void;
  /** Unlink a finding from its hypothesis */
  unlinkHypothesis: (id: string) => void;
  /** Set a projection on a finding */
  setProjection: (id: string, projection: FindingProjection) => void;
  /** Clear a finding's projection */
  clearProjection: (id: string) => void;
  /** Add an action item to a finding, optionally linked to an improvement idea */
  addAction: (
    id: string,
    text: string,
    assignee?: FindingAssignee,
    dueDate?: string,
    ideaId?: string
  ) => void;
  /** Update an existing action item */
  updateAction: (
    id: string,
    actionId: string,
    updates: Partial<Pick<ActionItem, 'text' | 'assignee' | 'dueDate'>>
  ) => void;
  /** Mark an action item as completed */
  completeAction: (id: string, actionId: string) => void;
  /** Delete an action item */
  deleteAction: (id: string, actionId: string) => void;
  /** Set outcome assessment */
  setOutcome: (id: string, outcome: FindingOutcome) => void;
  /** Mark a finding as the project benchmark (clears previous benchmark) */
  setBenchmark: (id: string, benchmarkStats: BenchmarkStats) => void;
  /** Clear benchmark marking (reverts finding to observation) */
  clearBenchmark: (id: string) => void;
  /** Toggle scope override: undefined → true → false → undefined */
  toggleScope: (id: string) => void;
}

/**
 * Manages a list of analyst findings (bookmarked filter states with notes).
 *
 * Findings are ordered by creation time (newest first).
 * The caller provides context (filters, stats) when adding — this hook
 * doesn't depend on DataContext directly.
 */
export function useFindings(options: UseFindingsOptions = {}): UseFindingsReturn {
  const { initialFindings, onFindingsChange, onStatusChange } = options;

  const [findings, setFindings] = useState<Finding[]>(() =>
    initialFindings ? migrateFindings(initialFindings) : []
  );

  const addFinding = useCallback(
    (text: string, context: FindingContext, source?: FindingSource): Finding => {
      const finding = createFinding(
        text,
        context.activeFilters,
        context.cumulativeScope,
        context.stats,
        undefined,
        source
      );
      setFindings(prev => {
        const next = [finding, ...prev];
        onFindingsChange?.(next);
        return next;
      });
      return finding;
    },
    [onFindingsChange]
  );

  const editFinding = useCallback(
    (id: string, text: string) => {
      setFindings(prev => {
        const next = prev.map(f => (f.id === id ? { ...f, text } : f));
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const deleteFinding = useCallback(
    (id: string) => {
      setFindings(prev => {
        const next = prev.filter(f => f.id !== id);
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const getFindingContext = useCallback(
    (id: string): FindingContext | undefined => {
      return findings.find(f => f.id === id)?.context;
    },
    [findings]
  );

  const findDuplicate = useCallback(
    (activeFilters: Record<string, (string | number)[]>): Finding | undefined => {
      return findDuplicateFinding(findings, activeFilters);
    },
    [findings]
  );

  const findDuplicateSource = useCallback(
    (source: FindingSource): Finding | undefined => {
      return findDuplicateBySource(findings, source);
    },
    [findings]
  );

  const getChartFindings = useCallback(
    (chartType: FindingSource['chart']): Finding[] => {
      return findings.filter(f => f.source?.chart === chartType);
    },
    [findings]
  );

  const setFindingStatus = useCallback(
    (id: string, status: FindingStatus) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === id ? { ...f, status, statusChangedAt: Date.now() } : f
        );
        onFindingsChange?.(next);
        const updated = next.find(f => f.id === id);
        if (updated) onStatusChange?.(updated, status);
        return next;
      });
    },
    [onFindingsChange, onStatusChange]
  );

  const setFindingTag = useCallback(
    (id: string, tag: FindingTag | null) => {
      setFindings(prev => {
        const next = prev.map(f => (f.id === id ? { ...f, tag: tag ?? undefined } : f));
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const setFindingAssignee = useCallback(
    (id: string, assignee: FindingAssignee | null) => {
      setFindings(prev => {
        const next = prev.map(f => (f.id === id ? { ...f, assignee: assignee ?? undefined } : f));
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const addFindingComment = useCallback(
    (id: string, text: string, author?: string) => {
      const comment = createFindingComment(text, author);
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === id ? { ...f, comments: [...f.comments, comment] } : f
        );
        onFindingsChange?.(next);
        return next;
      });
      return comment;
    },
    [onFindingsChange]
  );

  const editFindingComment = useCallback(
    (findingId: string, commentId: string, text: string) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c => (c.id === commentId ? { ...c, text } : c)),
              }
            : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const deleteFindingComment = useCallback(
    (findingId: string, commentId: string) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === findingId ? { ...f, comments: f.comments.filter(c => c.id !== commentId) } : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const addPhotoToComment = useCallback(
    (findingId: string, commentId: string, photo: PhotoAttachment) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c =>
                  c.id === commentId ? { ...c, photos: [...(c.photos ?? []), photo] } : c
                ),
              }
            : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const updatePhotoStatus = useCallback(
    (
      findingId: string,
      commentId: string,
      photoId: string,
      status: PhotoUploadStatus,
      driveItemId?: string
    ) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c =>
                  c.id === commentId
                    ? {
                        ...c,
                        photos: c.photos?.map(p =>
                          p.id === photoId
                            ? {
                                ...p,
                                uploadStatus: status,
                                ...(driveItemId ? { driveItemId } : {}),
                              }
                            : p
                        ),
                      }
                    : c
                ),
              }
            : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const addAttachmentToComment = useCallback(
    (findingId: string, commentId: string, attachment: CommentAttachment) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c =>
                  c.id === commentId
                    ? { ...c, attachments: [...(c.attachments ?? []), attachment] }
                    : c
                ),
              }
            : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const updateAttachmentStatus = useCallback(
    (
      findingId: string,
      commentId: string,
      attachmentId: string,
      status: PhotoUploadStatus,
      driveItemId?: string,
      webUrl?: string
    ) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === findingId
            ? {
                ...f,
                comments: f.comments.map(c =>
                  c.id === commentId
                    ? {
                        ...c,
                        attachments: c.attachments?.map(a =>
                          a.id === attachmentId
                            ? {
                                ...a,
                                uploadStatus: status,
                                ...(driveItemId ? { driveItemId } : {}),
                                ...(webUrl ? { webUrl } : {}),
                              }
                            : a
                        ),
                      }
                    : c
                ),
              }
            : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const linkHypothesis = useCallback(
    (
      id: string,
      hypothesisId: string,
      validationStatus?: 'supports' | 'contradicts' | 'inconclusive'
    ) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === id
            ? { ...f, hypothesisId, validationStatus: validationStatus ?? f.validationStatus }
            : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const unlinkHypothesis = useCallback(
    (id: string) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === id ? { ...f, hypothesisId: undefined, validationStatus: undefined } : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const setProjection = useCallback(
    (id: string, projection: FindingProjection) => {
      setFindings(prev => {
        const next = prev.map(f => (f.id === id ? { ...f, projection } : f));
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const clearProjection = useCallback(
    (id: string) => {
      setFindings(prev => {
        const next = prev.map(f => (f.id === id ? { ...f, projection: undefined } : f));
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const addAction = useCallback(
    (id: string, text: string, assignee?: FindingAssignee, dueDate?: string, ideaId?: string) => {
      const action = createActionItem(text, assignee, dueDate, ideaId);
      setFindings(prev => {
        const next = prev.map(f => {
          if (f.id !== id) return f;
          const updated = { ...f, actions: [...(f.actions ?? []), action] };
          // Auto-transition: first action on 'analyzed' → 'improving'
          if (f.status === 'analyzed' && !f.actions?.length) {
            updated.status = 'improving';
            updated.statusChangedAt = Date.now();
          }
          return updated;
        });
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const updateAction = useCallback(
    (
      id: string,
      actionId: string,
      updates: Partial<Pick<ActionItem, 'text' | 'assignee' | 'dueDate'>>
    ) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === id
            ? {
                ...f,
                actions: f.actions?.map(a => (a.id === actionId ? { ...a, ...updates } : a)),
              }
            : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const completeAction = useCallback(
    (id: string, actionId: string) => {
      setFindings(prev => {
        const next = prev.map(f => {
          if (f.id !== id) return f;
          const updatedActions = f.actions?.map(a =>
            a.id === actionId ? { ...a, completedAt: Date.now() } : a
          );
          return { ...f, actions: updatedActions };
        });
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const deleteAction = useCallback(
    (id: string, actionId: string) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === id ? { ...f, actions: f.actions?.filter(a => a.id !== actionId) } : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const setOutcome = useCallback(
    (id: string, outcome: FindingOutcome) => {
      setFindings(prev => {
        const next = prev.map(f => {
          if (f.id !== id) return f;
          const updated = { ...f, outcome };
          // Auto-transition: outcome set + all actions complete → 'resolved'
          const allDone = updated.actions?.length && updated.actions.every(a => a.completedAt);
          if (allDone && updated.status === 'improving') {
            updated.status = 'resolved';
            updated.statusChangedAt = Date.now();
          }
          return updated;
        });
        onFindingsChange?.(next);
        // Fire onStatusChange if auto-transitioned to resolved
        const updated = next.find(f => f.id === id);
        if (updated && updated.status === 'resolved') {
          onStatusChange?.(updated, 'resolved');
        }
        return next;
      });
    },
    [onFindingsChange, onStatusChange]
  );

  const setBenchmark = useCallback(
    (id: string, stats: BenchmarkStats) => {
      setFindings(prev => {
        const next = prev.map(f => {
          if (f.id === id) {
            return { ...f, role: 'benchmark' as const, benchmarkStats: stats };
          }
          // Clear previous benchmark
          if (f.role === 'benchmark') {
            return { ...f, role: undefined, benchmarkStats: undefined };
          }
          return f;
        });
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const clearBenchmark = useCallback(
    (id: string) => {
      setFindings(prev => {
        const next = prev.map(f => {
          if (f.id !== id) return f;
          return { ...f, role: undefined, benchmarkStats: undefined };
        });
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const toggleScope = useCallback(
    (id: string) => {
      setFindings(prev => {
        const next = prev.map(f => {
          if (f.id !== id) return f;
          // Cycle: undefined → true → false → undefined
          const nextScoped = f.scoped === undefined ? true : f.scoped === true ? false : undefined;
          return { ...f, scoped: nextScoped };
        });
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  return {
    findings,
    addFinding,
    editFinding,
    deleteFinding,
    getFindingContext,
    findDuplicate,
    findDuplicateSource,
    getChartFindings,
    setFindingStatus,
    setFindingTag,
    setFindingAssignee,
    addFindingComment,
    editFindingComment,
    deleteFindingComment,
    addPhotoToComment,
    updatePhotoStatus,
    addAttachmentToComment,
    updateAttachmentStatus,
    linkHypothesis,
    unlinkHypothesis,
    setProjection,
    clearProjection,
    addAction,
    updateAction,
    completeAction,
    deleteAction,
    setOutcome,
    setBenchmark,
    clearBenchmark,
    toggleScope,
  };
}
