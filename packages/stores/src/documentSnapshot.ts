import type {
  AnalyzeCategory,
  CausalLink,
  Finding,
  Hypothesis,
  ProblemStatementScope,
  ProcessHub,
} from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { useAnalyzeStore } from './analyzeStore';
import { useCanvasStore, type CanvasDocumentSnapshot } from './canvasStore';
import { useImprovementProjectStore } from './improvementProjectStore';
import { useProjectStore, type SerializedProject, type ProjectState } from './projectStore';

export interface BuildDocumentSnapshotOptions {
  activeHub?: (Pick<ProcessHub, 'id'> & Partial<ProcessHub>) | null;
}

export interface AnalyzeDocumentSnapshot {
  findings: Finding[];
  categories: AnalyzeCategory[];
  hypotheses: Hypothesis[];
  causalLinks: CausalLink[];
  scopes: ProblemStatementScope[];
}

export type ProjectDocumentSnapshot = Omit<
  SerializedProject,
  'findings' | 'categories' | 'hypotheses' | 'causalLinks' | 'processContext' | 'entryScenario'
> &
  Pick<ProjectState, 'entryScenario' | 'processContext'>;

export interface DocumentHubSnapshot {
  id: ProcessHub['id'];
  name: ProcessHub['name'];
  description?: ProcessHub['description'];
  processOwner?: ProcessHub['processOwner'];
  processGoal?: ProcessHub['processGoal'];
  reviewSignal?: ProcessHub['reviewSignal'];
  contextColumns?: ProcessHub['contextColumns'];
  createdAt: ProcessHub['createdAt'];
  updatedAt?: ProcessHub['updatedAt'];
  deletedAt: ProcessHub['deletedAt'];
}

export interface DocumentSnapshot {
  schemaVersion: 1;
  hubId: ProcessHub['id'] | null;
  hub: DocumentHubSnapshot | null;
  project: ProjectDocumentSnapshot;
  analyze: AnalyzeDocumentSnapshot;
  canvas: CanvasDocumentSnapshot;
  improvementProject: ImprovementProject | null;
}

function cloneJson<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildProjectSnapshot(state: ProjectState): ProjectDocumentSnapshot {
  return cloneJson({
    projectId: state.projectId ?? '',
    projectName: state.projectName ?? '',
    rawData: state.rawData,
    outcome: state.outcome,
    factors: state.factors,
    specs: state.specs,
    analysisMode: state.analysisMode,
    dataFilename: state.dataFilename,
    dataQualityReport: state.dataQualityReport,
    timeColumn: state.timeColumn,
    columnAliases: state.columnAliases,
    valueLabels: state.valueLabels,
    measureSpecs: state.measureSpecs,
    stageColumn: state.stageColumn,
    stageOrderMode: state.stageOrderMode,
    measureColumns: state.measureColumns,
    measureLabel: state.measureLabel,
    selectedMeasure: state.selectedMeasure,
    cpkTarget: state.cpkTarget,
    defectMapping: state.defectMapping,
    subgroupConfig: state.subgroupConfig,
    filters: state.filters,
    filterStack: state.filterStack,
    axisSettings: state.axisSettings,
    displayOptions: state.displayOptions,
    chartTitles: state.chartTitles,
    paretoMode: state.paretoMode,
    paretoAggregation: state.paretoAggregation,
    separateParetoData: state.separateParetoData,
    separateParetoFilename: state.separateParetoFilename,
    processContext: state.processContext,
    entryScenario: state.entryScenario,
    viewState: state.viewState,
  });
}

function buildAnalyzeSnapshot(): AnalyzeDocumentSnapshot {
  const state = useAnalyzeStore.getState();
  return cloneJson({
    findings: state.findings,
    categories: state.categories,
    hypotheses: state.hypotheses,
    causalLinks: state.causalLinks,
    scopes: state.scopes,
  });
}

function buildCanvasSnapshot(): CanvasDocumentSnapshot {
  const state = useCanvasStore.getState();
  return cloneJson({
    canonicalMap: state.canonicalMap,
    outcomes: state.outcomes,
    primaryScopeDimensions: state.primaryScopeDimensions,
    canonicalMapVersion: state.canonicalMapVersion,
  });
}

function selectImprovementProject(
  activeHub: BuildDocumentSnapshotOptions['activeHub']
): ImprovementProject | null {
  if (!activeHub) return null;
  return (
    useImprovementProjectStore.getState().getProjectForHub(activeHub.id) ??
    activeHub.improvementProject ??
    null
  );
}

function buildHubSnapshot(
  activeHub: BuildDocumentSnapshotOptions['activeHub']
): DocumentHubSnapshot | null {
  if (!activeHub) return null;

  return cloneJson({
    id: activeHub.id,
    name: activeHub.name ?? 'Untitled Project',
    description: activeHub.description,
    processOwner: activeHub.processOwner,
    processGoal: activeHub.processGoal,
    reviewSignal: activeHub.reviewSignal,
    contextColumns: activeHub.contextColumns,
    createdAt: activeHub.createdAt ?? Date.now(),
    updatedAt: activeHub.updatedAt,
    deletedAt: activeHub.deletedAt ?? null,
  });
}

export function buildDocumentSnapshot(
  options: BuildDocumentSnapshotOptions = {}
): DocumentSnapshot {
  const activeHub = options.activeHub ?? null;
  const improvementProject = selectImprovementProject(activeHub);

  return {
    schemaVersion: 1,
    hubId: activeHub?.id ?? null,
    hub: buildHubSnapshot(activeHub),
    project: buildProjectSnapshot(useProjectStore.getState()),
    analyze: buildAnalyzeSnapshot(),
    canvas: buildCanvasSnapshot(),
    improvementProject: cloneJson(improvementProject),
  };
}

export function reconstructProcessHubFromDocumentSnapshot(snapshot: DocumentSnapshot): ProcessHub {
  const hub = snapshot.hub;
  const id = hub?.id ?? snapshot.hubId;
  if (!id) {
    throw new Error('Cannot reconstruct a ProcessHub from a snapshot without a hub id.');
  }

  return cloneJson({
    id,
    name: hub?.name ?? snapshot.project.projectName ?? 'Untitled Project',
    description: hub?.description,
    processOwner: hub?.processOwner,
    processGoal: hub?.processGoal,
    reviewSignal: hub?.reviewSignal,
    contextColumns: hub?.contextColumns,
    createdAt: hub?.createdAt ?? Date.now(),
    updatedAt: hub?.updatedAt,
    deletedAt: hub?.deletedAt ?? null,
    canonicalProcessMap: snapshot.canvas.canonicalMap,
    canonicalMapVersion: snapshot.canvas.canonicalMapVersion,
    outcomes: snapshot.canvas.outcomes,
    primaryScopeDimensions: snapshot.canvas.primaryScopeDimensions,
    ...(snapshot.improvementProject ? { improvementProject: snapshot.improvementProject } : {}),
  });
}

export function resetDocumentStores(): void {
  useProjectStore.getState().newProject();
  useAnalyzeStore.getState().resetAll();
  useCanvasStore.setState(useCanvasStore.getInitialState());
  useImprovementProjectStore.setState({ projectsById: {} });
}

export function hydrateDocumentSnapshot(snapshot: DocumentSnapshot): void {
  const { entryScenario, processContext, ...project } = cloneJson(snapshot.project);
  const serializedProject: SerializedProject = {
    ...project,
    ...(entryScenario ? { entryScenario } : {}),
    ...(processContext ? { processContext } : {}),
    findings: cloneJson(snapshot.analyze.findings),
    categories: cloneJson(snapshot.analyze.categories),
    hypotheses: cloneJson(snapshot.analyze.hypotheses),
    causalLinks: cloneJson(snapshot.analyze.causalLinks),
  };

  useProjectStore.getState().loadProject(serializedProject);
  useAnalyzeStore.getState().loadAnalyzeState(cloneJson(snapshot.analyze));
  useCanvasStore.getState().hydrateCanvasDocument(cloneJson(snapshot.canvas));

  const improvementStore = useImprovementProjectStore.getState();
  if (snapshot.hubId) {
    const existingProject = improvementStore.getProjectForHub(snapshot.hubId);
    if (existingProject) {
      improvementStore.removeProject(existingProject.id);
    }
  }
  if (snapshot.improvementProject) {
    useImprovementProjectStore.getState().upsertProject(cloneJson(snapshot.improvementProject));
  }
}
