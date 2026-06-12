import type { ProcessHub } from '@variscout/core/processHub';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { isFormalizedProject } from '@variscout/core/improvementProject';
import type { AnalysisScopeState } from '@variscout/stores';

export interface ProjectSummary {
  id: ImprovementProject['id'];
  title: string;
  status: ImprovementProject['status'];
  createdAt: number;
  updatedAt: number;
  memberCount: number;
}

export interface WorkspaceCapabilities {
  canFormalize: boolean;
  canReport: boolean;
}

export interface WorkspaceViewModel {
  workspaceId: ProcessHub['id'];
  title: string;
  project: ProjectSummary;
  isFormalized: boolean;
  analysisScope: AnalysisScopeState;
  capabilities: WorkspaceCapabilities;
}

export interface DeriveWorkspaceViewModelInput {
  hub: ProcessHub | null | undefined;
  project?: ImprovementProject | null | undefined;
  analysisScope: AnalysisScopeState;
}

function resolveLiveProject(
  hub: ProcessHub,
  project: ImprovementProject | null | undefined
): ImprovementProject | null {
  const candidate = project ?? hub.improvementProject ?? null;
  return candidate && candidate.deletedAt === null ? candidate : null;
}

export function deriveWorkspaceViewModel({
  hub,
  project,
  analysisScope,
}: DeriveWorkspaceViewModelInput): WorkspaceViewModel | null {
  if (!hub || hub.deletedAt !== null) return null;
  const liveProject = resolveLiveProject(hub, project);
  if (!liveProject) return null;

  const isFormalized = isFormalizedProject(liveProject);
  const title = liveProject.metadata.title || hub.name || 'Untitled Workspace';

  return {
    workspaceId: hub.id,
    title,
    project: {
      id: liveProject.id,
      title,
      status: liveProject.status,
      createdAt: liveProject.createdAt,
      updatedAt: liveProject.updatedAt,
      memberCount: liveProject.metadata.contributors?.length ?? 0,
    },
    isFormalized,
    analysisScope,
    capabilities: {
      canFormalize: !isFormalized,
      canReport: true,
    },
  };
}
