/**
 * Shared types for @variscout/hooks package
 *
 * These interfaces abstract the data context dependencies
 * allowing hooks to be used across different apps (PWA, Azure)
 */

import type {
  DataRow,
  DataQualityReport,
  StatsResult,
  SpecLimits,
  ParetoRow,
  ProcessHub,
} from '@variscout/core';
import type { DocumentSnapshot, DocumentSnapshotVrsFile } from '@variscout/stores';

// Re-export canonical UI types from @variscout/core/ui-types
export type {
  ScaleMode,
  HighlightColor,
  DisplayOptions,
  ChartTitles,
  ParetoMode,
  ParetoAggregation,
  ViewState,
  AxisSettings,
} from '@variscout/core/ui-types';

// Re-export for convenience
export type { DataQualityReport, ParetoRow };

import type { ScaleMode } from '@variscout/core/ui-types';

/**
 * Minimal interface for chart scale calculation
 * Apps inject their context data matching this shape
 */
export interface ChartScaleContext {
  filteredData: DataRow[];
  outcome: string | null;
  specs: SpecLimits;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
}

/**
 * Minimal interface for filter navigation functionality
 * Apps inject their context data matching this shape
 */
export interface FilterNavigationContext {
  filters: Record<string, (string | number)[]>;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  columnAliases: Record<string, string>;
}

/**
 * Minimal interface for variation tracking
 * Apps inject their context data matching this shape
 */
export interface VariationTrackingContext {
  rawData: DataRow[];
  outcome: string | null;
  factors: string[];
}

/**
 * Full DataContext interface for components that need broad access
 * This mirrors the PWA/Azure DataContext but as an abstract interface
 */
export interface DataContextInterface {
  // Data
  rawData: DataRow[];
  filteredData: DataRow[];
  outcome: string | null;
  factors: string[];
  specs: SpecLimits;
  stats: StatsResult | null;

  // Filters & Settings
  filters: Record<string, (string | number)[]>;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  axisSettings: { min?: number; max?: number; scaleMode?: ScaleMode };
  columnAliases: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;
}

// ============================================================================
// Persistence Types - For shared DataContext hook
// ============================================================================

export interface DocumentSnapshotImport {
  kind: 'document-snapshot';
  file: DocumentSnapshotVrsFile;
}

export type ProjectImportPayload = DocumentSnapshotImport;

export interface ProjectExportContext {
  activeHub?: ProcessHub | null;
}

/**
 * Saved project metadata
 */
export interface SavedProject {
  id: string;
  name: string;
  state: DocumentSnapshot;
  savedAt: string;
  rowCount: number;
  location?: string; // Azure app uses this for team/personal
}

/**
 * Persistence adapter interface
 * Allows apps to provide their own storage implementations
 */
export interface PersistenceAdapter {
  /** Save project to storage */
  saveProject: (name: string, state: DocumentSnapshot) => Promise<SavedProject>;

  /** Load project from storage */
  loadProject: (id: string) => Promise<SavedProject | undefined>;

  /** List all saved projects */
  listProjects: () => Promise<SavedProject[]>;

  /** Delete project from storage */
  deleteProject: (id: string) => Promise<void>;

  /** Rename project in storage */
  renameProject: (id: string, newName: string) => Promise<void>;

  /** Export state to file */
  exportToFile: (filename: string, context: ProjectExportContext) => void;

  /** Import state from file */
  importFromFile: (file: File) => Promise<ProjectImportPayload>;
}

/**
 * Debounce utility type
 */
export type DebouncedFunction<T extends (...args: unknown[]) => void> = T & {
  cancel: () => void;
};

// ============================================================================
// Chart Types
// ============================================================================

/**
 * Chart scale result
 */
export interface ChartScaleResult {
  min: number;
  max: number;
}
