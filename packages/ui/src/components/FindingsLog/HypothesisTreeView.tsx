import React, { useState, useMemo, useCallback } from 'react';
import type { Hypothesis, Finding } from '@variscout/core';
import HypothesisNode from './HypothesisNode';

export interface HypothesisTreeViewProps {
  /** All hypotheses (flat list with parentId tree structure) */
  hypotheses: Hypothesis[];
  /** All findings (for linking display) */
  findings: Finding[];
  /** Click a hypothesis node to filter the dashboard */
  onSelectHypothesis?: (hypothesis: Hypothesis) => void;
  /** Add a sub-hypothesis under a parent */
  onAddSubHypothesis?: (parentId: string) => void;
  /** Whether to show contradicted hypotheses (default: false) */
  showContradicted?: boolean;
  /** Max depth allowed for new children */
  maxDepth?: number;
  /** Max children per parent */
  maxChildrenPerParent?: number;
  /** Get children summary for a parent */
  getChildrenSummary?: (parentId: string) => {
    supported: number;
    contradicted: number;
    untested: number;
    partial: number;
    total: number;
  };
  /** Search filter text */
  searchFilter?: string;
}

/**
 * Tree view for hypothesis investigation.
 * Shows hypotheses as an indented tree with collapsible nodes.
 * Contradicted nodes are dimmed by default; toggle to show.
 */
const HypothesisTreeView: React.FC<HypothesisTreeViewProps> = ({
  hypotheses,
  findings,
  onSelectHypothesis,
  onAddSubHypothesis,
  showContradicted = false,
  maxDepth = 3,
  maxChildrenPerParent = 8,
  getChildrenSummary,
  searchFilter,
}) => {
  // Track which nodes are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleNode = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Build lookup maps
  const findingsById = useMemo(() => {
    const map = new Map<string, Finding>();
    for (const f of findings) map.set(f.id, f);
    return map;
  }, [findings]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Hypothesis[]>();
    for (const h of hypotheses) {
      if (h.parentId) {
        const siblings = map.get(h.parentId) || [];
        siblings.push(h);
        map.set(h.parentId, siblings);
      }
    }
    return map;
  }, [hypotheses]);

  // Filter hypotheses
  const filteredHypotheses = useMemo(() => {
    if (!searchFilter) return hypotheses;
    const lower = searchFilter.toLowerCase();
    return hypotheses.filter(h => h.text.toLowerCase().includes(lower));
  }, [hypotheses, searchFilter]);

  // Get root hypotheses
  const roots = useMemo(() => {
    return filteredHypotheses.filter(h => !h.parentId);
  }, [filteredHypotheses]);

  // Compute depth for a hypothesis
  const getDepth = useCallback(
    (id: string): number => {
      let depth = 0;
      let current = hypotheses.find(h => h.id === id);
      while (current?.parentId) {
        depth++;
        current = hypotheses.find(h => h.id === current!.parentId);
        if (depth > maxDepth + 1) break;
      }
      return depth;
    },
    [hypotheses, maxDepth]
  );

  // Render a hypothesis and its children recursively
  const renderNode = useCallback(
    (hypothesis: Hypothesis): React.ReactNode => {
      const depth = getDepth(hypothesis.id);
      const children = childrenByParent.get(hypothesis.id) || [];
      const visibleChildren = showContradicted
        ? children
        : children.filter(c => c.status !== 'contradicted');
      const linkedFindings = hypothesis.linkedFindingIds
        .map(fid => findingsById.get(fid))
        .filter(Boolean) as Finding[];
      const childCount = childrenByParent.get(hypothesis.id)?.length ?? 0;
      const canAddChild = depth < maxDepth - 1 && childCount < maxChildrenPerParent;
      const isExpanded = expandedIds.has(hypothesis.id);

      return (
        <React.Fragment key={hypothesis.id}>
          <HypothesisNode
            hypothesis={hypothesis}
            depth={depth}
            children={visibleChildren}
            linkedFindings={linkedFindings}
            isExpanded={isExpanded}
            onToggle={toggleNode}
            onSelect={onSelectHypothesis}
            onAddChild={onAddSubHypothesis}
            childrenSummary={getChildrenSummary?.(hypothesis.id)}
            canAddChild={canAddChild}
            showContradicted={showContradicted}
          />
          {isExpanded && visibleChildren.map(child => renderNode(child))}
        </React.Fragment>
      );
    },
    [
      getDepth,
      childrenByParent,
      findingsById,
      expandedIds,
      toggleNode,
      onSelectHypothesis,
      onAddSubHypothesis,
      getChildrenSummary,
      showContradicted,
      maxDepth,
      maxChildrenPerParent,
    ]
  );

  if (hypotheses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <p className="text-sm text-content-secondary mb-1">No hypotheses yet</p>
        <p className="text-xs text-content-muted leading-relaxed max-w-[240px]">
          Create hypotheses from finding cards to build a causal investigation tree.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2" role="tree" data-testid="hypothesis-tree">
      {roots.map(root => renderNode(root))}
    </div>
  );
};

export default HypothesisTreeView;
