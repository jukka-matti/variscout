/**
 * PWA Persistence Adapter
 *
 * Wraps the existing persistence functions to conform to the PersistenceAdapter interface
 * from @variscout/hooks, enabling the shared useDataState hook.
 */

import type { PersistenceAdapter, AnalysisState, SavedProject } from '@variscout/hooks';
import {
  autoSave as autoSaveImpl,
  loadAutoSave as loadAutoSaveImpl,
  clearAutoSave as clearAutoSaveImpl,
  saveProject as saveProjectImpl,
  loadProject as loadProjectImpl,
  listProjects as listProjectsImpl,
  deleteProject as deleteProjectImpl,
  renameProject as renameProjectImpl,
  exportToFile as exportToFileImpl,
  importFromFile as importFromFileImpl,
} from './persistence';

/**
 * PWA persistence adapter implementation
 * Uses IndexedDB for projects and localStorage for auto-save
 */
export const pwaPersistenceAdapter: PersistenceAdapter = {
  autoSave: (state: Omit<AnalysisState, 'version'>): void => {
    autoSaveImpl(state);
  },

  loadAutoSave: (): AnalysisState | null => {
    return loadAutoSaveImpl();
  },

  clearAutoSave: (): void => {
    clearAutoSaveImpl();
  },

  saveProject: async (
    name: string,
    state: Omit<AnalysisState, 'version'>
  ): Promise<SavedProject> => {
    return saveProjectImpl(name, state);
  },

  loadProject: async (id: string): Promise<SavedProject | undefined> => {
    return loadProjectImpl(id);
  },

  listProjects: async (): Promise<SavedProject[]> => {
    return listProjectsImpl();
  },

  deleteProject: async (id: string): Promise<void> => {
    return deleteProjectImpl(id);
  },

  renameProject: async (id: string, newName: string): Promise<void> => {
    return renameProjectImpl(id, newName);
  },

  exportToFile: (state: Omit<AnalysisState, 'version'>, filename: string): void => {
    exportToFileImpl(state, filename);
  },

  importFromFile: async (file: File): Promise<AnalysisState> => {
    return importFromFileImpl(file);
  },
};
