/**
 * Persistence utilities for Azure app
 *
 * Similar to PWA persistence but integrates with cloud sync.
 * Local storage is used for auto-save; IndexedDB for offline cache.
 */

import type { DataRow } from '@variscout/core';
import { db } from '../db/schema';

// Display options for capability metrics
export interface DisplayOptions {
  /** Lock Y-axis to full dataset range when filtering (default: true) */
  lockYAxisToFullData?: boolean;
}

// Types for saved analysis state
export interface AnalysisState {
  version: string;
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: { usl?: number; lsl?: number; target?: number };
  filters: Record<string, (string | number)[]>;
  axisSettings: { min?: number; max?: number };
  columnAliases?: Record<string, string>;
  valueLabels?: Record<string, Record<string, string>>;
  displayOptions?: DisplayOptions;
}

export interface SavedProject {
  id: string;
  name: string;
  location: 'team' | 'personal';
  state: AnalysisState;
  savedAt: string;
  rowCount: number;
  synced: boolean;
  cloudId?: string;
  modifiedBy?: string;
}

const VERSION = '1.0.0';

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Save project to IndexedDB (local cache)
export async function saveProjectLocally(
  name: string,
  state: Omit<AnalysisState, 'version'>,
  location: 'team' | 'personal'
): Promise<SavedProject> {
  const project: SavedProject = {
    id: generateId(),
    name,
    location,
    state: { ...state, version: VERSION },
    savedAt: new Date().toISOString(),
    rowCount: state.rawData.length,
    synced: false,
  };

  await db.projects.put({
    name: project.name,
    location: project.location,
    modified: new Date(),
    synced: false,
    data: project,
  });

  return project;
}

// Update existing project in IndexedDB
export async function updateProjectLocally(
  id: string,
  name: string,
  state: Omit<AnalysisState, 'version'>,
  location: 'team' | 'personal'
): Promise<SavedProject> {
  const project: SavedProject = {
    id,
    name,
    location,
    state: { ...state, version: VERSION },
    savedAt: new Date().toISOString(),
    rowCount: state.rawData.length,
    synced: false,
  };

  await db.projects.put({
    name: project.name,
    location: project.location,
    modified: new Date(),
    synced: false,
    data: project,
  });

  return project;
}

// Load project from IndexedDB
export async function loadProjectLocally(name: string): Promise<SavedProject | undefined> {
  const record = await db.projects.get(name);
  return record?.data as SavedProject | undefined;
}

// List all saved projects from IndexedDB
export async function listProjectsLocally(): Promise<SavedProject[]> {
  const records = await db.projects.toArray();
  return records
    .map(r => r.data as SavedProject)
    .filter(Boolean)
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
    const project = record.data as SavedProject;
    project.name = newName;
    await db.projects.delete(oldName);
    await db.projects.put({
      name: newName,
      location: project.location,
      modified: new Date(),
      synced: false,
      data: project,
    });
  }
}

// Export state to downloadable .vrs file
export function exportToFile(state: Omit<AnalysisState, 'version'>, filename: string): void {
  const exportState: AnalysisState = { ...state, version: VERSION };
  const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
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
export function importFromFile(file: File): Promise<AnalysisState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const state = JSON.parse(content) as AnalysisState;
        resolve(state);
      } catch {
        reject(new Error('Invalid file format'));
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
