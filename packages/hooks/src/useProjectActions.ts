/**
 * useProjectActions — store-first project persistence actions.
 *
 * R6c cut the persistence payload over to the runtime DocumentSnapshot boundary.
 * Adapters save/load/export/import complete hub-scoped documents; old
 * loose analysis payloads are intentionally absent.
 */

import { useCallback } from 'react';
import {
  buildDocumentSnapshot,
  hydrateDocumentSnapshot,
  useAnalyzeStore,
  useProjectStore,
} from '@variscout/stores';
import type { ProcessHub } from '@variscout/core';
import type { DocumentSnapshotImport, PersistenceAdapter, SavedProject } from './types';

export interface ProjectActionsResult {
  saveProject: (name: string) => Promise<SavedProject>;
  loadProject: (id: string) => Promise<void>;
  listProjects: () => Promise<SavedProject[]>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, newName: string) => Promise<void>;
  exportProject: (filename: string) => void;
  importProject: (file: File) => Promise<void>;
  newProject: () => void;
}

export interface UseProjectActionsOptions {
  getActiveHub?: () => ProcessHub | null | undefined;
}

function isDocumentSnapshotImport(value: unknown): value is DocumentSnapshotImport {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'document-snapshot' &&
    typeof (value as { file?: unknown }).file === 'object' &&
    (value as { file?: unknown }).file !== null
  );
}

export function useProjectActions(
  persistence: PersistenceAdapter,
  options: UseProjectActionsOptions = {}
): ProjectActionsResult {
  const getActiveHub = useCallback(() => options.getActiveHub?.() ?? null, [options]);

  const saveProject = useCallback(
    async (name: string): Promise<SavedProject> => {
      const project = await persistence.saveProject(
        name,
        buildDocumentSnapshot({ activeHub: getActiveHub() })
      );
      useProjectStore.setState({
        projectId: project.id,
        projectName: project.name,
        hasUnsavedChanges: false,
      });
      return project;
    },
    [getActiveHub, persistence]
  );

  const loadProject = useCallback(
    async (id: string): Promise<void> => {
      const project = await persistence.loadProject(id);
      if (!project) return;

      hydrateDocumentSnapshot(project.state);
      useProjectStore.setState({
        projectId: project.id,
        projectName: project.name,
        hasUnsavedChanges: false,
      });
    },
    [persistence]
  );

  const listProjects = useCallback(async (): Promise<SavedProject[]> => {
    return persistence.listProjects();
  }, [persistence]);

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      await persistence.deleteProject(id);
      const ps = useProjectStore.getState();
      if (ps.projectId === id) {
        ps.setProjectId(null);
        ps.setProjectName(null);
      }
    },
    [persistence]
  );

  const renameProject = useCallback(
    async (id: string, newName: string): Promise<void> => {
      await persistence.renameProject(id, newName);
      const ps = useProjectStore.getState();
      if (ps.projectId === id) {
        ps.setProjectName(newName);
      }
    },
    [persistence]
  );

  const exportProject = useCallback(
    (filename: string): void => {
      persistence.exportToFile(filename, { activeHub: getActiveHub() });
    },
    [getActiveHub, persistence]
  );

  const importProject = useCallback(
    async (file: File): Promise<void> => {
      const imported = await persistence.importFromFile(file);
      if (!isDocumentSnapshotImport(imported)) {
        throw new Error('Invalid project import payload.');
      }

      hydrateDocumentSnapshot(imported.file.documentSnapshot);
      useProjectStore.setState({
        projectId: null,
        projectName: file.name.replace(/\.vrs$/i, ''),
        hasUnsavedChanges: true,
      });
    },
    [persistence]
  );

  const newProject = useCallback((): void => {
    useProjectStore.getState().newProject();
    useAnalyzeStore.getState().resetAll();
  }, []);

  return {
    saveProject,
    loadProject,
    listProjects,
    deleteProject,
    renameProject,
    exportProject,
    importProject,
    newProject,
  };
}
