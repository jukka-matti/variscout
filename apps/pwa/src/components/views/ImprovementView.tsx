/**
 * ImprovementView - Improvement workspace for PWA
 *
 * Wraps ImproveTabRoot (wedge V1 action tracker) with PWA-specific wiring.
 * No AI (no onAskCoScout), no popout (no onPopout), no Teams.
 * Active-IP branching is handled internally by ImproveTabRoot:
 *   - activeIP = null  → NoActiveProjectGuidance
 *   - activeIP = <IP>  → ImproveStage action tracker
 */
import React from 'react';
import { ActiveIPScopeRibbon, ImproveTabRoot } from '@variscout/ui';
import type { ActiveIPScopeLabels } from '@variscout/ui';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { generateDeterministicId } from '@variscout/core/identity';
import { reduceActionItems, type ActionItemAction } from '@variscout/core/actions';
import { useImprovementProjectStore } from '@variscout/stores';

interface ImprovementViewProps {
  activeIPScope?: { title: string; labels: ActiveIPScopeLabels } | null;
  /** Active IP for the wedge V1 action tracker. Null = no active project. */
  activeIP: ImprovementProject | null;
  /** Navigate to Home tab (used by NoActiveProjectGuidance). */
  onGoHome: () => void;
}

const PWA_USER_ID = 'analyst@local';

/**
 * Build an `applyAction` dispatcher bound to the given IP + store mutator.
 * Exported for unit testing without full component rendering.
 */
export function buildApplyAction(
  activeIP: ImprovementProject | null,
  upsertProject: (project: ImprovementProject) => void
): (action: ActionItemAction) => void {
  return (action: ActionItemAction) => {
    if (!activeIP) return;
    const currentActions = activeIP.metadata.actions ?? [];
    const nextActions = reduceActionItems(currentActions, action);
    upsertProject({
      ...activeIP,
      metadata: { ...activeIP.metadata, actions: nextActions },
    });
  };
}

const ImprovementView: React.FC<ImprovementViewProps> = ({ activeIPScope, activeIP, onGoHome }) => {
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);
  const applyAction = buildApplyAction(activeIP, upsertProject);

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
        actions={activeIP?.metadata.actions ?? []}
        currentUserId={PWA_USER_ID}
        onGoHome={onGoHome}
        onActionAdd={({ text, parentImprovementProjectId }) =>
          applyAction({
            kind: 'ACTION_ITEM_ADD',
            hubId: activeIP?.hubId ?? '',
            actionItem: {
              id: generateDeterministicId(),
              createdAt: Date.now(),
              deletedAt: null,
              text,
              parentImprovementProjectId,
              status: 'open',
            },
          })
        }
        onActionUpdate={(actionItemId, patch) =>
          applyAction({ kind: 'ACTION_ITEM_UPDATE', actionItemId, patch })
        }
        onActionRemove={actionItemId =>
          applyAction({ kind: 'ACTION_ITEM_REMOVE', actionItemId, removedAt: Date.now() })
        }
      />
    </div>
  );
};

export default ImprovementView;
