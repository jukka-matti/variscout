import { beforeEach, describe, expect, it } from 'vitest';
import type {
  AnalyzeCategory,
  CausalLink,
  Finding,
  Hypothesis,
  ProblemStatementScope,
  ProcessHub,
} from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  buildDocumentSnapshot,
  documentSnapshotFingerprint,
  hydrateDocumentSnapshot,
  reconstructProcessHubFromDocumentSnapshot,
  resetDocumentStores,
  type DocumentSnapshot,
} from '../documentSnapshot';
import { getAnalyzeInitialState, useAnalyzeStore } from '../analyzeStore';
import { useCanvasStore } from '../canvasStore';
import {
  getImprovementProjectInitialState,
  useImprovementProjectStore,
} from '../improvementProjectStore';
import { getProjectInitialState, useProjectStore } from '../projectStore';

const now = 1714000000000;

function resetStores() {
  useProjectStore.setState(getProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasStore.setState(useCanvasStore.getInitialState());
  useImprovementProjectStore.setState(getImprovementProjectInitialState());
}

function makeFinding(id = 'finding-1'): Finding {
  return {
    id,
    text: `Finding ${id}`,
    context: { activeFilters: {}, cumulativeScope: null, stats: { mean: 12, samples: 40 } },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: now,
    investigationId: 'inv-1',
    createdAt: now,
    deletedAt: null,
  };
}

function makeHypothesis(id = 'hypothesis-1'): Hypothesis {
  return {
    id,
    name: `Hypothesis ${id}`,
    synthesis: 'Thermal drift explains the variation.',
    findingIds: ['finding-1'],
    status: 'proposed',
    updatedAt: now,
    investigationId: 'inv-1',
    createdAt: now,
    deletedAt: null,
  };
}

function makeScope(id = 'scope-1'): ProblemStatementScope {
  return {
    id,
    investigationId: 'inv-1',
    outcome: 'yield',
    predicates: [{ field: 'line', op: 'eq', value: 'A' }],
    hypothesisIds: ['hypothesis-1'],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function makeCategory(id = 'category-1'): AnalyzeCategory {
  return {
    id,
    name: 'Equipment',
    factorNames: ['line'],
    createdAt: now,
    deletedAt: null,
  };
}

function makeCausalLink(id = 'link-1'): CausalLink {
  return {
    id,
    fromFactor: 'line',
    toFactor: 'yield',
    whyStatement: 'Line setup drives yield.',
    direction: 'drives',
    evidenceType: 'data',
    findingIds: ['finding-1'],
    source: 'analyst',
    updatedAt: now,
    createdAt: now,
    deletedAt: null,
  };
}

function makeProject(id: string, hubId: string, status: ImprovementProject['status'] = 'draft') {
  return {
    id,
    hubId,
    status,
    metadata: { title: `Project ${id}` },
    goal: {
      outcomeGoals: [{ outcomeSpecId: `outcome-${hubId}`, target: 1.33 }],
    },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } satisfies ImprovementProject;
}

function makeHub(id: string, improvementProject?: ImprovementProject): ProcessHub {
  return {
    id,
    name: `Hub ${id}`,
    description: `Description ${id}`,
    processOwner: { displayName: 'Owner', userId: 'owner@example.com' },
    processGoal: `Goal ${id}`,
    createdAt: now,
    updatedAt: now + 1,
    deletedAt: null,
    outcomes: [
      {
        id: `outcome-${id}`,
        hubId: id,
        columnName: 'yield',
        characteristicType: 'largerIsBetter',
        createdAt: now,
        deletedAt: null,
      },
    ],
    primaryScopeDimensions: ['line'],
    canonicalMapVersion: `version-${id}`,
    ...(improvementProject ? { improvementProject } : {}),
  };
}

function seedProjectStore() {
  useProjectStore.setState({
    ...getProjectInitialState(),
    projectId: 'project-1',
    projectName: 'Snapshot project',
    rawData: [
      { yield: 91, line: 'A', defects: 2 },
      { yield: 87, line: 'B', defects: 5 },
    ],
    dataFilename: 'baseline.csv',
    dataQualityReport: {
      totalRows: 2,
      validRows: 2,
      excludedRows: [],
      columnIssues: [],
      perOutcome: {},
    },
    outcome: 'yield',
    factors: ['line'],
    timeColumn: 'date',
    specs: { yield: { lsl: 90, usl: 100 } },
    analysisMode: 'defect',
    defectMapping: {
      dataShape: 'event-log',
      defectTypeColumn: 'defect_type',
      countColumn: 'defects',
      aggregationUnit: 'batch',
    },
    separateParetoFilename: 'pareto.csv',
    entryScenario: 'problem',
  });
}

function seedAnalyzeStore() {
  useAnalyzeStore.getState().loadAnalyzeState({
    findings: [makeFinding()],
    hypotheses: [makeHypothesis()],
    causalLinks: [makeCausalLink()],
    categories: [makeCategory()],
    scopes: [makeScope()],
  });
}

function seedCanvasStore() {
  useCanvasStore.getState().addStep('Draft');
  expect(useCanvasStore.getState().historyDepth()).toBeGreaterThan(0);
  useCanvasStore.getState().hydrateCanvasDocument({
    canonicalMap: {
      version: 1,
      nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
      tributaries: [],
      assignments: { 'chip-line': 'step-1' },
      arrows: [],
      createdAt: '2026-05-31T00:00:00.000Z',
      updatedAt: '2026-05-31T00:00:00.000Z',
    },
    outcomes: [
      {
        id: 'outcome-hub-1',
        hubId: 'hub-1',
        columnName: 'yield',
        characteristicType: 'largerIsBetter',
        createdAt: now,
        deletedAt: null,
      },
    ],
    primaryScopeDimensions: ['line'],
    canonicalMapVersion: 'canvas-version-1',
  });
}

beforeEach(() => {
  resetStores();
});

describe('buildDocumentSnapshot', () => {
  it('captures project config fields that are missing from legacy analysis-state export', () => {
    seedProjectStore();

    const snapshot = buildDocumentSnapshot();

    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.hubId).toBeNull();
    expect(snapshot.hub).toBeNull();
    expect(snapshot.project).toMatchObject({
      projectId: 'project-1',
      projectName: 'Snapshot project',
      dataFilename: 'baseline.csv',
      dataQualityReport: {
        totalRows: 2,
        validRows: 2,
      },
      defectMapping: {
        dataShape: 'event-log',
        countColumn: 'defects',
      },
      separateParetoFilename: 'pareto.csv',
      entryScenario: 'problem',
    });
  });

  it('captures a minimal hub shell for session restoration', () => {
    seedCanvasStore();

    const snapshot = buildDocumentSnapshot({ activeHub: makeHub('hub-1') });

    expect(snapshot.hub).toEqual({
      id: 'hub-1',
      name: 'Hub hub-1',
      description: 'Description hub-1',
      processGoal: 'Goal hub-1',
      processOwner: { displayName: 'Owner', userId: 'owner@example.com' },
      createdAt: now,
      updatedAt: now + 1,
      deletedAt: null,
    });
  });

  it('uses analyzeStore as the authority for investigation arrays including scopes', () => {
    seedAnalyzeStore();

    const snapshot = buildDocumentSnapshot();

    expect(snapshot.analyze.findings).toEqual([makeFinding()]);
    expect(snapshot.analyze.hypotheses).toEqual([makeHypothesis()]);
    expect(snapshot.analyze.causalLinks).toEqual([makeCausalLink()]);
    expect(snapshot.analyze.categories).toEqual([makeCategory()]);
    expect(snapshot.analyze.scopes).toEqual([makeScope()]);
  });

  it('captures only canvas document state and excludes history stacks', () => {
    seedCanvasStore();

    const snapshot = buildDocumentSnapshot();

    expect(snapshot.canvas).toEqual({
      canonicalMap: {
        version: 1,
        nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
        tributaries: [],
        assignments: { 'chip-line': 'step-1' },
        arrows: [],
        createdAt: '2026-05-31T00:00:00.000Z',
        updatedAt: '2026-05-31T00:00:00.000Z',
      },
      outcomes: [
        {
          id: 'outcome-hub-1',
          hubId: 'hub-1',
          columnName: 'yield',
          characteristicType: 'largerIsBetter',
          createdAt: now,
          deletedAt: null,
        },
      ],
      primaryScopeDimensions: ['line'],
      canonicalMapVersion: 'canvas-version-1',
    });
    expect('undoStack' in snapshot.canvas).toBe(false);
    expect('redoStack' in snapshot.canvas).toBe(false);
  });

  it('prefers the fresher store project over activeHub.improvementProject', () => {
    const staleProject = makeProject('ip-stale', 'hub-1', 'draft');
    const freshProject = makeProject('ip-fresh', 'hub-1', 'closed');
    useImprovementProjectStore.getState().upsertProject(freshProject);

    const snapshot = buildDocumentSnapshot({ activeHub: makeHub('hub-1', staleProject) });

    expect(snapshot.hubId).toBe('hub-1');
    expect(snapshot.improvementProject).toEqual(freshProject);
    expect(snapshot.improvementProject?.status).toBe('closed');
  });

  it('falls back to activeHub.improvementProject and stores null when no project exists', () => {
    const hubProject = makeProject('ip-hub', 'hub-1', 'active');

    expect(
      buildDocumentSnapshot({ activeHub: makeHub('hub-1', hubProject) }).improvementProject
    ).toEqual(hubProject);
    expect(buildDocumentSnapshot({ activeHub: makeHub('hub-empty') })).toMatchObject({
      hubId: 'hub-empty',
      improvementProject: null,
    });
  });

  it('does not serialize unrelated cached projects from other hubs', () => {
    const activeProject = makeProject('ip-active', 'hub-1');
    const unrelatedProject = makeProject('ip-other', 'hub-2');
    useImprovementProjectStore.getState().upsertProject(activeProject);
    useImprovementProjectStore.getState().upsertProject(unrelatedProject);

    const snapshot = buildDocumentSnapshot({ activeHub: makeHub('hub-1') });

    expect(snapshot.improvementProject).toEqual(activeProject);
    expect(JSON.stringify(snapshot)).not.toContain('ip-other');
    expect(JSON.stringify(snapshot)).not.toContain('projectsById');
  });
});

describe('documentSnapshotFingerprint', () => {
  it('matches for identical snapshots', () => {
    seedProjectStore();
    seedAnalyzeStore();
    seedCanvasStore();
    const snapshot = buildDocumentSnapshot({ activeHub: makeHub('hub-1') });

    expect(documentSnapshotFingerprint(snapshot)).toBe(documentSnapshotFingerprint(snapshot));
    expect(documentSnapshotFingerprint(snapshot)).toBe(
      documentSnapshotFingerprint(JSON.parse(JSON.stringify(snapshot)) as DocumentSnapshot)
    );
  });

  it('uses stable key ordering to avoid false differences', () => {
    seedProjectStore();
    const snapshot = buildDocumentSnapshot({ activeHub: makeHub('hub-1') });
    const reordered: DocumentSnapshot = {
      canvas: snapshot.canvas,
      improvementProject: snapshot.improvementProject,
      project: {
        ...snapshot.project,
        rawData: snapshot.project.rawData.map(row => ({
          defects: row.defects,
          line: row.line,
          yield: row.yield,
        })),
      },
      analyze: snapshot.analyze,
      hub: snapshot.hub,
      hubId: snapshot.hubId,
      schemaVersion: snapshot.schemaVersion,
    };

    expect(documentSnapshotFingerprint(reordered)).toBe(documentSnapshotFingerprint(snapshot));
  });

  it('changes when project, analyze, canvas, or active hub improvement project state changes', () => {
    seedProjectStore();
    seedAnalyzeStore();
    seedCanvasStore();
    const activeHub = makeHub('hub-1');
    const baseline = documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub }));

    useProjectStore.getState().setProjectName('Renamed project');
    expect(documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub }))).not.toBe(baseline);

    resetStores();
    seedProjectStore();
    seedAnalyzeStore();
    seedCanvasStore();
    useAnalyzeStore.getState().loadAnalyzeState({ findings: [makeFinding('finding-2')] });
    expect(documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub }))).not.toBe(baseline);

    resetStores();
    seedProjectStore();
    seedAnalyzeStore();
    seedCanvasStore();
    useCanvasStore.getState().addStep('Inspect');
    expect(documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub }))).not.toBe(baseline);

    resetStores();
    seedProjectStore();
    seedAnalyzeStore();
    seedCanvasStore();
    useImprovementProjectStore
      .getState()
      .upsertProject(makeProject('ip-active', 'hub-1', 'active'));
    expect(documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub }))).not.toBe(baseline);
  });

  it('ignores canvas undo and redo history outside the document snapshot payload', () => {
    seedCanvasStore();
    const beforeHistoryChange = documentSnapshotFingerprint(buildDocumentSnapshot());

    useCanvasStore.getState().addStep('Temporary history entry');
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useCanvasStore.getState().redoDepth()).toBe(1);

    expect(documentSnapshotFingerprint(buildDocumentSnapshot())).toBe(beforeHistoryChange);
  });
});

describe('hydrateDocumentSnapshot', () => {
  it('reconstructs a ProcessHub from the snapshot hub shell and document state', () => {
    seedCanvasStore();
    const project = makeProject('ip-snapshot', 'hub-1', 'active');
    const snapshot = buildDocumentSnapshot({ activeHub: makeHub('hub-1', project) });

    const hub = reconstructProcessHubFromDocumentSnapshot(snapshot);

    expect(hub).toMatchObject({
      id: 'hub-1',
      name: 'Hub hub-1',
      description: 'Description hub-1',
      processGoal: 'Goal hub-1',
      canonicalProcessMap: snapshot.canvas.canonicalMap,
      canonicalMapVersion: snapshot.canvas.canonicalMapVersion,
      outcomes: snapshot.canvas.outcomes,
      primaryScopeDimensions: snapshot.canvas.primaryScopeDimensions,
      improvementProject: project,
    });
  });

  it('hydrates project, analyze, canvas, and replaces only the project for the snapshot hub', () => {
    seedProjectStore();
    seedAnalyzeStore();
    seedCanvasStore();
    const staleProject = makeProject('ip-stale', 'hub-1');
    const snapshotProject = makeProject('ip-snapshot', 'hub-1', 'active');
    const otherHubProject = makeProject('ip-other', 'hub-2');
    useImprovementProjectStore.getState().upsertProject(snapshotProject);
    useImprovementProjectStore.getState().upsertProject(otherHubProject);

    const snapshot = buildDocumentSnapshot({ activeHub: makeHub('hub-1', snapshotProject) });

    resetStores();
    useProjectStore.getState().setProjectName('stale');
    useAnalyzeStore.getState().loadAnalyzeState({ scopes: [makeScope('stale-scope')] });
    useCanvasStore.getState().addStep('Stale');
    useImprovementProjectStore.getState().upsertProject(staleProject);
    useImprovementProjectStore.getState().upsertProject(otherHubProject);

    hydrateDocumentSnapshot(snapshot);

    expect(useProjectStore.getState()).toMatchObject({
      projectId: 'project-1',
      projectName: 'Snapshot project',
      dataFilename: 'baseline.csv',
      defectMapping: { countColumn: 'defects' },
      entryScenario: 'problem',
    });
    expect(useAnalyzeStore.getState().scopes).toEqual([makeScope()]);
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([
      { id: 'step-1', name: 'Mix', order: 0 },
    ]);
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useImprovementProjectStore.getState().projectsById).toEqual({
      'ip-other': otherHubProject,
      'ip-snapshot': snapshotProject,
    });
  });

  it('resetDocumentStores clears all document stores', () => {
    seedProjectStore();
    seedAnalyzeStore();
    seedCanvasStore();
    useImprovementProjectStore.getState().upsertProject(makeProject('ip-1', 'hub-1'));

    resetDocumentStores();

    expect(useProjectStore.getState()).toMatchObject(getProjectInitialState());
    expect(useAnalyzeStore.getState()).toMatchObject(getAnalyzeInitialState());
    expect(useCanvasStore.getState().canonicalMap.nodes).toEqual([]);
    expect(useCanvasStore.getState().historyDepth()).toBe(0);
    expect(useImprovementProjectStore.getState().projectsById).toEqual({});
  });
});
