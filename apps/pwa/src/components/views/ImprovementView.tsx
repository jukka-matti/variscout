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
import type { ActionItem } from '@variscout/core/findings';

interface ImprovementViewProps {
  activeIPScope?: { title: string; labels: ActiveIPScopeLabels } | null;
  /** Active IP for the wedge V1 action tracker. Null = no active project. */
  activeIP: ImprovementProject | null;
  /** Action items scoped to the hub (filtered to activeIP inside ImproveTabRoot). */
  actions: ActionItem[];
  /** Navigate to Home tab (used by NoActiveProjectGuidance). */
  onGoHome: () => void;
}

const PWA_USER_ID = 'analyst@local';

const ImprovementView: React.FC<ImprovementViewProps> = ({
  activeIPScope,
  activeIP,
  actions,
  onGoHome,
}) => {
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
        onGoHome={onGoHome}
        onActionAdd={action =>
          console.warn('[wedge V1] ACTION_ITEM_ADD not yet wired (PR-WV1-3 work):', action)
        }
        onActionUpdate={(id, patch) =>
          console.warn('[wedge V1] ACTION_ITEM_UPDATE not yet wired (PR-WV1-3 work):', id, patch)
        }
        onActionRemove={id =>
          console.warn('[wedge V1] ACTION_ITEM_REMOVE not yet wired (PR-WV1-3 work):', id)
        }
      />
    </div>
  );
};

export default ImprovementView;
