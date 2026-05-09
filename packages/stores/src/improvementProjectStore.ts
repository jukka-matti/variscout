import { create } from 'zustand';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';

export const STORE_LAYER = 'document' as const;

export interface ImprovementProjectStoreState {
  projectsByHub: Record<ProcessHub['id'], ImprovementProject[]>;
}

export interface ImprovementProjectStoreActions {
  setProjectsForHub: (hubId: ProcessHub['id'], projects: ImprovementProject[]) => void;
  getProjectsForHub: (hubId: ProcessHub['id']) => ImprovementProject[];
  upsertProject: (project: ImprovementProject) => void;
  removeProject: (projectId: ImprovementProject['id']) => void;
}

export type ImprovementProjectStore = ImprovementProjectStoreState & ImprovementProjectStoreActions;

export function getImprovementProjectInitialState(): ImprovementProjectStoreState {
  return { projectsByHub: {} };
}

export const useImprovementProjectStore = create<ImprovementProjectStore>()((set, get) => ({
  ...getImprovementProjectInitialState(),

  setProjectsForHub: (hubId, projects) =>
    set(state => ({
      projectsByHub: { ...state.projectsByHub, [hubId]: projects },
    })),

  getProjectsForHub: hubId => get().projectsByHub[hubId] ?? [],

  upsertProject: project =>
    set(state => {
      const existing = state.projectsByHub[project.hubId] ?? [];
      const idx = existing.findIndex(p => p.id === project.id);
      const next =
        idx === -1
          ? [...existing, project]
          : existing.map(p => (p.id === project.id ? project : p));
      return { projectsByHub: { ...state.projectsByHub, [project.hubId]: next } };
    }),

  removeProject: projectId =>
    set(state => {
      const nextByHub: Record<string, ImprovementProject[]> = { ...state.projectsByHub };
      let mutated = false;
      for (const [hubId, projects] of Object.entries(state.projectsByHub)) {
        const filtered = projects.filter(p => p.id !== projectId);
        if (filtered.length !== projects.length) {
          nextByHub[hubId] = filtered;
          mutated = true;
        }
      }
      return mutated ? { projectsByHub: nextByHub } : state;
    }),
}));
