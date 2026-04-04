/**
 * useProjectActions — Store-first project persistence actions
 *
 * Replaces useProjectPersistence by reading/writing directly from Zustand stores
 * instead of taking 34 individual getters + 34 setters as props.
 *
 * Takes only a PersistenceAdapter parameter. Reads from useProjectStore.getState()
 * for save/export, writes to stores via loadProject/loadInvestigationState for load/import.
 *
 * Maintains identical AnalysisState serialization format for backward compatibility.
 */

import { useCallback } from 'react';
import { useProjectStore, useInvestigationStore } from '@variscout/stores';
import { filterStackToFilters } from '@variscout/core/navigation';
import type { AnalysisState, PersistenceAdapter, SavedProject, ViewState } from './types';
import type { SerializedProject } from '@variscout/stores';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Helpers
// ============================================================================

/**
 * Migrate isMindmapOpen → isFindingsOpen for old .vrs files.
 */
function migrateViewState(viewState: ViewState | undefined | null): ViewState | null {
  if (!viewState) return null;
  const vs = { ...viewState };
  if ('isMindmapOpen' in vs) {
    vs.isFindingsOpen =
      vs.isFindingsOpen ?? ((vs as Record<string, unknown>).isMindmapOpen as boolean | undefined);
    delete (vs as Record<string, unknown>).isMindmapOpen;
  }
  return vs;
}

/**
 * Build a SerializedProject from AnalysisState for store.loadProject().
 * Pre-processes filter stack and view state migrations.
 */
function buildSerializedProject(
  projectId: string | null,
  projectName: string | null,
  state: AnalysisState
): SerializedProject {
  // Pre-process: filterStack → flat filters derivation
  let filters = state.filters;
  let filterStack = state.filterStack ?? [];
  if (filterStack.length > 0) {
    filters = filterStackToFilters(filterStack);
  } else {
    // Old .vrs: use flat filters directly, no breadcrumbs
    filterStack = [];
  }

  // Pre-process: viewState migration
  const viewState = migrateViewState(state.viewState);

  return {
    projectId: projectId ?? '',
    projectName: projectName ?? '',
    rawData: state.rawData,
    outcome: state.outcome,
    factors: state.factors,
    specs: state.specs,
    analysisMode: state.analysisMode ?? 'standard',
    // Optional fields with backward-compat defaults
    timeColumn: state.timeColumn ?? null,
    columnAliases: state.columnAliases ?? {},
    valueLabels: state.valueLabels ?? {},
    measureSpecs: state.measureSpecs ?? {},
    stageColumn: state.stageColumn ?? null,
    stageOrderMode: state.stageOrderMode ?? 'auto',
    measureColumns: state.measureColumns ?? [],
    measureLabel: state.measureLabel ?? 'Measure',
    selectedMeasure: state.selectedMeasure ?? null,
    cpkTarget: state.cpkTarget,
    yamazumiMapping: state.yamazumiMapping ?? null,
    subgroupConfig: state.subgroupConfig ?? { method: 'fixed-size', size: 5 },
    filters,
    filterStack,
    axisSettings: state.axisSettings,
    displayOptions: state.displayOptions,
    chartTitles: state.chartTitles ?? {},
    paretoMode: state.paretoMode ?? 'derived',
    paretoAggregation: state.paretoAggregation ?? 'count',
    separateParetoData: state.separateParetoData ?? null,
    viewState,
    findings: state.findings ?? [],
    questions: state.questions ?? [],
    categories: state.categories ?? [],
  };
}

/**
 * Build compact AnalysisState from current store state for save/export.
 * Only includes non-default values for compact serialization.
 */
function getCurrentStateFromStores(): Omit<AnalysisState, 'version'> {
  const ps = useProjectStore.getState();

  const state: Omit<AnalysisState, 'version'> = {
    rawData: ps.rawData,
    outcome: ps.outcome,
    factors: ps.factors,
    specs: ps.specs,
    measureSpecs: Object.keys(ps.measureSpecs).length > 0 ? ps.measureSpecs : undefined,
    filters: ps.filters,
    axisSettings: ps.axisSettings,
    columnAliases: ps.columnAliases,
    valueLabels: ps.valueLabels,
    displayOptions: ps.displayOptions,
  };

  // Quick-win fields — only include non-default values for compact serialization
  if (ps.cpkTarget !== undefined) state.cpkTarget = ps.cpkTarget;
  if (ps.stageColumn !== null) state.stageColumn = ps.stageColumn;
  if (ps.stageOrderMode !== 'auto') state.stageOrderMode = ps.stageOrderMode;
  if (ps.measureColumns.length > 0) state.measureColumns = ps.measureColumns;
  if (ps.selectedMeasure !== null) state.selectedMeasure = ps.selectedMeasure;
  if (ps.measureLabel !== 'Measure') state.measureLabel = ps.measureLabel;
  if (Object.keys(ps.chartTitles).length > 0) state.chartTitles = ps.chartTitles;

  // Analysis mode — only include non-default values for compact serialization
  if (ps.analysisMode !== 'standard') state.analysisMode = ps.analysisMode;
  if (ps.yamazumiMapping) state.yamazumiMapping = ps.yamazumiMapping;
  if (
    ps.subgroupConfig &&
    (ps.subgroupConfig.method !== 'fixed-size' || ps.subgroupConfig.size !== 5)
  ) {
    state.subgroupConfig = ps.subgroupConfig;
  }

  // Pareto fields — only include non-default values for compact serialization
  if (ps.paretoMode !== 'derived') state.paretoMode = ps.paretoMode;
  if (ps.paretoAggregation !== 'count') state.paretoAggregation = ps.paretoAggregation;
  if (ps.separateParetoData) state.separateParetoData = ps.separateParetoData;

  // Time column — only include if set
  if (ps.timeColumn) state.timeColumn = ps.timeColumn;

  // Filter stack — only include if non-empty
  if (ps.filterStack.length > 0) state.filterStack = ps.filterStack;

  // View state — always include for explicit round-trip
  if (ps.viewState) state.viewState = ps.viewState;

  // Findings — only include if non-empty
  if (ps.findings.length > 0) state.findings = ps.findings;

  // Questions — only include if non-empty
  if (ps.questions.length > 0) state.questions = ps.questions;

  // Categories — only include if non-empty
  if (ps.categories.length > 0) state.categories = ps.categories;

  return state;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useProjectActions(persistence: PersistenceAdapter): ProjectActionsResult {
  // ---------------------------------------------------------------------------
  // Save — read from stores, persist, update project lifecycle
  // ---------------------------------------------------------------------------

  const saveProject = useCallback(
    async (name: string): Promise<SavedProject> => {
      const currentState = getCurrentStateFromStores();
      const project = await persistence.saveProject(name, currentState);
      // Atomic update: set id + name + markSaved in one setState to avoid
      // intermediate dirty states (setProjectId/setProjectName each trigger hasUnsavedChanges: true)
      useProjectStore.setState({
        projectId: project.id,
        projectName: project.name,
        hasUnsavedChanges: false,
      });
      return project;
    },
    [persistence]
  );

  // ---------------------------------------------------------------------------
  // Load — fetch from adapter, pre-process, hydrate stores
  // ---------------------------------------------------------------------------

  const loadProject = useCallback(
    async (id: string): Promise<void> => {
      const project = await persistence.loadProject(id);
      if (!project) return;

      const { state } = project;
      const serialized = buildSerializedProject(project.id, project.name, state);

      // Hydrate project store (handles all 30+ fields in one call)
      useProjectStore.getState().loadProject(serialized);

      // Hydrate investigation store
      useInvestigationStore.getState().loadInvestigationState({
        findings: state.findings ?? [],
        questions: state.questions ?? [],
        categories: state.categories ?? [],
      });
    },
    [persistence]
  );

  // ---------------------------------------------------------------------------
  // List / Delete / Rename — delegate to adapter
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Export — snapshot from stores → file
  // ---------------------------------------------------------------------------

  const exportProject = useCallback(
    (filename: string): void => {
      persistence.exportToFile(getCurrentStateFromStores(), filename);
    },
    [persistence]
  );

  // ---------------------------------------------------------------------------
  // Import — file → pre-process → hydrate stores
  // ---------------------------------------------------------------------------

  const importProject = useCallback(
    async (file: File): Promise<void> => {
      const state = await persistence.importFromFile(file);
      const projectName = file.name.replace(/\.vrs$/i, '');
      const serialized = buildSerializedProject(null, projectName, state);

      // Hydrate project store
      useProjectStore.getState().loadProject(serialized);
      // Mark as unsaved (imported, not yet saved)
      useProjectStore.getState().markUnsaved();
      // Clear project ID (imported file has no storage ID)
      useProjectStore.getState().setProjectId(null);

      // Hydrate investigation store
      useInvestigationStore.getState().loadInvestigationState({
        findings: state.findings ?? [],
        questions: state.questions ?? [],
        categories: state.categories ?? [],
      });
    },
    [persistence]
  );

  // ---------------------------------------------------------------------------
  // New — reset both stores
  // ---------------------------------------------------------------------------

  const newProject = useCallback((): void => {
    useProjectStore.getState().newProject();
    useInvestigationStore.getState().resetAll();
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
