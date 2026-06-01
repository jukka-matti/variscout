/**
 * Azure Persistence Adapter
 *
 * Wraps the Azure persistence functions to conform to the PersistenceAdapter interface
 * from @variscout/hooks, enabling the shared useDataState hook.
 *
 * Note: Azure uses name-based lookups instead of id-based lookups like PWA.
 * This adapter handles the mapping between the two approaches.
 */

import type {
  PersistenceAdapter,
  AnalysisState,
  SavedProject,
  ProjectExportContext,
  ProjectImportPayload,
} from '@variscout/hooks';
import {
  saveProjectLocally,
  loadProjectLocally,
  listProjectsLocally,
  deleteProjectLocally,
  renameProjectLocally,
  exportToFile as exportToFileImpl,
  importFromFile as importFromFileImpl,
} from './persistence';

/**
 * Default storage location for new projects
 * Can be overridden by the DataContext for team vs personal storage
 */
let defaultLocation: 'team' | 'personal' = 'team';

/**
 * Set the default storage location for new projects
 */
export function setDefaultLocation(location: 'team' | 'personal'): void {
  defaultLocation = location;
}

/**
 * Azure persistence adapter implementation
 * Uses IndexedDB for local cache
 *
 * The adapter uses project name as the lookup key (Azure's approach)
 * but the SavedProject returned includes both id and name for compatibility.
 */
export const azurePersistenceAdapter: PersistenceAdapter = {
  /**
   * Save project to local IndexedDB
   * Note: In Azure, the 'id' parameter is treated as the project name
   */
  saveProject: async (
    name: string,
    state: Omit<AnalysisState, 'version'>
  ): Promise<SavedProject> => {
    const project = await saveProjectLocally(name, state, defaultLocation);
    // Return with location typed as string for interface compatibility
    return {
      ...project,
      location: project.location,
    };
  },

  /**
   * Load project from local IndexedDB
   * Note: In Azure, we look up by name (the id parameter is treated as name)
   */
  loadProject: async (id: string): Promise<SavedProject | undefined> => {
    const project = await loadProjectLocally(id);
    if (project) {
      return {
        ...project,
        location: project.location,
      };
    }
    return undefined;
  },

  /**
   * List all saved projects from local IndexedDB
   */
  listProjects: async (): Promise<SavedProject[]> => {
    const projects = await listProjectsLocally();
    return projects.map(p => ({
      ...p,
      location: p.location,
    }));
  },

  /**
   * Delete project from local IndexedDB
   * Note: In Azure, we delete by name (the id parameter is treated as name)
   */
  deleteProject: async (id: string): Promise<void> => {
    await deleteProjectLocally(id);
  },

  /**
   * Rename project in local IndexedDB
   * Note: In Azure, we use name-based lookup
   */
  renameProject: async (id: string, newName: string): Promise<void> => {
    await renameProjectLocally(id, newName);
  },

  exportToFile: (
    state: Omit<AnalysisState, 'version'>,
    filename: string,
    context?: ProjectExportContext
  ): void => {
    exportToFileImpl(state, filename, context);
  },

  importFromFile: async (file: File): Promise<ProjectImportPayload> => {
    return importFromFileImpl(file);
  },
};
