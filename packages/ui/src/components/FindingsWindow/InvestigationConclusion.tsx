import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, ClipboardCheck, Sparkles, Check, X, Plus } from 'lucide-react';
import type { Question, Finding, SuspectedCause, SuspectedCauseEvidence } from '@variscout/core';
import type { HubProjection, EvidenceCluster } from '@variscout/core/findings';
import { HubComposer, type HubComposerBranchFields } from '../InvestigationConclusion/HubComposer';
import { HubCard } from '../InvestigationConclusion/HubCard';
import { SynthesisPrompt } from '../InvestigationConclusion/SynthesisPrompt';

/** Local state for the hub composer inline form */
interface ComposerState {
  mode: 'closed' | 'creating' | 'editing';
  editingHubId?: string;
  prefilledQuestionIds?: string[];
  prefilledFindingIds?: string[];
}

export interface InvestigationConclusionProps {
  /** Questions marked as suspected causes */
  suspectedCauses: Question[];
  /** Questions marked as ruled out (negative learnings) */
  ruledOut: Question[];
  /** Questions marked as contributing */
  contributing: Question[];
  /** Approved problem statement */
  problemStatement?: string;
  /** Whether the investigation has enough evidence for conclusions */
  hasConclusions: boolean;
  /** Auto-generated problem statement draft (editable before accepting) */
  problemStatementDraft?: string | null;
  /** Whether there are enough suspected causes to generate a statement */
  isProblemStatementReady?: boolean;
  /** Trigger draft generation */
  onGenerateProblemStatement?: () => void;
  /** Accept the edited draft */
  onAcceptProblemStatement?: (text: string) => void;
  /** Dismiss the draft */
  onDismissProblemStatement?: () => void;
  /** SuspectedCause hub management */
  hubs?: SuspectedCause[];
  hubEvidences?: Map<string, SuspectedCauseEvidence>;
  hubProjections?: Map<string, HubProjection>;
  onCreateHub?: (
    name: string,
    synthesis: string,
    questionIds: string[],
    findingIds: string[],
    branchFields: HubComposerBranchFields
  ) => void;
  onUpdateHub?: (
    hubId: string,
    name: string,
    synthesis: string,
    questionIds: string[],
    findingIds: string[],
    branchFields: HubComposerBranchFields
  ) => void;
  onDeleteHub?: (hubId: string) => void;
  onToggleHubSelect?: (hubId: string) => void;
  onBrainstormHub?: (hubId: string) => void;
  evidenceClusters?: EvidenceCluster[];
  questions?: Question[];
  findings?: Finding[];
}

/** Format evidence percentage from a question */
function evidencePercent(h: Question): string | null {
  const r2 = h.evidence?.rSquaredAdj;
  const eta = h.evidence?.etaSquared;
  const value = r2 ?? eta;
  if (value == null) return null;
  const label = r2 != null ? 'R²adj' : 'η²';
  return `${label} ${Math.round(value * 100)}%`;
}

/** Sort questions by evidence strength (highest first) */
function sortByEvidenceDesc(a: Question, b: Question): number {
  const aVal = a.evidence?.rSquaredAdj ?? a.evidence?.etaSquared ?? -1;
  const bVal = b.evidence?.rSquaredAdj ?? b.evidence?.etaSquared ?? -1;
  return bVal - aVal;
}

const InvestigationConclusion: React.FC<InvestigationConclusionProps> = ({
  suspectedCauses,
  ruledOut,
  contributing,
  problemStatement,
  hasConclusions,
  problemStatementDraft,
  isProblemStatementReady,
  onGenerateProblemStatement,
  onAcceptProblemStatement,
  onDismissProblemStatement,
  hubs,
  hubEvidences,
  hubProjections,
  onCreateHub,
  onUpdateHub,
  onDeleteHub: _onDeleteHub,
  onToggleHubSelect,
  onBrainstormHub,
  evidenceClusters,
  questions,
  findings,
}) => {
  const [ruledOutExpanded, setRuledOutExpanded] = useState(false);
  const [editedDraft, setEditedDraft] = useState('');
  const [composerState, setComposerState] = useState<ComposerState>({ mode: 'closed' });
  const [dismissedClusterIds, setDismissedClusterIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edited draft when a new generated draft arrives
  useEffect(() => {
    if (problemStatementDraft) {
      setEditedDraft(problemStatementDraft);
      // Focus textarea on next tick
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [problemStatementDraft]);

  if (!hasConclusions) return null;

  const sortedCauses = [...suspectedCauses].sort(sortByEvidenceDesc);
  const sortedContributing = [...contributing].sort(sortByEvidenceDesc);
  const sortedRuledOut = [...ruledOut].sort(sortByEvidenceDesc);

  const useHubModel = hubs !== undefined && onCreateHub !== undefined;
  const editingHub =
    composerState.mode === 'editing' && composerState.editingHubId
      ? hubs?.find(h => h.id === composerState.editingHubId)
      : undefined;

  const visibleClusters = (evidenceClusters ?? []).filter(
    c => !dismissedClusterIds.has(c.factors.join(','))
  );

  const handleComposerSave = (
    name: string,
    synthesis: string,
    questionIds: string[],
    findingIds: string[],
    branchFields: HubComposerBranchFields
  ) => {
    if (composerState.mode === 'editing' && composerState.editingHubId) {
      onUpdateHub?.(
        composerState.editingHubId,
        name,
        synthesis,
        questionIds,
        findingIds,
        branchFields
      );
    } else {
      onCreateHub?.(name, synthesis, questionIds, findingIds, branchFields);
    }
    setComposerState({ mode: 'closed' });
  };

  return (
    <div className="space-y-3" data-testid="investigation-conclusion">
      {/* Section header */}
      <div className="flex items-center gap-1.5">
        <ClipboardCheck size={12} className="text-content-muted" />
        <span className="text-[0.625rem] uppercase tracking-wider text-content-muted font-medium">
          Investigation Conclusions
        </span>
      </div>

      {/* Synthesis prompts from detected clusters */}
      {useHubModel &&
        visibleClusters.map(cluster => (
          <SynthesisPrompt
            key={cluster.factors.join(',')}
            cluster={cluster}
            onNameCause={() => {
              setComposerState({
                mode: 'creating',
                prefilledQuestionIds: cluster.questionIds,
                prefilledFindingIds: cluster.findingIds,
              });
            }}
            onDismiss={() => {
              setDismissedClusterIds(prev => new Set([...prev, cluster.factors.join(',')]));
            }}
          />
        ))}

      {/* Suspected Causes — hub model or legacy chip model */}
      {useHubModel ? (
        <div data-testid="suspected-causes">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[0.625rem] font-medium text-content-secondary">
              Suspected Causes
            </span>
            {hubs!.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[0.5625rem] font-medium">
                {hubs!.length}
              </span>
            )}
            {composerState.mode === 'closed' && (
              <button
                onClick={() => setComposerState({ mode: 'creating' })}
                className="ml-auto flex items-center gap-0.5 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                data-testid="add-hub-button"
              >
                <Plus size={10} />
                Name a suspected cause
              </button>
            )}
          </div>

          {/* Hub cards */}
          <div className="space-y-1.5">
            {hubs!.map(hub => (
              <HubCard
                key={hub.id}
                hub={hub}
                evidence={hubEvidences?.get(hub.id)}
                projection={hubProjections?.get(hub.id)}
                questionsCount={hub.questionIds.length}
                findingsCount={hub.findingIds.length}
                onEdit={() => setComposerState({ mode: 'editing', editingHubId: hub.id })}
                onToggleSelect={() => onToggleHubSelect?.(hub.id)}
                onBrainstorm={() => onBrainstormHub?.(hub.id)}
              />
            ))}
          </div>

          {/* Inline composer */}
          {composerState.mode !== 'closed' && (
            <div className="mt-1.5">
              <HubComposer
                prefilledQuestionIds={composerState.prefilledQuestionIds}
                prefilledFindingIds={composerState.prefilledFindingIds}
                questions={questions ?? []}
                findings={findings ?? []}
                editingHub={editingHub}
                evidence={editingHub ? hubEvidences?.get(editingHub.id) : undefined}
                projection={editingHub ? hubProjections?.get(editingHub.id) : undefined}
                onSave={handleComposerSave}
                onCancel={() => setComposerState({ mode: 'closed' })}
              />
            </div>
          )}
        </div>
      ) : sortedCauses.length > 0 ? (
        <div data-testid="suspected-causes">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[0.625rem] font-medium text-content-secondary">
              Suspected Causes
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[0.5625rem] font-medium">
              {sortedCauses.length}
            </span>
          </div>
          <div className="space-y-0.5">
            {sortedCauses.map(h => (
              <CauseRow key={h.id} question={h} dotClass="bg-amber-500" />
            ))}
          </div>
        </div>
      ) : null}

      {/* Contributing Factors */}
      {sortedContributing.length > 0 && (
        <div data-testid="contributing-factors">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[0.625rem] font-medium text-content-secondary">Contributing</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[0.5625rem] font-medium">
              {sortedContributing.length}
            </span>
          </div>
          <div className="space-y-0.5">
            {sortedContributing.map(h => (
              <CauseRow key={h.id} question={h} dotClass="bg-blue-500" compact />
            ))}
          </div>
        </div>
      )}

      {/* Ruled Out (collapsed by default) */}
      {sortedRuledOut.length > 0 && (
        <div data-testid="ruled-out">
          <button
            onClick={() => setRuledOutExpanded(!ruledOutExpanded)}
            className="flex items-center gap-1 text-[0.625rem] font-medium text-content-secondary hover:text-content transition-colors mb-1.5"
            data-testid="ruled-out-toggle"
          >
            {ruledOutExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <span>Ruled Out (negative learnings)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-secondary text-content-muted text-[0.5625rem] font-medium">
              {sortedRuledOut.length}
            </span>
          </button>
          {ruledOutExpanded && (
            <div className="space-y-0.5">
              {sortedRuledOut.map(h => (
                <div
                  key={h.id}
                  className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface opacity-50"
                  data-testid={`ruled-out-${h.id}`}
                >
                  {/* Gray dot */}
                  <span className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-content-muted/40" />
                  {/* Strikethrough text */}
                  <span className="flex-1 text-[0.6875rem] leading-relaxed text-content-secondary line-through">
                    {h.text}
                  </span>
                  {/* Evidence badge */}
                  {evidencePercent(h) && (
                    <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full bg-surface-secondary text-[0.5625rem] text-content-muted font-medium">
                      {evidencePercent(h)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Problem Statement — three states: approved, draft editing, or generate button */}
      {problemStatement && !problemStatementDraft && (
        <div className="border-l-2 border-green-500 pl-2.5 py-1.5" data-testid="problem-statement">
          <div className="text-[0.5625rem] uppercase tracking-wider text-content-muted font-medium mb-0.5">
            Approved Problem Statement
          </div>
          <p className="text-[0.6875rem] leading-relaxed text-content-secondary">
            {problemStatement}
          </p>
        </div>
      )}

      {/* Draft editing mode */}
      {problemStatementDraft && (
        <div
          className="border-l-2 border-blue-500 pl-2.5 py-1.5 space-y-1.5"
          data-testid="problem-statement-draft"
        >
          <div className="text-[0.5625rem] uppercase tracking-wider text-content-muted font-medium">
            Problem Statement Draft
          </div>
          <textarea
            ref={textareaRef}
            className="w-full text-[0.6875rem] leading-relaxed text-content-secondary bg-surface-secondary border border-edge rounded px-2 py-1.5 resize-y min-h-[3rem]"
            value={editedDraft}
            onChange={e => setEditedDraft(e.target.value)}
            rows={3}
            data-testid="problem-statement-textarea"
          />
          <div className="flex items-center gap-1.5">
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
              onClick={() => onAcceptProblemStatement?.(editedDraft)}
              data-testid="problem-statement-accept"
            >
              <Check size={10} />
              Accept
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] font-medium bg-surface-secondary text-content-muted hover:text-content transition-colors"
              onClick={onDismissProblemStatement}
              data-testid="problem-statement-dismiss"
            >
              <X size={10} />
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Generate button — shown when ready, no existing statement, and no draft */}
      {isProblemStatementReady &&
        !problemStatement &&
        !problemStatementDraft &&
        onGenerateProblemStatement && (
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.625rem] font-medium bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors w-full"
            onClick={onGenerateProblemStatement}
            data-testid="generate-problem-statement"
          >
            <Sparkles size={10} />
            Generate Problem Statement
          </button>
        )}
    </div>
  );
};

/** Single cause/contributing row */
const CauseRow: React.FC<{
  question: Question;
  dotClass: string;
  compact?: boolean;
}> = ({ question, dotClass, compact }) => {
  const badge = evidencePercent(question);

  return (
    <div
      className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface ${compact ? 'py-1' : ''}`}
      data-testid={`cause-${question.id}`}
    >
      {/* Status dot */}
      <span className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${dotClass}`} />
      {/* Text */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-content-secondary leading-relaxed ${compact ? 'text-[0.625rem]' : 'text-[0.6875rem]'}`}
        >
          {question.text}
        </span>
        {/* Factor + level */}
        {question.factor && (
          <span className="ml-1 text-[0.5625rem] text-content-muted">
            {question.factor}
            {question.level ? ` = ${question.level}` : ''}
          </span>
        )}
      </div>
      {/* Evidence badge */}
      {badge && (
        <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full bg-surface-secondary text-[0.5625rem] text-content-muted font-medium whitespace-nowrap">
          {badge}
        </span>
      )}
    </div>
  );
};

export { InvestigationConclusion };
