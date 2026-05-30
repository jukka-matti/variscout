import React, { useState, useRef, useEffect } from 'react';
import { ClipboardCheck, Sparkles, Check, X, Plus } from 'lucide-react';
import type { Finding, Hypothesis, HypothesisEvidence } from '@variscout/core';
import type { HubProjection, EvidenceCluster } from '@variscout/core/findings';
import { HubComposer, type HubComposerBranchFields } from '../AnalyzeConclusion/HubComposer';
import { HubCard } from '../AnalyzeConclusion/HubCard';
import { SynthesisPrompt } from '../AnalyzeConclusion/SynthesisPrompt';

/** Local state for the hub composer inline form */
interface ComposerState {
  mode: 'closed' | 'creating' | 'editing';
  editingHubId?: string;
  prefilledFindingIds?: string[];
}

export interface AnalyzeConclusionProps {
  /** Approved problem statement */
  problemStatement?: string;
  /** Whether the investigation has enough evidence for conclusions */
  hasConclusions: boolean;
  /** Auto-generated problem statement draft (editable before accepting) */
  problemStatementDraft?: string | null;
  /** Whether there are enough hypotheses to generate a statement */
  isProblemStatementReady?: boolean;
  /** Trigger draft generation */
  onGenerateProblemStatement?: () => void;
  /** Accept the edited draft */
  onAcceptProblemStatement?: (text: string) => void;
  /** Dismiss the draft */
  onDismissProblemStatement?: () => void;
  /** Hypothesis hub management */
  hubs?: Hypothesis[];
  hubEvidences?: Map<string, HypothesisEvidence>;
  hubProjections?: Map<string, HubProjection>;
  onCreateHub?: (
    name: string,
    synthesis: string,
    findingIds: string[],
    branchFields: HubComposerBranchFields
  ) => void;
  onUpdateHub?: (
    hubId: string,
    name: string,
    synthesis: string,
    findingIds: string[],
    branchFields: HubComposerBranchFields
  ) => void;
  onDeleteHub?: (hubId: string) => void;
  onToggleHubSelect?: (hubId: string) => void;
  onBrainstormHub?: (hubId: string) => void;
  evidenceClusters?: EvidenceCluster[];
  findings?: Finding[];
}

const AnalyzeConclusion: React.FC<AnalyzeConclusionProps> = ({
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
  findings,
}) => {
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
    findingIds: string[],
    branchFields: HubComposerBranchFields
  ) => {
    if (composerState.mode === 'editing' && composerState.editingHubId) {
      onUpdateHub?.(composerState.editingHubId, name, synthesis, findingIds, branchFields);
    } else {
      onCreateHub?.(name, synthesis, findingIds, branchFields);
    }
    setComposerState({ mode: 'closed' });
  };

  return (
    <div className="space-y-3" data-testid="analyze-conclusion">
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
                prefilledFindingIds: cluster.findingIds,
              });
            }}
            onDismiss={() => {
              setDismissedClusterIds(prev => new Set([...prev, cluster.factors.join(',')]));
            }}
          />
        ))}

      {/* Suspected Causes — hypothesis hub model */}
      {useHubModel && (
        <div data-testid="hypothesis-hubs">
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
                Name a hypothesis
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
                prefilledFindingIds={composerState.prefilledFindingIds}
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

export { AnalyzeConclusion };
