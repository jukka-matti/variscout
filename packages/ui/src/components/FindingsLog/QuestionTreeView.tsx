import React, { useState, useMemo, useCallback } from 'react';
import type {
  Question,
  QuestionStatus,
  Finding,
  InvestigationCategory,
  ImprovementIdea,
  IdeaImpact,
} from '@variscout/core';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import QuestionNode from './QuestionNode';
import { HelpTooltip } from '../HelpTooltip';
import { useGlossary } from '../../hooks';

export interface QuestionTreeViewProps {
  /** All questions (flat list with parentId tree structure) */
  questions: Question[];
  /** All findings (for linking display) */
  findings: Finding[];
  /** Click a question node to filter the dashboard */
  onSelectQuestion?: (question: Question) => void;
  /** Add a sub-question under a parent */
  onAddSubQuestion?: (
    parentId: string,
    text: string,
    factor?: string,
    validationType?: 'data' | 'gemba' | 'expert'
  ) => void;
  /** Available factor columns for sub-question factor picker */
  factors?: string[];
  /** Whether to show ruled-out questions (default: false) */
  showContradicted?: boolean;
  /** Max depth allowed for new children */
  maxDepth?: number;
  /** Max children per parent */
  maxChildrenPerParent?: number;
  /** Get children summary for a parent */
  getChildrenSummary?: (parentId: string) => {
    answered: number;
    'ruled-out': number;
    open: number;
    investigating: number;
    total: number;
  };
  /** Search filter text */
  searchFilter?: string;
  /** Investigation categories for three-level grouping (Category -> Factor -> Question) */
  categories?: InvestigationCategory[];
  /** Factor name -> eta-squared percentage (for variation display on factor/category headers) */
  factorVariations?: Record<string, number>;
  // --- Validation Task (passed through to QuestionNode) ---
  /** Set a validation task description */
  onSetValidationTask?: (id: string, task: string) => void;
  /** Mark a validation task as complete */
  onCompleteTask?: (id: string) => void;
  /** Manually set question status with optional note */
  onSetManualStatus?: (id: string, status: QuestionStatus, note?: string) => void;
  // --- Improvement Ideas (passed through to QuestionNode) ---
  /** Computed impact for each idea (keyed by idea.id) */
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  /** Add an improvement idea */
  onAddIdea?: (questionId: string, text: string) => void;
  /** Update an improvement idea */
  onUpdateIdea?: (
    questionId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
  ) => void;
  /** Remove an improvement idea */
  onRemoveIdea?: (questionId: string, ideaId: string) => void;
  /** Toggle idea selected state */
  onSelectIdea?: (questionId: string, ideaId: string, selected: boolean) => void;
  /** Open What-If simulator pre-loaded for this idea */
  onProjectIdea?: (questionId: string, ideaId: string) => void;
  /** Ask CoScout about improvement options */
  onAskCoScout?: (question: string) => void;
  /** Set cause role on a question */
  onSetCauseRole?: (
    questionId: string,
    role: 'suspected-cause' | 'contributing' | 'ruled-out' | undefined
  ) => void;
}

/** Category group for tree rendering */
interface CategoryGroup {
  category: InvestigationCategory;
  factorGroups: Map<string, Question[]>;
}

/**
 * Tree view for question-driven investigation.
 * When `categories` are provided, renders a three-level tree:
 *   Category (structural header) -> Factor (sub-header) -> Question nodes
 * Without categories, renders a flat question tree (PWA compatibility).
 */
const QuestionTreeView: React.FC<QuestionTreeViewProps> = ({
  questions,
  findings,
  onSelectQuestion,
  onAddSubQuestion,
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
    const map = new Map<string, Question[]>();
    for (const h of questions) {
      if (h.parentId) {
        const siblings = map.get(h.parentId) || [];
        siblings.push(h);
        map.set(h.parentId, siblings);
      }
    }
    return map;
  }, [questions]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    if (!searchFilter) return questions;
    const lower = searchFilter.toLowerCase();
    return questions.filter(h => h.text.toLowerCase().includes(lower));
  }, [questions, searchFilter]);

  // Get root questions
  const roots = useMemo(() => {
    return filteredQuestions.filter(h => !h.parentId);
  }, [filteredQuestions]);

  // Compute depth for a question
  const getDepth = useCallback(
    (id: string): number => {
      let depth = 0;
      let current = questions.find(h => h.id === id);
      while (current?.parentId) {
        depth++;
        current = questions.find(h => h.id === current!.parentId);
        if (depth > maxDepth + 1) break;
      }
      return depth;
    },
    [questions, maxDepth]
  );

  // Render a question and its children recursively
  const renderNode = useCallback(
    (question: Question, extraDepth: number = 0): React.ReactNode => {
      const depth = getDepth(question.id) + extraDepth;
      const children = childrenByParent.get(question.id) || [];
      const visibleChildren = showContradicted
        ? children
        : children.filter(c => c.status !== 'ruled-out');

      const linkedFindings = question.linkedFindingIds
        .map(fid => findingsById.get(fid))
        .filter(Boolean) as Finding[];
      const childCount = childrenByParent.get(question.id)?.length ?? 0;
      const canAddChild = depth < maxDepth - 1 && childCount < maxChildrenPerParent;
      const isExpanded = expandedIds.has(question.id);

      return (
        <React.Fragment key={question.id}>
          <QuestionNode
            question={question}
            depth={depth}
            children={visibleChildren}
            linkedFindings={linkedFindings}
            isExpanded={isExpanded}
            onToggle={toggleNode}
            onSelect={onSelectQuestion}
            onAddChild={onAddSubQuestion}
            factors={factors}
            childrenSummary={getChildrenSummary?.(question.id)}
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
      onSelectQuestion,
      onAddSubQuestion,
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
      const factorGroups = new Map<string, Question[]>();
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

  if (questions.length === 0 && (!categories || categories.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <span className="block text-sm text-content-secondary mb-1 flex items-center gap-1">
          No questions yet
          <HelpTooltip term={getTerm('question')} iconSize={12} />
        </span>
        <span className="block text-xs text-content-muted leading-relaxed max-w-[240px]">
          Create questions from finding cards to build a causal investigation tree.
        </span>
      </div>
    );
  }

  // Three-level rendering when categories are provided
  if (categoryGroups) {
    return (
      <div className="flex-1 overflow-y-auto px-2 py-2" role="tree" data-testid="question-tree">
        <div className="flex items-center gap-1 px-1 pb-1 mb-1 border-b border-edge/30">
          <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
            Questions
          </span>
          <HelpTooltip term={getTerm('question')} iconSize={12} />
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
                  <span className="text-[0.625rem] text-content-muted italic ml-auto shrink-0">
                    no factors assigned
                  </span>
                )}
              </button>

              {/* Factor sub-headers and questions */}
              {isCatExpanded &&
                hasContent &&
                [...factorGroups.entries()].map(([factorName, factorQuestions]) => {
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
                          <span className="text-[0.625rem] text-content-muted ml-auto shrink-0">
                            {formatStat(factorEta, 1)}%
                          </span>
                        )}
                        <span className="text-[0.625rem] text-content-muted shrink-0">
                          ({factorQuestions.length})
                        </span>
                      </button>

                      {/* Question nodes under this factor */}
                      {isFactorExpanded && (
                        <div className="ml-3 sm:ml-4">
                          {factorQuestions.map(h => renderNode(h, 2))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}

        {/* Uncategorized questions under "Other" group */}
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
    <div className="flex-1 overflow-y-auto px-2 py-2" role="tree" data-testid="question-tree">
      <div className="flex items-center gap-1 px-1 pb-1 mb-1 border-b border-edge/30">
        <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Questions
        </span>
        <HelpTooltip term={getTerm('question')} iconSize={12} />
      </div>
      {roots.map(root => renderNode(root))}
    </div>
  );
};

export default QuestionTreeView;
