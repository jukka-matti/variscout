import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ActionItem } from '@variscout/core/findings';
import { ImproveStage } from './ImproveStage';
import { NoActiveProjectGuidance } from '../WorkspaceProject/NoActiveProjectGuidance';

export interface ImproveTabRootProps {
  workspaceProject: ImprovementProject | null;
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
  workspaceProject,
  actions,
  currentUserId,
  onGoHome,
  onActionAdd,
  onActionUpdate,
  onActionRemove,
}: ImproveTabRootProps) {
  if (workspaceProject === null) {
    return <NoActiveProjectGuidance onGoHome={onGoHome} />;
  }
  const members = workspaceProject.metadata.members ?? [];
  const scopedActions = actions.filter(a => a.parentImprovementProjectId === workspaceProject.id);
  return (
    <ImproveStage
      projectId={workspaceProject.id}
      actions={scopedActions}
      members={members}
      currentUserId={currentUserId}
      onActionAdd={onActionAdd}
      onActionUpdate={onActionUpdate}
      onActionRemove={onActionRemove}
    />
  );
}
