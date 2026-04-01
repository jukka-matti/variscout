/**
 * ImprovementView - Improvement workspace for PWA
 *
 * Wraps ImprovementWorkspaceBase from @variscout/ui with PWA-specific wiring.
 * Reads from Zustand stores (improvementStore).
 * No AI (no onAskCoScout), no popout (no onPopout), no Teams.
 */
import React from 'react';
import { ImprovementWorkspaceBase } from '@variscout/ui';
import type { UseHypothesesReturn } from '@variscout/hooks';
import { useImprovementStore } from '../../features/improvement/improvementStore';
import type { UseImprovementOrchestrationReturn } from '../../features/improvement/useImprovementOrchestration';

interface ImprovementViewProps {
  hypothesesState: UseHypothesesReturn;
  onBack: () => void;
  handleConvertIdeasToActions: UseImprovementOrchestrationReturn['handleConvertIdeasToActions'];
}

const ImprovementView: React.FC<ImprovementViewProps> = ({
  hypothesesState,
  onBack,
  handleConvertIdeasToActions,
}) => {
  const improvementHypotheses = useImprovementStore(s => s.improvementHypotheses);
  const improvementLinkedFindings = useImprovementStore(s => s.improvementLinkedFindings);
  const selectedIdeaIds = useImprovementStore(s => s.selectedIdeaIds);
  const convertedIdeaIds = useImprovementStore(s => s.convertedIdeaIds);

  if (improvementHypotheses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-md space-y-3">
          <h2 className="text-lg font-semibold text-content">Improvement Workspace</h2>
          <p className="text-sm text-content-secondary">
            No improvement ideas yet. Start by investigating findings in the Investigation
            workspace, then add improvement ideas to your hypotheses. Supported hypotheses with
            ideas will appear here.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
          >
            Go to Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <ImprovementWorkspaceBase
      hypotheses={improvementHypotheses}
      linkedFindings={improvementLinkedFindings}
      onToggleSelect={(hId, iId, selected) => hypothesesState.selectIdea(hId, iId, selected)}
      onUpdateTimeframe={(hId, iId, timeframe) =>
        hypothesesState.updateIdea(hId, iId, { timeframe })
      }
      onUpdateDirection={(hId, iId, direction) =>
        hypothesesState.updateIdea(hId, iId, { direction })
      }
      onUpdateCost={(hId, iId, cost) => hypothesesState.updateIdea(hId, iId, { cost })}
      onRemoveIdea={hypothesesState.removeIdea}
      onAddIdea={hypothesesState.addIdea}
      onConvertToActions={handleConvertIdeasToActions}
      onBack={onBack}
      selectedIdeaIds={selectedIdeaIds}
      convertedIdeaIds={convertedIdeaIds}
    />
  );
};

export default ImprovementView;
