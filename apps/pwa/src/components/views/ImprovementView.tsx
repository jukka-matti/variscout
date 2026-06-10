/**
 * ImprovementView - Improvement workspace for PWA
 *
 * Wraps ImproveTabRoot (wedge V1 action tracker) with PWA-specific wiring.
 * No AI (no onAskCoScout), no popout (no onPopout), no Teams.
 * Workspace Project branching is handled internally by ImproveTabRoot:
 *   - workspaceProject = null  → NoActiveProjectGuidance
 *   - workspaceProject = <IP>  → ImproveStage action tracker
 */
import React from 'react';
import { ImproveTabRoot } from '@variscout/ui';
import type { WorkspaceProjectScopeLabels } from '@variscout/ui';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { createProjectActionItem } from '@variscout/core/findings';
import { reduceActionItems, type ActionItemAction } from '@variscout/core/actions';
import { useImprovementProjectStore } from '@variscout/stores';
import { PWA_USER_ID } from '../../lib/pwaUser';

interface ImprovementViewProps {
  workspaceProjectScope?: { title: string; labels: WorkspaceProjectScopeLabels } | null;
  /** Workspace Project for the wedge V1 action tracker. Null = no active project. */
  workspaceProject: ImprovementProject | null;
  /** Navigate to Home tab (used by NoActiveProjectGuidance). */
  onGoHome: () => void;
}

/**
 * Build an `applyAction` dispatcher bound to the given IP + store mutator.
 * Exported for unit testing without full component rendering.
 */
export function buildApplyAction(
  workspaceProject: ImprovementProject | null,
  upsertProject: (project: ImprovementProject) => void
): (action: ActionItemAction) => void {
  return (action: ActionItemAction) => {
    if (!workspaceProject) return;
    const currentActions = workspaceProject.metadata.actions ?? [];
    const nextActions = reduceActionItems(currentActions, action);
    upsertProject({
      ...workspaceProject,
      metadata: { ...workspaceProject.metadata, actions: nextActions },
    });
  };
}

const ImprovementView: React.FC<ImprovementViewProps> = ({ workspaceProject, onGoHome }) => {
  const upsertProject = useImprovementProjectStore(s => s.upsertProject);
  const applyAction = buildApplyAction(workspaceProject, upsertProject);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ImproveTabRoot
        workspaceProject={workspaceProject}
        actions={workspaceProject?.metadata.actions ?? []}
        currentUserId={PWA_USER_ID}
        onGoHome={onGoHome}
        onActionAdd={({ text, parentImprovementProjectId }) =>
          applyAction({
            kind: 'ACTION_ITEM_ADD',
            hubId: workspaceProject?.hubId ?? '',
            actionItem: createProjectActionItem({
              text,
              parentImprovementProjectId: parentImprovementProjectId ?? null,
            }),
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
