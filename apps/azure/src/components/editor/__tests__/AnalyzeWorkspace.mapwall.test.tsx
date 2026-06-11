/**
 * Tests for the Wall/Causes/Findings Analyze lenses wired into AnalyzeWorkspace.
 *
 * Strategy:
 * - Heavy dependencies (charts, hooks, feature stores) are mocked so we can
 *   render AnalyzeWorkspace in isolation without providing the full
 *   orchestration props tree.
 * - useCanvasViewportStore is NOT mocked — we use the real store and reset it in
 *   beforeEach per the Zustand testing pattern in .claude/rules/testing.md.
 * - panelsStore is NOT mocked — analyzeViewMode='map' remains the internal
 *   Wall/Causes bucket, while Evidence Map is not part of the primary flow.
 *
 * IMPORTANT: vi.mock() calls must appear before any component imports.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── 1. Mocks BEFORE component imports ──────────────────────────────────────

const showCharterMock = vi.hoisted(() => vi.fn());
const capturedWallCanvasProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));
const capturedFindingsLogProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));
const capturedMapViewProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));
const capturedModelDrawerProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));

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
    useResizablePanel: () => ({
      width: 320,
      handleMouseDown: vi.fn(),
    }),
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
    useDefectEvidenceMap: () => ({
      bestSubsets: null,
      defectTypeEdges: [],
    }),
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

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    QuestionChecklist: () => <div data-testid="question-checklist" />,
    AnalyzeConclusion: () => null,
    FindingsLog: (props: Record<string, unknown>) => {
      capturedFindingsLogProps.current = props;
      return <div data-testid="findings-log" />;
    },
    QuestionLinkPrompt: () => null,
    useWallIsMobile: () => false,
    WallCanvas: (props: {
      hubs: Array<{ id: string; name?: string }>;
      planningProps?: Record<string, unknown>;
      onWriteHypothesis?: () => void;
      onSeedFromFactorIntel?: () => void;
      onSelectHub?: (id: string) => void;
    }) => {
      capturedWallCanvasProps.current = props as Record<string, unknown>;
      return props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" data-has-process-map={String('processMap' in props)}>
          {props.hubs.map(hub => (
            <button
              key={hub.id}
              type="button"
              data-testid={`mock-wall-select-${hub.id}`}
              onClick={() => props.onSelectHub?.(hub.id)}
            >
              {hub.name ?? hub.id}
            </button>
          ))}
        </div>
      ) : (
        <div data-testid="wall-canvas-empty" data-has-process-map={String('processMap' in props)}>
          {props.onWriteHypothesis && (
            <button data-testid="empty-write-hypothesis" onClick={props.onWriteHypothesis}>
              Add a suspected cause
            </button>
          )}
          {props.onSeedFromFactorIntel && (
            <button data-testid="empty-seed-factors" onClick={props.onSeedFromFactorIntel}>
              Seed 3 from Factor Intelligence
            </button>
          )}
        </div>
      );
    },
    // ER-3 — capture the app-mounted model drawer's props (the seam that replaced
    // the in-SVG band). The FE-1 wiring test reads candidateFactors / scopeLabel /
    // onCaptureModel off THIS mock.
    ModelDrawerBase: (props: Record<string, unknown>) => {
      capturedModelDrawerProps.current = props;
      return <div data-testid="model-drawer-mock" data-open={String(props.open)} />;
    },
  };
});

vi.mock('../AnalyzeMapView', () => ({
  AnalyzeMapView: (props: Record<string, unknown>) => {
    capturedMapViewProps.current = props;
    return <div data-testid="analyze-map-view" />;
  },
}));

vi.mock('../../../features/panels/panelsStore', () => {
  // Minimal mutable stub so we can control analyzeViewMode
  let _analyzeViewMode: 'map' | 'findings' = 'map';
  const _highlightedFactor: string | null = null;

  const usePanelsStore = (
    selector: (s: {
      analyzeViewMode: 'map' | 'findings';
      highlightedFactor: string | null;
      setAnalyzeViewMode: (m: 'map' | 'findings') => void;
    }) => unknown
  ) => {
    const state = {
      analyzeViewMode: _analyzeViewMode,
      highlightedFactor: _highlightedFactor,
      setAnalyzeViewMode: (m: 'map' | 'findings') => {
        _analyzeViewMode = m;
      },
    };
    return selector(state);
  };
  // Expose getState for imperative calls inside the component
  usePanelsStore.getState = () => ({
    analyzeViewMode: _analyzeViewMode,
    highlightedFactor: _highlightedFactor,
    setAnalyzeViewMode: (m: 'map' | 'findings') => {
      _analyzeViewMode = m;
    },
    showExplore: vi.fn(),
    showCharter: showCharterMock,
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
  useAnalyzeFeatureStore: {
    getState: () => ({ expandToQuestion: vi.fn() }),
  },
}));

vi.mock('../../../features/ai/aiStore', () => ({
  useAIStore: {
    getState: () => ({ syncFactorMetadata: vi.fn() }),
  },
}));

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    createFinding: actual.createFinding,
    createHypothesis: actual.createHypothesis,
    computeMainEffects: () => null,
    computeInteractionEffects: () => null,
    // excludeYDerivedFactors used in handleSeedFromFactorIntel (ER-2); explicit
    // inline implementation because the `...actual` spread may not carry deep
    // re-exports under the test mock runtime (same note as
    // categoricalFiltersToActiveFilters below). Logic: drop outcome + _bin cols.
    excludeYDerivedFactors: (factors: string[], outcome: string, _bindings?: unknown[]) =>
      factors.filter(f => f !== outcome && f !== `${outcome}_bin`),
    inferCharacteristicType: () => 'continuous',
    // Provide categoricalFiltersToActiveFilters explicitly — the `...actual`
    // spread sometimes doesn't carry deep re-exports under the test mock runtime.
    categoricalFiltersToActiveFilters: (
      filters: Array<{ column: string; values: (string | number)[] }>
    ) => {
      const map: Record<string, (string | number)[]> = {};
      for (const f of filters) {
        if (f.values.length > 0) map[f.column] = [...f.values];
      }
      return map;
    },
    // ScopeRail (mounted by AnalyzeWorkspace) consumes formatConditionLeaves —
    // another deep re-export the `...actual` spread can drop under the mock runtime.
    formatConditionLeaves: (predicates: Array<{ column: string; value: unknown }>) =>
      predicates.map(p => `${p.column} = ${String(p.value)}`).join(' ∩ '),
    // The activeScope memo + FE-1 modelBuilderProps need these deep re-exports —
    // explicit per the same drop-under-mock-runtime note above.
    buildConditionFromCategoricalFilters: (
      filters: Array<{ column: string; values: (string | number)[] }>
    ) =>
      filters
        .filter(f => f.values.length > 0)
        .map(f => ({ column: f.column, op: 'eq', value: f.values[0] })),
    predicateSetKey: (predicates: Array<{ column: string; value: unknown }>) =>
      predicates
        .map(p => `${p.column}=${String(p.value)}`)
        .sort()
        .join('|'),
    // syncScopeFromDrill (analyzeStore) calls this on mount when a drill filter +
    // outcome are present; stub it so the effect doesn't throw under the mock.
    createProblemStatementScope: (
      projectId: string,
      outcome: string,
      predicates: Array<{ column: string; value: unknown }> = []
    ) => ({
      id: `scope-${projectId}-${outcome}`,
      projectId,
      outcome,
      predicates,
      deletedAt: null,
      createdAt: 0,
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
  getStrategy: () => ({
    questionStrategy: { evidenceLabel: 'R²' },
  }),
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
  useViewStore,
} from '@variscout/stores';
import type { CapturedModelSnapshot } from '@variscout/ui';
import type { ProblemStatementScope } from '@variscout/core';
import { createFinding, createHypothesis } from '@variscout/core/findings';
import { DEFAULT_PROCESS_HUB_ID } from '@variscout/core/processHub';
import { RETURN_NAVIGATION_STORAGE_KEY } from '@variscout/hooks';
import { usePanelsStore } from '../../../features/panels/panelsStore';
import { AnalyzeWorkspace } from '../AnalyzeWorkspace';

// ── 3. Minimal props factory ───────────────────────────────────────────────

function makeMinimalProps(): React.ComponentProps<typeof AnalyzeWorkspace> {
  const noOp = vi.fn();
  return {
    findingsState: {
      findings: [],
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
    columnAliases: {},
    hypothesesState: {
      hubs: [],
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

describe('AnalyzeWorkspace Wall/Causes/Findings lenses', () => {
  beforeEach(() => {
    // Reset canvasViewportStore to initial state (viewMode = 'wall')
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    // PR-CS-5: clear the focus lens so pan-on-focus tests don't leak across cases.
    useViewStore.setState(
      (useViewStore as unknown as { getInitialState: () => unknown }).getInitialState() as never
    );
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [] });
    useProjectStore.setState({ outcome: null, factors: [] });
    capturedWallCanvasProps.current = null;
    capturedFindingsLogProps.current = null;
    capturedMapViewProps.current = null;
    window.sessionStorage.clear();
    showCharterMock.mockClear();
  });

  it('lands on Wall by default and omits Evidence Map from the primary controls', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^causes$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^findings$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^map$/i })).toBeNull();
    expect(screen.queryByText('Evidence Map')).toBeNull();
  });

  it('does not mount AnalyzeMapView in the primary Analyze flow', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    expect(screen.queryByTestId('analyze-map-view')).toBeNull();
    expect(capturedMapViewProps.current).toBeNull();
  });

  it('switches to Wall on click and persists state in the store', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /^wall$/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
  });

  it('switches to Causes, renders the matrix, and row click focuses the Wall card', () => {
    const finding = createFinding('Operator notes night-shift staffing gap', {}, null);
    const hub = {
      ...createHypothesis('Night shift staffing', '', [finding.id]),
      id: 'h-night',
    };
    const props = makeMinimalProps();
    props.findingsState = { ...props.findingsState, findings: [finding] } as never;
    props.hypothesesState = { ...props.hypothesesState, hubs: [hub] } as never;

    render(<AnalyzeWorkspace {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /^causes$/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('causes');
    expect(screen.getByText('1 causes · 0 supported · 0 in flight · 0 stalled · 0 ruled out'));
    expect(screen.getByRole('row', { name: /Night shift staffing/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('row', { name: /Night shift staffing/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
    expect(useViewStore.getState().focusedWallEntityId).toBe('h-night');
  });

  it('routes direct Analyze entry to Wall arrival when findings exist and no hubs exist', () => {
    const props = makeMinimalProps();
    props.findingsState = {
      ...props.findingsState,
      findings: [
        {
          id: 'f-arrival',
          text: 'obs 32-58 elevated',
          evidenceType: 'data',
          createdAt: 1,
          deletedAt: null,
          context: { activeFilters: {}, cumulativeScope: null },
          status: 'observed',
          comments: [],
          statusChangedAt: 1,
        },
      ],
    } as never;
    props.hypothesesState = { ...props.hypothesesState, hubs: [] } as never;

    render(<AnalyzeWorkspace {...props} />);

    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
    expect(screen.getByRole('button', { name: /^wall$/i }).getAttribute('aria-pressed')).toBe(
      'true'
    );
  });

  it('treats a persisted map mode as Wall arrival in primary Analyze', () => {
    const props = makeMinimalProps();
    props.findingsState = {
      ...props.findingsState,
      findings: [
        {
          id: 'f-arrival',
          text: 'obs 32-58 elevated',
          evidenceType: 'data',
          createdAt: 1,
          deletedAt: null,
          context: { activeFilters: {}, cumulativeScope: null },
          status: 'observed',
          comments: [],
          statusChangedAt: 1,
        },
      ],
    } as never;
    props.hypothesesState = { ...props.hypothesesState, hubs: [] } as never;
    useCanvasViewportStore.getState().setViewMode('map');

    render(<AnalyzeWorkspace {...props} />);

    expect(screen.getByTestId('analyze-wall-canvas-shell')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^map$/i })).toBeNull();
    expect(screen.queryByTestId('analyze-map-view')).toBeNull();
  });

  it('Wall button shows aria-pressed="true" after click', () => {
    // Pre-set the store to 'wall' to simulate a persisted state
    useCanvasViewportStore.getState().setViewMode('wall');

    render(<AnalyzeWorkspace {...makeMinimalProps()} />);

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders the WallCanvas for a chart-first investigation without a process map', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    const props = makeMinimalProps();
    props.hypothesesState.hubs = [
      {
        id: 'hub-1',
        name: 'Nozzle heat drift',
        synthesis: '',
        questionIds: [],
        findingIds: [],
        status: 'proposed',
        createdAt: '',
        updatedAt: '',
      },
    ] as never;

    render(<AnalyzeWorkspace {...props} />);

    expect(screen.getByTestId('wall-canvas')).toBeInTheDocument();
  });

  it('renders the canvas-first Wall shell with the overall problem header', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    const props = makeMinimalProps();
    props.hypothesesState.hubs = [
      {
        id: 'hub-1',
        name: 'Nozzle heat drift',
        synthesis: '',
        questionIds: [],
        findingIds: [],
        status: 'proposed',
        createdAt: '',
        updatedAt: '',
      },
    ] as never;

    render(<AnalyzeWorkspace {...props} />);

    expect(screen.getByTestId('overall-problem-header')).toBeInTheDocument();
    expect(screen.getByTestId('analyze-wall-canvas-shell')).toBeInTheDocument();
    expect(screen.getByTestId('analyze-wall-floating-controls')).toBeInTheDocument();
    expect(screen.queryByTestId('analyze-left-conclusion-rail')).not.toBeInTheDocument();
  });

  it('opens the object detail drawer when a Wall cause is selected', () => {
    const finding = createFinding('Temperature spike on night shift', {}, null);
    const hub = {
      ...createHypothesis('Nozzle runs hot', 'Heat aligns with the defect window.', [finding.id]),
      id: 'h-hot',
      comments: [],
    };
    const props = makeMinimalProps();
    props.findingsState = { ...props.findingsState, findings: [finding] } as never;
    props.hypothesesState = {
      ...props.hypothesesState,
      hubs: [hub],
      addComment: vi.fn(),
      editComment: vi.fn(),
      deleteComment: vi.fn(),
    } as never;

    render(<AnalyzeWorkspace {...props} />);
    fireEvent.click(screen.getByTestId('mock-wall-select-h-hot'));

    expect(screen.getByTestId('object-detail-drawer')).toHaveTextContent('Suspected cause');
    expect(screen.getByTestId('object-detail-title')).toHaveTextContent('Nozzle runs hot');
    expect(screen.getByRole('tab', { name: 'Evidence' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Comments' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
  });

  it('reports selected Wall object context to the shell CoScout bridge', () => {
    const finding = createFinding('Temperature spike on night shift', {}, null);
    const hub = {
      ...createHypothesis('Nozzle runs hot', 'Heat aligns with the defect window.', [finding.id]),
      id: 'h-hot',
      comments: [],
    };
    const props = makeMinimalProps();
    props.findingsState = { ...props.findingsState, findings: [finding] } as never;
    props.hypothesesState = {
      ...props.hypothesesState,
      hubs: [hub],
      addComment: vi.fn(),
      editComment: vi.fn(),
      deleteComment: vi.fn(),
    } as never;
    const onCoScoutObjectChange = vi.fn();

    render(<AnalyzeWorkspace {...props} onCoScoutObjectChange={onCoScoutObjectChange} />);
    fireEvent.click(screen.getByTestId('mock-wall-select-h-hot'));

    expect(onCoScoutObjectChange).toHaveBeenLastCalledWith({
      kind: 'cause',
      id: 'h-hot',
      label: 'Nozzle runs hot',
    });
  });

  it('filters Wall findings to the active scope while leaving other scope findings out', () => {
    useProjectStore.setState({ outcome: 'Fill Weight' });
    useAnalyzeStore.setState({
      scopes: [
        {
          id: 'scope-night',
          projectId: 'general-unassigned',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
          hypothesisIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
    });
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Shift', values: ['Night'] }],
    });
    const props = makeMinimalProps();
    props.findingsState = {
      ...props.findingsState,
      findings: [
        { ...createFinding('Night shift note', {}, null), id: 'f-night', scopeId: 'scope-night' },
        { ...createFinding('Day shift note', {}, null), id: 'f-day', scopeId: 'scope-day' },
        { ...createFinding('Loose note', {}, null), id: 'f-loose' },
      ],
    } as never;
    props.hypothesesState.hubs = [
      {
        id: 'hub-1',
        name: 'Existing',
        synthesis: '',
        findingIds: [],
        status: 'proposed',
        createdAt: '',
        updatedAt: '',
      },
    ] as never;

    render(<AnalyzeWorkspace {...props} />);

    expect(
      (capturedWallCanvasProps.current?.findings as Array<{ id: string }>).map(f => f.id)
    ).toEqual(['f-night']);
  });

  it('passes all Wall findings when no active scope is selected, including loose findings', () => {
    const props = makeMinimalProps();
    props.findingsState = {
      ...props.findingsState,
      findings: [
        { ...createFinding('Night shift note', {}, null), id: 'f-night', scopeId: 'scope-night' },
        { ...createFinding('Day shift note', {}, null), id: 'f-day', scopeId: 'scope-day' },
        { ...createFinding('Loose note', {}, null), id: 'f-loose' },
      ],
    } as never;
    props.hypothesesState.hubs = [
      {
        id: 'hub-1',
        name: 'Existing',
        synthesis: '',
        findingIds: [],
        status: 'proposed',
        createdAt: '',
        updatedAt: '',
      },
    ] as never;

    render(<AnalyzeWorkspace {...props} />);

    expect(
      (capturedWallCanvasProps.current?.findings as Array<{ id: string }>).map(f => f.id)
    ).toEqual(['f-night', 'f-day', 'f-loose']);
  });

  it('PR-CS-5: pans the Wall viewport to center the focused hypothesis on arrival', () => {
    // Arrive on the Wall with a focus lens set (as a Process-tab hypothesis link does).
    useCanvasViewportStore.getState().setViewMode('wall');
    useViewStore.getState().setFocusedWallEntity('hub-1');
    const props = makeMinimalProps();
    props.hypothesesState.hubs = [
      {
        id: 'hub-1',
        name: 'Nozzle heat drift',
        synthesis: '',
        questionIds: [],
        findingIds: [],
        status: 'proposed',
        createdAt: '',
        updatedAt: '',
      },
    ] as never;

    render(<AnalyzeWorkspace {...props} />);

    // The pan-on-focus effect centered the node — the viewport pan is now a
    // non-origin offset derived from computeWallLayout's hub position.
    const pan = useCanvasViewportStore.getState().viewports[DEFAULT_PROCESS_HUB_ID]?.pan;
    expect(pan).toBeDefined();
    expect(pan).not.toEqual({ x: 0, y: 0 });
  });

  it('PR-CS-5: does NOT pan when the Wall is not the active view (focus set in Causes mode)', () => {
    useCanvasViewportStore.getState().setViewMode('causes');
    useViewStore.getState().setFocusedWallEntity('hub-1');
    const props = makeMinimalProps();
    props.hypothesesState.hubs = [
      {
        id: 'hub-1',
        name: 'Nozzle heat drift',
        synthesis: '',
        questionIds: [],
        findingIds: [],
        status: 'proposed',
        createdAt: '',
        updatedAt: '',
      },
    ] as never;

    render(<AnalyzeWorkspace {...props} />);

    // No pan write while the Wall is hidden — the viewport entry is untouched.
    const pan = useCanvasViewportStore.getState().viewports[DEFAULT_PROCESS_HUB_ID]?.pan;
    expect(pan).toBeUndefined();
  });

  it('returns from Wall to the saved Improvement Project target once', () => {
    window.sessionStorage.setItem(
      RETURN_NAVIGATION_STORAGE_KEY,
      JSON.stringify({
        sourceSurface: 'improvement-project',
        params: { projectId: 'ip-1' },
        scrollPosition: { x: 0, y: 0 },
        uiState: { section: 'lineage' },
      })
    );

    render(<AnalyzeWorkspace {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Project' }));

    expect(showCharterMock).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY)).toBeNull();
  });

  describe('planningProps pass-through', () => {
    beforeEach(() => {
      capturedWallCanvasProps.current = null;
      useCanvasViewportStore.getState().setViewMode('wall');
    });

    it('threads planningProps through to WallCanvas when provided', () => {
      const onAddPlan = vi.fn();
      const onLinkFinding = vi.fn();
      const onEditPlan = vi.fn();

      render(
        <AnalyzeWorkspace
          {...makeMinimalProps()}
          planningProps={{
            plans: [],
            members: [],
            currentUserId: 'user@contoso.com',
            onAddPlan,
            onLinkFinding,
            onEditPlan,
          }}
        />
      );

      expect(capturedWallCanvasProps.current?.planningProps).toBeDefined();
      const pp = capturedWallCanvasProps.current?.planningProps as Record<string, unknown>;
      expect(pp.currentUserId).toBe('user@contoso.com');
      expect(pp.onAddPlan).toBe(onAddPlan);
      expect(pp.onLinkFinding).toBe(onLinkFinding);
      expect(pp.onEditPlan).toBe(onEditPlan);
    });

    it('does not pass planningProps to WallCanvas when omitted', () => {
      render(<AnalyzeWorkspace {...makeMinimalProps()} />);
      expect(capturedWallCanvasProps.current?.planningProps).toBeUndefined();
    });
  });

  // FSJ-8 — propose-hypothesis app wiring. The Azure Wall renders
  // `hypothesesState.hubs` (the useHypotheses hook), so the app MUST route the
  // named promotion through createHub + connectFinding on that hook. This
  // asserts the wired path; the render-through is proven by
  // WallCanvas.proposeHypothesis.seam.test.tsx.
  describe('propose-hypothesis app wiring', () => {
    beforeEach(() => {
      capturedWallCanvasProps.current = null;
      useCanvasViewportStore.getState().setViewMode('wall');
    });

    it('forwards onProposeHypothesis to WallCanvas', () => {
      const props = makeMinimalProps();
      props.hypothesesState.hubs = [
        {
          id: 'hub-1',
          name: 'Existing',
          synthesis: '',
          findingIds: [],
          status: 'proposed',
          createdAt: '',
          updatedAt: '',
        },
      ] as never;
      render(<AnalyzeWorkspace {...props} />);
      expect(capturedWallCanvasProps.current?.onProposeHypothesis).toBeTypeOf('function');
    });

    it('firing it creates + connects through hypothesesState (the rendered-hubs path), not a bare store call', () => {
      const createHub = vi.fn(() => ({ id: 'hub-new' }) as never);
      const connectFinding = vi.fn();
      const props = makeMinimalProps();
      props.hypothesesState = {
        ...props.hypothesesState,
        createHub,
        connectFinding,
        hubs: [
          {
            id: 'hub-1',
            name: 'Existing',
            synthesis: '',
            findingIds: [],
            status: 'proposed',
            createdAt: '',
            updatedAt: '',
          },
        ],
      } as never;
      props.findingsState = {
        ...props.findingsState,
        findings: [
          {
            id: 'f-orphan',
            text: 'Coolant temp creeps',
            evidenceType: 'data',
            createdAt: 1,
            deletedAt: null,
            context: { activeFilters: {}, cumulativeScope: null },
            status: 'observed',
            comments: [],
            statusChangedAt: 1,
          },
        ],
      } as never;

      render(<AnalyzeWorkspace {...props} />);

      const onProposeHypothesis = capturedWallCanvasProps.current!.onProposeHypothesis as (
        findingId: string,
        name: string
      ) => void;
      onProposeHypothesis('f-orphan', 'Coolant recirculation lag');

      // Routes through the useHypotheses hook (the Wall's source of truth).
      expect(createHub).toHaveBeenCalledTimes(1);
      expect((createHub.mock.calls[0] as unknown[])[0]).toBe('Coolant recirculation lag');
      expect(connectFinding).toHaveBeenCalledWith('hub-new', 'f-orphan');
    });
  });

  describe('canAccess photo gate (2-tier ACL — photos are contributions)', () => {
    const makeMember = (userId: string, role: 'lead' | 'member' | 'sponsor') => ({
      id: `pm-${userId}`,
      createdAt: 1,
      deletedAt: null,
      userId,
      displayName: userId,
      role,
      invitedAt: 1,
    });

    beforeEach(() => {
      capturedFindingsLogProps.current = null;
      // Switch to 'findings' view so FindingsLog renders (not AnalyzeMapView)
      usePanelsStore.getState().setAnalyzeViewMode('findings');
    });

    it('Lead member receives onAddPhoto when handleAddPhoto is provided', () => {
      const handleAddPhoto = vi.fn();
      const props = makeMinimalProps();
      render(
        <AnalyzeWorkspace
          {...props}
          handleAddPhoto={handleAddPhoto}
          userId="lead@org"
          members={[makeMember('lead@org', 'lead')]}
        />
      );
      expect(capturedFindingsLogProps.current?.onAddPhoto).toBeDefined();
    });

    it('Sponsor member receives onAddPhoto — photos are contributions per 2-tier ACL', () => {
      const handleAddPhoto = vi.fn();
      const props = makeMinimalProps();
      render(
        <AnalyzeWorkspace
          {...props}
          handleAddPhoto={handleAddPhoto}
          userId="sponsor@org"
          members={[makeMember('sponsor@org', 'sponsor')]}
        />
      );
      expect(capturedFindingsLogProps.current?.onAddPhoto).toBeDefined();
    });

    it('Non-member receives onAddPhoto=undefined (no canAccess permission)', () => {
      const handleAddPhoto = vi.fn();
      const props = makeMinimalProps();
      render(
        <AnalyzeWorkspace
          {...props}
          handleAddPhoto={handleAddPhoto}
          userId="stranger@org"
          members={[makeMember('lead@org', 'lead')]}
        />
      );
      expect(capturedFindingsLogProps.current?.onAddPhoto).toBeUndefined();
    });

    it('null userId always yields onAddPhoto=undefined', () => {
      const handleAddPhoto = vi.fn();
      const props = makeMinimalProps();
      render(
        <AnalyzeWorkspace
          {...props}
          handleAddPhoto={handleAddPhoto}
          userId={null}
          members={[makeMember('lead@org', 'lead')]}
        />
      );
      expect(capturedFindingsLogProps.current?.onAddPhoto).toBeUndefined();
    });

    it('empty members array (quick-analysis flow) receives onAddPhoto regardless of role check', () => {
      const handleAddPhoto = vi.fn();
      const props = makeMinimalProps();
      render(
        <AnalyzeWorkspace
          {...props}
          handleAddPhoto={handleAddPhoto}
          userId="any@org"
          members={[]}
        />
      );
      expect(capturedFindingsLogProps.current?.onAddPhoto).toBeDefined();
    });

    it('passes only active-scope findings into FindingsLog', () => {
      useProjectStore.setState({ outcome: 'Fill Weight' });
      useAnalyzeStore.setState({
        scopes: [
          {
            id: 'scope-night',
            projectId: 'general-unassigned',
            outcome: 'Fill Weight',
            predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
            hypothesisIds: [],
            createdAt: 1,
            updatedAt: 1,
            deletedAt: null,
          },
        ],
      });
      useAnalysisScopeStore.setState({
        categoricalFilters: [{ column: 'Shift', values: ['Night'] }],
      });
      const props = makeMinimalProps();
      props.findingsState = {
        ...props.findingsState,
        findings: [
          { ...createFinding('Night shift note', {}, null), id: 'f-night', scopeId: 'scope-night' },
          { ...createFinding('Loose note', {}, null), id: 'f-loose' },
        ],
      } as never;

      render(<AnalyzeWorkspace {...props} />);

      expect(
        (capturedFindingsLogProps.current?.findings as Array<{ id: string }>).map(f => f.id)
      ).toEqual(['f-night']);
    });
  });

  describe('Evidence Map demotion (AW-4)', () => {
    beforeEach(() => {
      capturedMapViewProps.current = null;
      useCanvasViewportStore.setState(getCanvasViewportInitialState());
      usePanelsStore.getState().setAnalyzeViewMode('map');
      useAnalysisScopeStore.setState({ categoricalFilters: [] });
      useAnalyzeStore.setState({ scopes: [] });
      useProjectStore.setState({ outcome: null });
    });

    it('does not expose Evidence Map capture callbacks from primary Analyze', () => {
      const addFinding = vi.fn(() => ({ id: 'f-new' }) as never);
      const props = makeMinimalProps();
      props.findingsState = { ...props.findingsState, addFinding } as never;

      render(<AnalyzeWorkspace {...props} />);

      expect(screen.queryByTestId('analyze-map-view')).toBeNull();
      expect(capturedMapViewProps.current).toBeNull();
      expect(addFinding).not.toHaveBeenCalled();
    });
  });
});

// ── AW-6 — current scope switcher seam (production mount in AnalyzeWorkspace) ───
//
// NOT an injected-prop ScopeRail unit test — renders the real AnalyzeWorkspace
// (ScopeRail is preserved via `...actual` in the @variscout/ui mock; WallCanvas
// is stubbed) and asserts the switcher RENDERS from useAnalyzeStore.scopes and
// that selecting a chip RE-ANCHORS by rewriting analysisScopeStore.categoricalFilters
// (which IM-4a's producer consumes to re-select the active scope / Problem card),
// and archiving soft-deletes via analyzeStore.archiveScope.

describe('AnalyzeWorkspace current scope switcher seam (AW-6)', () => {
  const SCOPE_INV = 'general-unassigned'; // matches AnalyzeWorkspace.scopeProjectId

  const scopeA: ProblemStatementScope = {
    id: 'scope-a',
    projectId: SCOPE_INV,
    outcome: 'Fill Weight',
    predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' }],
    hypothesisIds: [],
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  };
  const scopeB: ProblemStatementScope = {
    id: 'scope-b',
    projectId: SCOPE_INV,
    outcome: 'Fill Weight',
    predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
    hypothesisIds: [],
    createdAt: 2,
    updatedAt: 2,
    deletedAt: null,
  };

  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [scopeA, scopeB] });
  });

  it('renders one ScopeRail chip per active (non-archived) scope', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    expect(screen.getByTestId('scope-chip-scope-a')).toBeInTheDocument();
    expect(screen.getByTestId('scope-chip-scope-b')).toBeInTheDocument();
    expect(screen.getByTestId('scope-chip-scope-a')).toHaveTextContent('Machine = B');
  });

  it('renders the active scope as the current scope switcher anchor', () => {
    useProjectStore.setState({ outcome: 'Fill Weight' });
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Machine', values: ['B'] }],
    });

    render(<AnalyzeWorkspace {...makeMinimalProps()} />);

    expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Current scope');
    expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Machine = B');
    expect(screen.getByTestId('scope-switcher')).toHaveTextContent('2 scopes');
  });

  it('does NOT render the switcher when no scopes are captured', () => {
    useAnalyzeStore.setState({ scopes: [] });
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    expect(screen.queryByTestId(/scope-chip-/)).toBeNull();
  });

  it('selecting a chip re-anchors by rewriting analysisScopeStore.categoricalFilters', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    // No drill filters before selection.
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);

    fireEvent.click(screen.getByTestId('scope-chip-scope-b'));

    // The Problem card re-anchors because the drill filters now equal scope-b's
    // compound WHERE (Shift = Night) — IM-4a's producer matches by predicateSetKey.
    const filters = useAnalysisScopeStore.getState().categoricalFilters;
    expect(filters).toEqual([{ column: 'Shift', values: ['Night'] }]);
  });

  it('archiving a chip soft-deletes the scope via analyzeStore.archiveScope', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    fireEvent.click(screen.getByTestId('scope-archive-scope-a'));

    const archived = useAnalyzeStore.getState().scopes.find(s => s.id === 'scope-a');
    expect(archived?.deletedAt).not.toBeNull();
  });
});

// ER-3 (was FE-1) — the model surface is now the screen-space ModelDrawerBase,
// mounted by AnalyzeWorkspace as a sibling of WallCanvas. Both WallCanvas and
// ModelDrawerBase are mocked here, so we assert the APP-OWNED seam: AnalyzeWorkspace
// feeds the drawer rows/outcome/candidateFactors/scopeLabel/constantFactors from
// the project store + active scope, threads the toggle via WallCanvas.onOpenModelDrawer,
// and routes onCaptureModel to a Finding carrying the model snapshot in its
// projection.modelContext. A dead app wiring (no drawer props, or capture not routed
// to findingsState) fails these.
describe('AnalyzeWorkspace — model drawer wiring (ER-3)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [] });
    useProjectStore.setState({ outcome: 'Y', factors: ['Shift', 'Noise'] });
    capturedWallCanvasProps.current = null;
    capturedModelDrawerProps.current = null;
  });

  it('mounts the model drawer with candidateFactors + scopeLabel + outcome + onCaptureModel', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    const dp = capturedModelDrawerProps.current as Record<string, unknown> | null;
    expect(dp).not.toBeNull();
    expect(dp!.candidateFactors).toEqual(['Shift', 'Noise']);
    expect(dp!.scopeLabel).toBe('All data');
    expect(dp!.outcome).toBe('Y');
    expect(typeof dp!.onCaptureModel).toBe('function');
    expect(typeof dp!.onModelStats).toBe('function');
  });

  it('threads the candidate-factor band + a live onOpenModelDrawer toggle to WallCanvas', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    const mbp = capturedWallCanvasProps.current?.modelBuilderProps as
      | Record<string, unknown>
      | undefined;
    expect(mbp).toBeDefined();
    expect(mbp!.candidateFactors).toEqual(['Shift', 'Noise']);
    // The toggle is wired (never a dead control) — opening routes to the drawer.
    expect(typeof capturedWallCanvasProps.current?.onOpenModelDrawer).toBe('function');
  });

  it('does NOT mount the drawer / thread the band when no outcome is set', () => {
    useProjectStore.setState({ outcome: null, factors: ['Shift'] });
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    expect(capturedModelDrawerProps.current).toBeNull();
    expect(capturedWallCanvasProps.current?.modelBuilderProps).toBeUndefined();
    expect(capturedWallCanvasProps.current?.onOpenModelDrawer).toBeUndefined();
  });

  it('chips a single-value drill factor as constant in scope (on the drawer)', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Shift', values: ['A'] }],
    });
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    const dp = capturedModelDrawerProps.current as Record<string, unknown>;
    expect(dp.constantFactors).toEqual(['Shift']);
  });

  it('onCaptureModel creates a Finding + stamps the model snapshot into its projection.modelContext', () => {
    const addFinding = vi.fn(() => ({ id: 'f-model', text: '' }) as never);
    const setProjection = vi.fn();
    const props = makeMinimalProps();
    props.findingsState = { ...props.findingsState, addFinding, setProjection } as never;

    render(<AnalyzeWorkspace {...props} />);
    const onCaptureModel = (capturedModelDrawerProps.current as Record<string, unknown>)
      .onCaptureModel as (s: CapturedModelSnapshot) => void;

    onCaptureModel({
      factors: ['Shift'],
      rSquaredAdj: 0.68,
      perFactorP: { Shift: 0.001 },
      scopeLabel: 'All data',
      topFactor: 'Shift',
    });

    expect(addFinding).toHaveBeenCalledTimes(1);
    expect(setProjection).toHaveBeenCalledTimes(1);
    const [, projection] = setProjection.mock.calls[0] as [
      string,
      { modelContext?: Record<string, unknown> },
    ];
    expect(projection.modelContext?.rSquaredAdj).toBeCloseTo(0.68, 10);
    expect(projection.modelContext?.linkedFactor).toBe('Shift');
    expect(projection.modelContext?.scopeLabel).toBe('All data');
  });
});

// Wall empty-state CTA wiring (Bug 2 — investigations.md 2026-06-04).
// The CTAs were never passed to the destination WallCanvas mount; only the
// retired CanvasWallOverlay ever wired them. These tests assert the seam:
// AnalyzeWorkspace → WallCanvas → (mock) CTA buttons create hubs.
describe('AnalyzeWorkspace — Wall empty-state CTA wiring (Bug 2)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [] });
    capturedWallCanvasProps.current = null;
  });

  it('(a) zero hubs — clicking "Add a suspected cause" creates one hub named "New suspected cause"', () => {
    const createHub = vi.fn(() => ({ id: 'hub-write' }) as never);
    const props = makeMinimalProps();
    props.hypothesesState = { ...props.hypothesesState, createHub, hubs: [] } as never;

    render(<AnalyzeWorkspace {...props} />);

    // The empty-state renders because hubs.length === 0
    fireEvent.click(screen.getByTestId('empty-write-hypothesis'));

    expect(createHub).toHaveBeenCalledTimes(1);
    expect((createHub.mock.calls[0] as unknown[])[0]).toBe('New suspected cause');
  });

  it('(b) zero hubs + factors — clicking "Seed 3 largest contributors" creates min(3, factors) hubs (fallback order when filteredData is empty)', () => {
    const createHub = vi.fn(() => ({ id: 'hub-seed' }) as never);
    const props = makeMinimalProps();
    props.hypothesesState = { ...props.hypothesesState, createHub, hubs: [] } as never;
    // Set 2 factors in the project store — seed should create 2 (min(3, 2)) hubs
    useProjectStore.setState({ outcome: 'Y', factors: ['Shift', 'Machine'] });

    render(<AnalyzeWorkspace {...props} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    expect(createHub).toHaveBeenCalledTimes(2);
    expect((createHub.mock.calls[0] as unknown[])[0]).toBe('Suspected cause: Shift');
    expect((createHub.mock.calls[1] as unknown[])[0]).toBe('Suspected cause: Machine');
  });

  it('(c) NEGATIVE CONTROL — zero candidate factors → Seed button NOT in document', () => {
    // LOAD-BEARING: fails if onSeedFromFactorIntel gating is dropped
    const props = makeMinimalProps();
    props.hypothesesState = { ...props.hypothesesState, hubs: [] } as never;
    // factors defaults to [] in the project store
    useProjectStore.setState({ outcome: null, factors: [] });

    render(<AnalyzeWorkspace {...props} />);

    expect(screen.queryByTestId('empty-seed-factors')).toBeNull();
  });
});

describe('AnalyzeWorkspace — Wall factor exploration seam (CS-13)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    capturedMapViewProps.current = null;
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [] });
    useProjectStore.setState({ outcome: null });
  });

  it('keeps Evidence Map drill authoring parked outside primary Analyze', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    expect(screen.queryByTestId('analyze-map-view')).toBeNull();
    expect(capturedMapViewProps.current).toBeNull();
  });

  it('mounts WallCanvas with the onExploreFactor wire (CS-13)', () => {
    // Render in wall mode — mirrors the onProposeHypothesis assertion pattern (~line 521).
    useCanvasViewportStore.getState().setViewMode('wall');
    const props = makeMinimalProps();
    props.hypothesesState.hubs = [
      {
        id: 'hub-1',
        name: 'Existing',
        synthesis: '',
        findingIds: [],
        status: 'proposed',
        createdAt: '',
        updatedAt: '',
      },
    ] as never;
    capturedWallCanvasProps.current = null;
    render(<AnalyzeWorkspace {...props} />);
    // The `as` re-widens — tsc otherwise narrows `current` to null at the reset
    // above (render()'s mutation is opaque to control-flow analysis).
    const wallProps = capturedWallCanvasProps.current as Record<string, unknown> | null;
    expect(wallProps?.onExploreFactor).toBeTypeOf('function');
  });
});
