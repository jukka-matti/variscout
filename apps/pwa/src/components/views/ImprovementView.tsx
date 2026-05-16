/**
 * ImprovementView - Improvement workspace for PWA
 *
 * Wraps ImproveTabRoot (wedge V1 action tracker) + ImprovementWorkspaceBase (ideas workspace)
 * with PWA-specific wiring.
 * No AI (no onAskCoScout), no popout (no onPopout), no Teams.
 */
import React from 'react';
import { ActiveIPScopeRibbon, ImprovementWorkspaceBase, ImproveTabRoot } from '@variscout/ui';
import type { ActiveIPScopeLabels } from '@variscout/ui';
import type { UseQuestionsReturn } from '@variscout/hooks';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ActionItem } from '@variscout/core/findings';
import type { UseImprovementOrchestrationReturn } from '../../features/improvement/useImprovementOrchestration';

interface ImprovementViewProps {
  activeIPScope?: { title: string; labels: ActiveIPScopeLabels } | null;
  /** Active IP for the wedge V1 action tracker. Null = no active project. */
  activeIP?: ImprovementProject | null;
  /** Action items scoped to the hub (filtered to activeIP inside ImproveTabRoot). */
  actions?: ActionItem[];
  /** Navigate to Home tab (used by NoActiveProjectGuidance). */
  onGoHome?: () => void;
  questionsState: UseQuestionsReturn;
  onBack: () => void;
  handleConvertIdeasToActions: UseImprovementOrchestrationReturn['handleConvertIdeasToActions'];
  improvementQuestions: UseImprovementOrchestrationReturn['improvementQuestions'];
  improvementLinkedFindings: UseImprovementOrchestrationReturn['improvementLinkedFindings'];
  selectedIdeaIds: UseImprovementOrchestrationReturn['selectedIdeaIds'];
  convertedIdeaIds: UseImprovementOrchestrationReturn['convertedIdeaIds'];
}

const PWA_USER_ID = 'analyst@local';

const ImprovementView: React.FC<ImprovementViewProps> = ({
  activeIPScope,
  activeIP,
  actions = [],
  onGoHome,
  questionsState,
  onBack,
  handleConvertIdeasToActions,
  improvementQuestions,
  improvementLinkedFindings,
  selectedIdeaIds,
  convertedIdeaIds,
}) => {
  // Wedge V1: when activeIP context is available (prop threaded from App.tsx),
  // render ImproveTabRoot as the primary surface. This shows NoActiveProjectGuidance
  // when no project is active, or the action tracker when one is set.
  if (activeIP !== undefined) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {activeIPScope ? (
          <ActiveIPScopeRibbon
            title={activeIPScope.title}
            labels={activeIPScope.labels}
            surface="Improve"
          />
        ) : null}
        <ImproveTabRoot
          activeIP={activeIP}
          actions={actions}
          currentUserId={PWA_USER_ID}
          onGoHome={onGoHome ?? onBack}
          onActionAdd={action => {
            // ACTION_ITEM_ADD persistence wired in PR-WV1-3
            console.warn('[wedge V1] onActionAdd not yet persisted (PR-WV1-3 work):', action);
          }}
          onActionUpdate={(id, patch) => {
            // ACTION_ITEM_UPDATE not yet wired (PR-WV1-3 work)
            console.warn('[wedge V1] onActionUpdate not yet wired (PR-WV1-3 work):', id, patch);
          }}
          onActionRemove={id => {
            // ACTION_ITEM_REMOVE not yet wired (PR-WV1-3 work)
            console.warn('[wedge V1] onActionRemove not yet wired (PR-WV1-3 work):', id);
          }}
        />
      </div>
    );
  }

  // Fallback: pre-wedge ideas workspace view (when activeIP prop not yet threaded).
  if (improvementQuestions.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {activeIPScope ? (
          <ActiveIPScopeRibbon
            title={activeIPScope.title}
            labels={activeIPScope.labels}
            surface="Improve"
          />
        ) : null}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="max-w-md space-y-3">
            <h2 className="text-lg font-semibold text-content">Improvement Workspace</h2>
            <p className="text-sm text-content-secondary">
              No improvement ideas yet. Start by investigating findings in the Investigation
              workspace, then add improvement ideas to your questions. Answered questions with ideas
              will appear here.
            </p>
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
            >
              Go to Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {activeIPScope ? (
        <ActiveIPScopeRibbon
          title={activeIPScope.title}
          labels={activeIPScope.labels}
          surface="Improve"
        />
      ) : null}
      <ImprovementWorkspaceBase
        questions={improvementQuestions}
        linkedFindings={improvementLinkedFindings}
        onToggleSelect={(qId, iId, selected) => questionsState.selectIdea(qId, iId, selected)}
        onUpdateTimeframe={(qId, iId, timeframe) =>
          questionsState.updateIdea(qId, iId, { timeframe })
        }
        onUpdateDirection={(qId, iId, direction) =>
          questionsState.updateIdea(qId, iId, { direction })
        }
        onUpdateCost={(qId, iId, cost) => questionsState.updateIdea(qId, iId, { cost })}
        onRemoveIdea={questionsState.removeIdea}
        onAddIdea={questionsState.addIdea}
        onConvertToActions={handleConvertIdeasToActions}
        onBack={onBack}
        selectedIdeaIds={selectedIdeaIds}
        convertedIdeaIds={convertedIdeaIds}
      />
    </div>
  );
};

export default ImprovementView;
