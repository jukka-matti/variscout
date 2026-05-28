import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ActionItem } from '@variscout/core/findings';
import { ImproveStage } from './ImproveStage';
import { NoActiveProjectGuidance } from '../ActiveIP/NoActiveProjectGuidance';

export interface ImproveTabRootProps {
  activeIP: ImprovementProject | null;
  actions: ActionItem[];
  currentUserId?: string;
  onGoHome: () => void;
  onActionAdd: (action: Pick<ActionItem, 'text' | 'parentImprovementProjectId'>) => void;
  onActionUpdate: (
    actionId: string,
    patch: Partial<Omit<ActionItem, 'id' | 'createdAt' | 'deletedAt'>>
  ) => void;
  onActionRemove: (actionId: string) => void;
}

export function ImproveTabRoot({
  activeIP,
  actions,
  currentUserId,
  onGoHome,
  onActionAdd,
  onActionUpdate,
  onActionRemove,
}: ImproveTabRootProps) {
  if (activeIP === null) {
    return <NoActiveProjectGuidance onGoHome={onGoHome} />;
  }
  const members = activeIP.metadata.members ?? [];
  const scopedActions = actions.filter(a => a.parentImprovementProjectId === activeIP.id);
  return (
    <ImproveStage
      projectId={activeIP.id}
      actions={scopedActions}
      members={members}
      currentUserId={currentUserId}
      onActionAdd={onActionAdd}
      onActionUpdate={onActionUpdate}
      onActionRemove={onActionRemove}
    />
  );
}
