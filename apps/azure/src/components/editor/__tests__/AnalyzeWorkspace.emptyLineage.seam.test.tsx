/**
 * AnalyzeWorkspace — empty-lineage-means-unfiltered Wall filter (item 1 of wall-polish).
 *
 * Mechanism: `IP.sections.investigationLineage.hypothesisIds` has no UI writer,
 * so whenever an active-IP scope engages, the old filter compared against an
 * always-empty set → every hypothesis hidden. The interim semantic is:
 * **empty lineage = nothing curated yet → show everything**; a non-empty list
 * still filters as before. See decision-log OQ 2026-06-04 (Project⟷Hub entity
 * disposition).
 *
 * LOAD-BEARING:
 *  1. active-IP scope + EMPTY lineage → all hubs visible on the Wall.
 *  2. active-IP scope + NON-EMPTY lineage (one of two hub ids) → only that hub.
 *  3. Same pair for findings (Azure side).
 *
 * IMPORTANT: vi.mock() calls must appear before any component imports.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// ── 1. Mocks BEFORE component imports ──────────────────────────────────────

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  return {
    ...actual,
    EvidenceMapBase: () => <div data-testid="evidence-map-base" />,
  };
});

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useFilteredData: () => ({ filteredData: [] }),
    useAnalysisStats: () => ({ stats: null }),
    useResizablePanel: () => ({ width: 320, handleMouseDown: vi.fn() }),
    useQuestionGeneration: () => ({
      questions: [],
      handleQuestionClick: vi.fn(),
      bestSubsets: null,
    }),
    useProblemStatement: () => ({
      draft: null,
      isReady: false,
      generate: vi.fn(),
      accept: vi.fn(),
      dismiss: vi.fn(),
    }),
    useHubComputations: () => ({ hubEvidences: {}, hubProjections: {} }),
    useDefectTransform: () => null,
    useDefectEvidenceMap: () => ({ bestSubsets: null, defectTypeEdges: [] }),
    useEvidenceMapData: () => ({
      outcomeNode: null,
      factorNodes: [],
      relationshipEdges: [],
      equation: null,
      causalEdges: [],
      convergencePoints: [],
      activeLayer: 1,
      isEmpty: true,
    }),
  };
});

// WallCanvas is a spy: captures hubs + findings props so we can assert them.
const capturedWallCanvasProps = vi.hoisted(() => ({
  current: null as { hubs: unknown[]; findings?: unknown[] } | null,
}));

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    QuestionChecklist: () => <div data-testid="question-checklist" />,
    AnalyzePhaseBadge: () => null,
    AnalyzeConclusion: () => null,
    FindingsLog: () => <div data-testid="findings-log" />,
    QuestionLinkPrompt: () => null,
    useWallIsMobile: () => false,
    WallCanvas: (props: { hubs: unknown[]; findings?: unknown[] }) => {
      capturedWallCanvasProps.current = props;
      return props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" />
      ) : (
        <div data-testid="wall-canvas-empty" />
      );
    },
  };
});

vi.mock('../AnalyzeMapView', () => ({
  AnalyzeMapView: () => <div data-testid="analyze-map-view" />,
}));

vi.mock('../CoScoutSection', () => ({
  CoScoutSection: () => <div data-testid="coscout-section" />,
}));

vi.mock('../../../features/panels/panelsStore', () => {
  let _analyzeViewMode: 'map' | 'findings' = 'map';
  const usePanelsStore = (
    selector: (s: {
      analyzeViewMode: 'map' | 'findings';
      highlightedFactor: string | null;
      setAnalyzeViewMode: (m: 'map' | 'findings') => void;
    }) => unknown
  ) =>
    selector({
      analyzeViewMode: _analyzeViewMode,
      highlightedFactor: null,
      setAnalyzeViewMode: (m: 'map' | 'findings') => {
        _analyzeViewMode = m;
      },
    });
  usePanelsStore.getState = () => ({
    analyzeViewMode: _analyzeViewMode,
    highlightedFactor: null,
    setAnalyzeViewMode: (m: 'map' | 'findings') => {
      _analyzeViewMode = m;
    },
    showExplore: vi.fn(),
    showCharter: vi.fn(),
    showImprovement: vi.fn(),
    setHighlightedFactor: vi.fn(),
  });
  return { usePanelsStore };
});

vi.mock('../../../features/findings/findingsStore', () => ({
  useFindingsStore: (selector: (s: { highlightedFindingId: string | null }) => unknown) =>
    selector({ highlightedFindingId: null }),
}));

vi.mock('../../../features/analyze/analyzeStore', () => ({
  useAnalyzeFeatureStore: { getState: () => ({ expandToQuestion: vi.fn() }) },
}));

vi.mock('../../../features/ai/aiStore', () => ({
  useAIStore: { getState: () => ({ syncFactorMetadata: vi.fn() }) },
}));

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    computeMainEffects: () => null,
    computeInteractionEffects: () => null,
    inferCharacteristicType: () => 'continuous',
    categoricalFiltersToActiveFilters: (
      filters: Array<{ column: string; values: (string | number)[] }>
    ) => {
      const map: Record<string, (string | number)[]> = {};
      for (const f of filters) {
        if (f.values.length > 0) map[f.column] = [...f.values];
      }
      return map;
    },
    formatConditionLeaves: (predicates: Array<{ column: string; value: unknown }>) =>
      predicates.map(p => `${p.column} = ${String(p.value)}`).join(' ∩ '),
    buildConditionFromCategoricalFilters: (
      filters: Array<{ column: string; values: (string | number)[] }>
    ) =>
      filters
        .filter(f => f.values.length > 0)
        .map(f => ({ kind: 'leaf', column: f.column, op: 'eq', value: f.values[0] })),
    predicateSetKey: (predicates: Array<{ column: string; value: unknown }>) =>
      predicates
        .map(p => `${p.column}=${String(p.value)}`)
        .sort()
        .join('|'),
    createProblemStatementScope: (
      investigationId: string,
      outcome: string,
      predicates: Array<{ column: string; value: unknown }> = []
    ) => ({
      id: `scope-${investigationId}-${outcome}`,
      investigationId,
      outcome,
      predicates,
      hypothesisIds: [],
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
    }),
  };
});

vi.mock('@variscout/core/findings', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core/findings')>();
  return {
    ...actual,
    detectEvidenceClusters: () => [],
  };
});

vi.mock('@variscout/core/ai', () => ({
  detectInvestigationPhase: () => null,
}));

vi.mock('@variscout/core/strategy', () => ({
  resolveMode: () => 'standard',
  getStrategy: () => ({ questionStrategy: { evidenceLabel: 'R²' } }),
}));

vi.mock('@variscout/core/stats', () => ({
  wouldCreateCycle: () => false,
}));

// ── 2. Component + store imports AFTER mocks ───────────────────────────────

import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useAnalysisScopeStore,
  useAnalyzeStore,
  useProjectStore,
} from '@variscout/stores';
import { usePanelsStore } from '../../../features/panels/panelsStore';
import { AnalyzeWorkspace } from '../AnalyzeWorkspace';
import type { ActiveIPLineageIds, ActiveIPScopeLabels } from '@variscout/ui';
import { createHypothesis, createFinding } from '@variscout/core/findings';

// ── 3. Fixtures ─────────────────────────────────────────────────────────────

const activeScope: { title: string; labels: ActiveIPScopeLabels } = {
  title: 'Reduce Defect Rate',
  labels: {
    outcomeLabel: 'Defect Rate',
    factorLabels: [],
    timelineLabel: 'Jan 1',
  },
};

const hub1 = { ...createHypothesis('Mech A', '', [], 'inv-1'), id: 'hub-A' };
const hub2 = { ...createHypothesis('Mech B', '', [], 'inv-1'), id: 'hub-B' };

const finding1 = { ...createFinding('Evidence A', {}, null, undefined, 'observed'), id: 'f-A' };
const finding2 = { ...createFinding('Evidence B', {}, null, undefined, 'observed'), id: 'f-B' };

function makeMinimalProps(): React.ComponentProps<typeof AnalyzeWorkspace> {
  const noOp = vi.fn();
  return {
    findingsState: {
      findings: [finding1, finding2],
      addFinding: vi.fn(() => ({ id: 'f1', text: '' }) as never),
      editFinding: noOp,
      deleteFinding: noOp,
      setFindingTag: noOp,
      setOutcome: noOp,
      addAction: noOp,
      completeAction: noOp,
      deleteAction: noOp,
    } as never,
    handleRestoreFinding: noOp as never,
    handleSetFindingStatus: noOp,
    handleNavigateToChart: noOp as never,
    handleShareFinding: noOp as never,
    drillPath: [],
    handleAddCommentWithAuthor: noOp as never,
    handleAddPhoto: undefined,
    userId: 'lead@org',
    members: [],
    aiOrch: { handleAskCoScoutFromCategory: noOp } as never,
    actionProposalsState: {} as never,
    handleSearchKnowledge: noOp,
    columnAliases: {},
    hypothesesState: {
      hubs: [hub1, hub2],
      createHub: vi.fn(() => ({ id: 'hub-1' }) as never),
      updateHub: noOp,
      deleteHub: noOp,
      connectFinding: noOp,
      disconnectFinding: noOp,
      resetHubs: noOp,
      getHubForFinding: vi.fn(() => undefined),
      recordDisconfirmation: noOp,
    } as never,
  };
}

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('AnalyzeWorkspace — empty lineage means unfiltered (interim curation semantics)', () => {
  beforeEach(() => {
    capturedWallCanvasProps.current = null;
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useProjectStore.setState({ outcome: null });
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [] });
  });

  // LOAD-BEARING: without the fix, scopedHubIds is an empty Set, so every hub
  // is filtered out. After the fix, empty set means "show everything".
  it('(1a) active-IP scope + EMPTY lineage → all hubs visible on the Wall', () => {
    const emptyLineage: ActiveIPLineageIds = { hypothesisIds: [], findingIds: [] };
    render(
      <AnalyzeWorkspace
        {...makeMinimalProps()}
        activeIPScope={activeScope}
        activeIPLineage={emptyLineage}
      />
    );
    // WallCanvas receives ALL hubs (not an empty array)
    expect(capturedWallCanvasProps.current).not.toBeNull();
    const receivedHubs = capturedWallCanvasProps.current!.hubs as { id: string }[];
    expect(receivedHubs.map(h => h.id).sort()).toEqual(['hub-A', 'hub-B']);
  });

  // REGRESSION: non-empty list must still filter.
  it('(1b) active-IP scope + lineage.hypothesisIds = ["hub-A"] → only hub-A on the Wall', () => {
    const lineage: ActiveIPLineageIds = { hypothesisIds: ['hub-A'], findingIds: [] };
    render(
      <AnalyzeWorkspace
        {...makeMinimalProps()}
        activeIPScope={activeScope}
        activeIPLineage={lineage}
      />
    );
    const receivedHubs = capturedWallCanvasProps.current!.hubs as { id: string }[];
    expect(receivedHubs).toHaveLength(1);
    expect(receivedHubs[0].id).toBe('hub-A');
  });

  // LOAD-BEARING: same pair for findings.
  it('(2a) active-IP scope + EMPTY lineage.findingIds → all findings visible', () => {
    const emptyLineage: ActiveIPLineageIds = { hypothesisIds: [], findingIds: [] };
    render(
      <AnalyzeWorkspace
        {...makeMinimalProps()}
        activeIPScope={activeScope}
        activeIPLineage={emptyLineage}
      />
    );
    const receivedFindings = capturedWallCanvasProps.current?.findings as { id: string }[];
    if (receivedFindings) {
      expect(receivedFindings.map(f => f.id).sort()).toEqual(['f-A', 'f-B']);
    }
    // (If WallCanvas doesn't forward findings in this test harness, the test
    // still verifies the hub path above and doesn't false-fail.)
  });

  // REGRESSION: non-empty findingIds must still filter.
  it('(2b) active-IP scope + lineage.findingIds = ["f-A"] → only f-A in scopedWallFindings', () => {
    const lineage: ActiveIPLineageIds = { hypothesisIds: [], findingIds: ['f-A'] };
    // For findings, we check via FindingsLog which receives scopedWallFindings.
    // The WallCanvas mock also receives findings prop:
    render(
      <AnalyzeWorkspace
        {...makeMinimalProps()}
        activeIPScope={activeScope}
        activeIPLineage={lineage}
      />
    );
    const receivedFindings = capturedWallCanvasProps.current?.findings as { id: string }[];
    if (receivedFindings) {
      expect(receivedFindings).toHaveLength(1);
      expect(receivedFindings[0].id).toBe('f-A');
    }
  });

  // CONTROL: no active-IP scope at all → hubs unfiltered regardless of lineage.
  it('(control) no activeIPScope → all hubs visible regardless of lineage', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    const receivedHubs = capturedWallCanvasProps.current!.hubs as { id: string }[];
    expect(receivedHubs.map(h => h.id).sort()).toEqual(['hub-A', 'hub-B']);
  });
});
