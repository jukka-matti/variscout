/**
 * Persistence utilities for Azure app
 *
 * Similar to PWA persistence but integrates with cloud sync.
 * Local storage is used for auto-save; IndexedDB for offline cache.
 */

import type { ProjectExportContext, ProjectImportPayload } from '@variscout/hooks';
import { generateDeterministicId } from '@variscout/core/identity';
import {
  buildDocumentSnapshotVrs,
  type DocumentSnapshot,
  parseDocumentSnapshotVrs,
} from '@variscout/stores';
import { db } from '../db/schema';

export interface SavedProject {
  id: string;
  name: string;
  location: 'team' | 'personal';
  state: DocumentSnapshot;
  savedAt: string;
  rowCount: number;
  synced: boolean;
  cloudId?: string;
  modifiedBy?: string;
}

// Save project to IndexedDB (local cache)
export async function saveProjectLocally(
  name: string,
  state: DocumentSnapshot,
  location: 'team' | 'personal'
): Promise<SavedProject> {
  const project: SavedProject = {
    id: generateDeterministicId(),
    name,
    location,
    state,
    savedAt: new Date().toISOString(),
    rowCount: state.project.rawData.length,
    synced: false,
  };

  await db.projects.put({
    name: project.name,
    location: project.location,
    modified: new Date(),
    synced: false,
    data: state,
  });

  return project;
}

// Update existing project in IndexedDB
export async function updateProjectLocally(
  id: string,
  name: string,
  state: DocumentSnapshot,
  location: 'team' | 'personal'
): Promise<SavedProject> {
  const project: SavedProject = {
    id,
    name,
    location,
    state,
    savedAt: new Date().toISOString(),
    rowCount: state.project.rawData.length,
    synced: false,
  };

  await db.projects.put({
    name: project.name,
    location: project.location,
    modified: new Date(),
    synced: false,
    data: state,
  });

  return project;
}

// Load project from IndexedDB
export async function loadProjectLocally(name: string): Promise<SavedProject | undefined> {
  const record = await db.projects.get(name);
  if (!record) return undefined;
  return {
    id: record.name,
    name: record.name,
    location: record.location,
    state: record.data,
    savedAt: record.modified?.toISOString() ?? new Date().toISOString(),
    rowCount: record.data.project.rawData.length,
    synced: record.synced,
  };
}

// List all saved projects from IndexedDB
export async function listProjectsLocally(): Promise<SavedProject[]> {
  const records = await db.projects.toArray();
  return records
    .map(r => ({
      id: r.name,
      name: r.name,
      location: r.location,
      state: r.data,
      savedAt: r.modified?.toISOString() ?? new Date().toISOString(),
      rowCount: r.data.project.rawData.length,
      synced: r.synced,
    }))
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

// Delete project from IndexedDB
export async function deleteProjectLocally(name: string): Promise<void> {
  await db.projects.delete(name);
}

// Rename project in IndexedDB
export async function renameProjectLocally(oldName: string, newName: string): Promise<void> {
  const record = await db.projects.get(oldName);
  if (record) {
    await db.projects.delete(oldName);
    await db.projects.put({
      name: newName,
      location: record.location,
      modified: new Date(),
      synced: false,
      data: record.data,
    });
  }
}

// Export state to downloadable .vrs file
export function exportToFile(filename: string, context: ProjectExportContext): void {
  if (!context.activeHub) {
    throw new Error('Cannot export .vrs without an active hub.');
  }
  const appVersion = import.meta.env.VITE_APP_VERSION ?? 'dev';
  const json = buildDocumentSnapshotVrs({
    activeHub: context.activeHub,
    metadata: { exportSource: 'azure', appVersion },
  });
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.vrs') ? filename : `${filename}.vrs`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import state from .vrs file
export function importFromFile(file: File): Promise<ProjectImportPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        resolve({ kind: 'document-snapshot', file: parseDocumentSnapshotVrs(content) });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Invalid file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Debounce utility for auto-save
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  return debounced;
}
