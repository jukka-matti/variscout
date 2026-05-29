import { create } from 'zustand';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';

export const STORE_LAYER = 'document' as const;

export interface ImprovementProjectStoreState {
  projectsById: Record<ImprovementProject['id'], ImprovementProject>;
}

export interface ImprovementProjectStoreActions {
  /** Returns the single live project for a hub (1:1 invariant), or undefined. */
  getProjectForHub: (hubId: ProcessHub['id']) => ImprovementProject | undefined;
  /** Upsert the single project for a hub (keyed by project.id). */
  setProjectForHub: (hubId: ProcessHub['id'], project: ImprovementProject) => void;
  upsertProject: (project: ImprovementProject) => void;
  removeProject: (projectId: ImprovementProject['id']) => void;
}

export type ImprovementProjectStore = ImprovementProjectStoreState & ImprovementProjectStoreActions;

export function getImprovementProjectInitialState(): ImprovementProjectStoreState {
  return { projectsById: {} };
}

export const useImprovementProjectStore = create<ImprovementProjectStore>()((set, get) => ({
  ...getImprovementProjectInitialState(),

  getProjectForHub: hubId =>
    Object.values(get().projectsById).find(p => p.hubId === hubId && p.deletedAt === null),

  setProjectForHub: (_hubId, project) =>
    set(state => ({
      projectsById: { ...state.projectsById, [project.id]: project },
    })),

  upsertProject: project =>
    set(state => ({
      projectsById: { ...state.projectsById, [project.id]: project },
    })),

  removeProject: projectId =>
    set(state => {
      if (!(projectId in state.projectsById)) return state;
      const next = { ...state.projectsById };
      delete next[projectId];
      return { projectsById: next };
    }),
}));
