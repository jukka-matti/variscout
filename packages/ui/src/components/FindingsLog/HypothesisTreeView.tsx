import React, { useState, useMemo, useCallback } from 'react';
import type {
  Hypothesis,
  HypothesisStatus,
  Finding,
  InvestigationCategory,
  ImprovementIdea,
  IdeaImpact,
} from '@variscout/core';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import HypothesisNode from './HypothesisNode';
import { HelpTooltip } from '../HelpTooltip';
import { useGlossary } from '../../hooks';

export interface HypothesisTreeViewProps {
  /** All hypotheses (flat list with parentId tree structure) */
  hypotheses: Hypothesis[];
  /** All findings (for linking display) */
  findings: Finding[];
  /** Click a hypothesis node to filter the dashboard */
  onSelectHypothesis?: (hypothesis: Hypothesis) => void;
  /** Add a sub-hypothesis under a parent */
  onAddSubHypothesis?: (
    parentId: string,
    text: string,
    factor?: string,
    validationType?: 'data' | 'gemba' | 'expert'
  ) => void;
  /** Available factor columns for sub-hypothesis factor picker */
  factors?: string[];
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
  /** Investigation categories for three-level grouping (Category → Factor → Hypothesis) */
  categories?: InvestigationCategory[];
  /** Factor name → η² percentage (for variation display on factor/category headers) */
  factorVariations?: Record<string, number>;
  // --- Validation Task (passed through to HypothesisNode) ---
  /** Set a validation task description */
  onSetValidationTask?: (id: string, task: string) => void;
  /** Mark a validation task as complete */
  onCompleteTask?: (id: string) => void;
  /** Manually set hypothesis status with optional note */
  onSetManualStatus?: (id: string, status: HypothesisStatus, note?: string) => void;
  // --- Improvement Ideas (passed through to HypothesisNode) ---
  /** Computed impact for each idea (keyed by idea.id) */
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  /** Add an improvement idea */
  onAddIdea?: (hypothesisId: string, text: string) => void;
  /** Update an improvement idea */
  onUpdateIdea?: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
  ) => void;
  /** Remove an improvement idea */
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  /** Toggle idea selected state */
  onSelectIdea?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  /** Open What-If simulator pre-loaded for this idea */
  onProjectIdea?: (hypothesisId: string, ideaId: string) => void;
  /** Ask CoScout about improvement options */
  onAskCoScout?: (question: string) => void;
  /** Set cause role on a hypothesis */
  onSetCauseRole?: (hypothesisId: string, role: 'primary' | 'contributing' | undefined) => void;
}

/** Category group for tree rendering */
interface CategoryGroup {
  category: InvestigationCategory;
  factorGroups: Map<string, Hypothesis[]>;
}

/**
 * Tree view for hypothesis investigation.
 * When `categories` are provided, renders a three-level tree:
 *   Category (structural header) → Factor (sub-header) → Hypothesis nodes
 * Without categories, renders a flat hypothesis tree (PWA compatibility).
 */
const HypothesisTreeView: React.FC<HypothesisTreeViewProps> = ({
  hypotheses,
  findings,
  onSelectHypothesis,
  onAddSubHypothesis,
  factors,
  showContradicted = false,
  maxDepth = 3,
  maxChildrenPerParent = 8,
  getChildrenSummary,
  searchFilter,
  categories,
  factorVariations,
  onSetValidationTask,
  onCompleteTask,
  onSetManualStatus,
  ideaImpacts,
  onAddIdea,
  onUpdateIdea,
  onRemoveIdea,
  onSelectIdea,
  onProjectIdea,
  onAskCoScout,
  onSetCauseRole,
}) => {
  const { getTerm } = useGlossary();
  const { formatStat } = useTranslation();

  // Track which nodes are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Track expanded categories and factors
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(categories?.map(c => c.id) ?? [])
  );
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());

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

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleFactor = useCallback((factor: string) => {
    setExpandedFactors(prev => {
      const next = new Set(prev);
      if (next.has(factor)) next.delete(factor);
      else next.add(factor);
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
    (hypothesis: Hypothesis, extraDepth: number = 0): React.ReactNode => {
      const depth = getDepth(hypothesis.id) + extraDepth;
      const children = childrenByParent.get(hypothesis.id) || [];
      const visibleChildren = showContradicted
        ? children
        : children.filter(c => c.status !== 'contradicted');
      // eslint-disable-next-line react-hooks/immutability -- read-only filter, no mutation
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
            factors={factors}
            childrenSummary={getChildrenSummary?.(hypothesis.id)}
            canAddChild={canAddChild}
            showContradicted={showContradicted}
            onSetValidationTask={onSetValidationTask}
            onCompleteTask={onCompleteTask}
            onSetManualStatus={onSetManualStatus}
            ideaImpacts={ideaImpacts}
            onAddIdea={onAddIdea}
            onUpdateIdea={onUpdateIdea}
            onRemoveIdea={onRemoveIdea}
            onSelectIdea={onSelectIdea}
            onProjectIdea={onProjectIdea}
            onAskCoScout={onAskCoScout}
            onSetCauseRole={onSetCauseRole}
          />
          {/* eslint-disable-next-line react-hooks/immutability -- recursive useCallback: renderNode must reference itself */}
          {isExpanded && visibleChildren.map(child => renderNode(child, extraDepth))}
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
      factors,
      getChildrenSummary,
      showContradicted,
      maxDepth,
      maxChildrenPerParent,
      onSetValidationTask,
      onCompleteTask,
      onSetManualStatus,
      ideaImpacts,
      onAddIdea,
      onUpdateIdea,
      onRemoveIdea,
      onSelectIdea,
      onProjectIdea,
      onAskCoScout,
      onSetCauseRole,
    ]
  );

  // Build category groups when categories are provided
  const categoryGroups = useMemo((): CategoryGroup[] | null => {
    if (!categories || categories.length === 0) return null;

    return categories.map(cat => {
      const factorGroups = new Map<string, Hypothesis[]>();
      for (const factorName of cat.factorNames) {
        const matching = roots.filter(h => h.factor === factorName);
        if (matching.length > 0) {
          factorGroups.set(factorName, matching);
        }
      }
      return { category: cat, factorGroups };
    });
  }, [categories, roots]);

  // Uncategorized roots (factor doesn't match any category)
  const uncategorizedRoots = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    const allCategorizedFactors = new Set(categories.flatMap(c => c.factorNames));
    return roots.filter(h => !h.factor || !allCategorizedFactors.has(h.factor));
  }, [categories, roots]);

  if (hypotheses.length === 0 && (!categories || categories.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <p className="text-sm text-content-secondary mb-1 flex items-center gap-1">
          No hypotheses yet
          <HelpTooltip term={getTerm('hypothesis')} iconSize={12} />
        </p>
        <p className="text-xs text-content-muted leading-relaxed max-w-[240px]">
          Create hypotheses from finding cards to build a causal investigation tree.
        </p>
      </div>
    );
  }

  // Three-level rendering when categories are provided
  if (categoryGroups) {
    return (
      <div className="flex-1 overflow-y-auto px-2 py-2" role="tree" data-testid="hypothesis-tree">
        <div className="flex items-center gap-1 px-1 pb-1 mb-1 border-b border-edge/30">
          <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
            Hypotheses
          </span>
          <HelpTooltip term={getTerm('hypothesis')} iconSize={12} />
        </div>
        {categoryGroups.map(({ category, factorGroups }) => {
          const isCatExpanded = expandedCategories.has(category.id);
          const hasContent = factorGroups.size > 0;

          return (
            <div key={category.id} data-testid={`category-group-${category.id}`}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center gap-2 py-2 px-1 text-left rounded-md transition-colors ${
                  hasContent
                    ? 'hover:bg-surface-secondary cursor-pointer'
                    : 'opacity-50 cursor-default'
                }`}
                data-testid={`category-header-${category.id}`}
              >
                {hasContent ? (
                  isCatExpanded ? (
                    <ChevronDown size={14} className="text-content-secondary shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-content-secondary shrink-0" />
                  )
                ) : (
                  <span className="w-3.5" />
                )}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: category.color || '#64748b' }}
                />
                <span className="text-sm font-semibold text-content truncate">{category.name}</span>
                {!hasContent && (
                  <span className="text-[10px] text-content-muted italic ml-auto shrink-0">
                    no factors assigned
                  </span>
                )}
              </button>

              {/* Factor sub-headers and hypotheses */}
              {isCatExpanded &&
                hasContent &&
                [...factorGroups.entries()].map(([factorName, factorHypotheses]) => {
                  const isFactorExpanded = expandedFactors.has(factorName);
                  const factorEta = factorVariations?.[factorName];

                  return (
                    <div
                      key={factorName}
                      className="ml-3 sm:ml-4"
                      data-testid={`factor-group-${factorName}`}
                    >
                      {/* Factor sub-header */}
                      <button
                        onClick={() => toggleFactor(factorName)}
                        className="w-full flex items-center gap-2 py-1.5 px-1 text-left rounded-md hover:bg-surface-secondary transition-colors"
                        data-testid={`factor-header-${factorName}`}
                      >
                        {isFactorExpanded ? (
                          <ChevronDown size={12} className="text-content-muted shrink-0" />
                        ) : (
                          <ChevronRight size={12} className="text-content-muted shrink-0" />
                        )}
                        <span className="text-xs font-medium text-content-secondary truncate">
                          {factorName}
                        </span>
                        {factorEta !== undefined && (
                          <span className="text-[10px] text-content-muted ml-auto shrink-0">
                            {formatStat(factorEta, 1)}%
                          </span>
                        )}
                        <span className="text-[10px] text-content-muted shrink-0">
                          ({factorHypotheses.length})
                        </span>
                      </button>

                      {/* Hypothesis nodes under this factor */}
                      {isFactorExpanded && (
                        <div className="ml-3 sm:ml-4">
                          {factorHypotheses.map(h => renderNode(h, 2))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}

        {/* Uncategorized hypotheses under "Other" group */}
        {uncategorizedRoots.length > 0 && (
          <div data-testid="category-group-other">
            <div className="flex items-center gap-2 py-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-500" />
              <span className="text-sm font-semibold text-content-secondary">Other</span>
            </div>
            <div className="ml-3 sm:ml-4">{uncategorizedRoots.map(h => renderNode(h, 1))}</div>
          </div>
        )}
      </div>
    );
  }

  // Flat rendering (no categories — PWA compatibility)
  return (
    <div className="flex-1 overflow-y-auto px-2 py-2" role="tree" data-testid="hypothesis-tree">
      <div className="flex items-center gap-1 px-1 pb-1 mb-1 border-b border-edge/30">
        <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Hypotheses
        </span>
        <HelpTooltip term={getTerm('hypothesis')} iconSize={12} />
      </div>
      {roots.map(root => renderNode(root))}
    </div>
  );
};

export default HypothesisTreeView;
