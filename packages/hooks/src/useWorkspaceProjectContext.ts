import { useCallback, useMemo } from 'react';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';

export interface WorkspaceProjectContext {
  activeState: { projectId: ImprovementProject['id']; setAt: number } | null;
  workspaceProject: ImprovementProject | null;
  isWorkspaceProjectScoped: boolean;
  setWorkspaceProject: (projectId: ImprovementProject['id'], setAt?: number) => void;
}

export interface UseWorkspaceProjectContextOptions {
  userId?: string | null;
}

function liveProjects(hub: ProcessHub | undefined | null): ImprovementProject[] {
  const p = hub?.improvementProject;
  return p && p.deletedAt === null ? [p] : [];
}

export function useWorkspaceProjectContext(
  hub: ProcessHub | undefined | null,
  options: UseWorkspaceProjectContextOptions = {}
): WorkspaceProjectContext {
  void options;
  const projects = useMemo(() => liveProjects(hub), [hub]);
  const workspaceProject = projects[0] ?? null;
  const activeState = workspaceProject
    ? { projectId: workspaceProject.id, setAt: workspaceProject.createdAt }
    : null;

  const setWorkspaceProject = useCallback(
    (_projectId: ImprovementProject['id'], _setAt?: number) => {
      // Compatibility no-op: a Workspace's attached Project is always the context.
    },
    []
  );

  return {
    activeState,
    workspaceProject,
    isWorkspaceProjectScoped: Boolean(workspaceProject),
    setWorkspaceProject,
  };
}
