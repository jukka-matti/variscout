import { useState, useCallback } from 'react';
import {
  createFinding,
  createFindingComment,
  findDuplicateFinding,
  type Finding,
  type FindingContext,
  type FindingStatus,
} from '@variscout/core';

export interface UseFindingsOptions {
  /** Initial findings (for restoring persisted state) */
  initialFindings?: Finding[];
  /** Callback when findings change (for external persistence) */
  onFindingsChange?: (findings: Finding[]) => void;
}

export interface UseFindingsReturn {
  /** Current findings list */
  findings: Finding[];
  /** Add a new finding with the given note and context */
  addFinding: (text: string, context: FindingContext) => Finding;
  /** Update an existing finding's note text */
  editFinding: (id: string, text: string) => void;
  /** Delete a finding */
  deleteFinding: (id: string) => void;
  /** Get a finding's context (for filter restoration) */
  getFindingContext: (id: string) => FindingContext | undefined;
  /** Find an existing finding with matching filters (for duplicate detection) */
  findDuplicate: (activeFilters: Record<string, (string | number)[]>) => Finding | undefined;
  /** Change a finding's investigation status */
  setFindingStatus: (id: string, status: FindingStatus) => void;
  /** Add a comment to a finding */
  addFindingComment: (id: string, text: string) => void;
  /** Edit an existing comment */
  editFindingComment: (findingId: string, commentId: string, text: string) => void;
  /** Delete a comment */
  deleteFindingComment: (findingId: string, commentId: string) => void;
}

/**
 * Manages a list of analyst findings (bookmarked filter states with notes).
 *
 * Findings are ordered by creation time (newest first).
 * The caller provides context (filters, stats) when adding — this hook
 * doesn't depend on DataContext directly.
 */
export function useFindings(options: UseFindingsOptions = {}): UseFindingsReturn {
  const { initialFindings, onFindingsChange } = options;

  const [findings, setFindings] = useState<Finding[]>(() => initialFindings ?? []);

  const addFinding = useCallback(
    (text: string, context: FindingContext): Finding => {
      const finding = createFinding(
        text,
        context.activeFilters,
        context.cumulativeScope,
        context.stats
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

  const setFindingStatus = useCallback(
    (id: string, status: FindingStatus) => {
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === id ? { ...f, status, statusChangedAt: Date.now() } : f
        );
        onFindingsChange?.(next);
        return next;
      });
    },
    [onFindingsChange]
  );

  const addFindingComment = useCallback(
    (id: string, text: string) => {
      const comment = createFindingComment(text);
      setFindings(prev => {
        const next = prev.map(f =>
          f.id === id ? { ...f, comments: [...f.comments, comment] } : f
        );
        onFindingsChange?.(next);
        return next;
      });
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

  return {
    findings,
    addFinding,
    editFinding,
    deleteFinding,
    getFindingContext,
    findDuplicate,
    setFindingStatus,
    addFindingComment,
    editFindingComment,
    deleteFindingComment,
  };
}
