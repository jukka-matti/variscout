/**
 * Tests for Map/Wall toggle wired into AnalyzeWorkspace.
 *
 * Strategy:
 * - Heavy dependencies (charts, hooks, feature stores) are mocked so we can
 *   render AnalyzeWorkspace in isolation without providing the full
 *   orchestration props tree.
 * - useCanvasViewportStore is NOT mocked — we use the real store and reset it in
 *   beforeEach per the Zustand testing pattern in .claude/rules/testing.md.
 * - panelsStore is NOT mocked — we toggle analyzeViewMode to 'map' in
 *   beforeEach so the Evidence Map tab is the active view.
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
    AnalyzePhaseBadge: () => null,
    AnalyzeConclusion: () => null,
    FindingsLog: (props: Record<string, unknown>) => {
      capturedFindingsLogProps.current = props;
      return <div data-testid="findings-log" />;
    },
    QuestionLinkPrompt: () => null,
    useWallIsMobile: () => false,
    WallCanvas: (props: {
      hubs: unknown[];
      planningProps?: Record<string, unknown>;
      onWriteHypothesis?: () => void;
      onSeedFromFactorIntel?: () => void;
    }) => {
      capturedWallCanvasProps.current = props as Record<string, unknown>;
      return props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" data-has-process-map={String('processMap' in props)} />
      ) : (
        <div data-testid="wall-canvas-empty" data-has-process-map={String('processMap' in props)}>
          {props.onWriteHypothesis && (
            <button data-testid="empty-write-hypothesis" onClick={props.onWriteHypothesis}>
              Write a suspected mechanism
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
  };
});

vi.mock('../AnalyzeMapView', () => ({
  AnalyzeMapView: (props: Record<string, unknown>) => {
    capturedMapViewProps.current = props;
    return <div data-testid="analyze-map-view" />;
  },
}));

vi.mock('../CoScoutSection', () => ({
  CoScoutSection: () => <div data-testid="coscout-section" />,
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
    computeMainEffects: () => null,
    computeInteractionEffects: () => null,
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

vi.mock('@variscout/core/findings', () => ({
  detectEvidenceClusters: () => [],
}));

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
    aiOrch: {
      handleAskCoScoutFromCategory: noOp,
    } as never,
    actionProposalsState: {} as never,
    handleSearchKnowledge: noOp,
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

describe('AnalyzeWorkspace Map/Wall toggle', () => {
  beforeEach(() => {
    // Reset canvasViewportStore to initial state (viewMode = 'map')
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    // PR-CS-5: clear the focus lens so pan-on-focus tests don't leak across cases.
    useViewStore.setState(
      (useViewStore as unknown as { getInitialState: () => unknown }).getInitialState() as never
    );
    window.sessionStorage.clear();
    showCharterMock.mockClear();
  });

  it('defaults to Map view — Map button has aria-pressed="true"', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);

    const mapBtn = screen.getByRole('button', { name: /^map$/i });
    expect(mapBtn.getAttribute('aria-pressed')).toBe('true');

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders AnalyzeMapView by default', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    expect(screen.getByTestId('analyze-map-view')).toBeTruthy();
  });

  it('switches to Wall on click and persists state in the store', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /^wall$/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
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

  it('does not force Wall again after the analyst manually toggles back to Map', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /^map$/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
    expect(screen.getByRole('button', { name: /^map$/i }).getAttribute('aria-pressed')).toBe(
      'true'
    );
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

  it('PR-CS-5: does NOT pan when the Wall is not the active view (focus set in Map mode)', () => {
    // viewMode stays 'map' (default). Focus is set but the Wall is invisible.
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
  });

  describe('capture-as-finding: addFinding called with drill-snapshot activeFilters', () => {
    /**
     * IM-4a adversarial review — Capture-as-Finding app assertion.
     *
     * `handleMapCreateFinding` in AnalyzeWorkspace must snapshot the DRILL
     * condition (analysisScopeStore.categoricalFilters) at capture time, NOT
     * the legacy projectStore.filters map. This test seeds a drill chip, then
     * triggers `onCreateFinding` via the AnalyzeMapView prop, and asserts that
     * `findingsState.addFinding` was called with `context.activeFilters`
     * matching the drill snapshot.
     */
    beforeEach(() => {
      capturedMapViewProps.current = null;
      // Ensure we're on Map view (default) so AnalyzeMapView renders.
      // Reset wallViewMode to 'map' (not 'wall') so the map branch renders.
      useCanvasViewportStore.setState(getCanvasViewportInitialState());
      // Reset panelsStore analyzeViewMode to 'map' — canAccess photo gate tests
      // set it to 'findings' and the mock variable persists across describe blocks.
      usePanelsStore.getState().setAnalyzeViewMode('map');
      // Reset analysisScopeStore to empty state
      useAnalysisScopeStore.setState({ categoricalFilters: [] });
      // Task-7 isolation: clear any scopes / outcome leaked from prior describe blocks.
      useAnalyzeStore.setState({ scopes: [] });
      useProjectStore.setState({ outcome: null });
    });

    it('seeds activeFilters from analysisScopeStore.categoricalFilters at capture time', () => {
      const addFinding = vi.fn(() => ({ id: 'f-new' }) as never);
      const props = makeMinimalProps();
      props.findingsState = { ...props.findingsState, addFinding } as never;

      // Seed a drill chip: column 'Machine', value 'A'
      useAnalysisScopeStore.getState().addCategoricalValue('Machine', 'A');

      render(<AnalyzeWorkspace {...props} />);

      // AnalyzeMapView should have received onCreateFinding
      expect(capturedMapViewProps.current?.onCreateFinding).toBeDefined();

      // Fire the callback as if Evidence Map triggered it for factor 'Machine'
      const onCreateFinding = capturedMapViewProps.current!.onCreateFinding as (
        factor: string
      ) => void;
      onCreateFinding('Machine');

      expect(addFinding).toHaveBeenCalledTimes(1);
      const callArgs = addFinding.mock.calls[0] as unknown as [
        unknown,
        { activeFilters: Record<string, string[]> },
        unknown,
      ];
      // The captured activeFilters must reflect the drill chip (Machine=A),
      // not the legacy projectStore.filters map (which is empty in this test).
      expect(callArgs[1].activeFilters).toEqual({ Machine: ['A'] });
    });

    it('passes empty activeFilters when no drill chips are set', () => {
      const addFinding = vi.fn(() => ({ id: 'f-new' }) as never);
      const props = makeMinimalProps();
      props.findingsState = { ...props.findingsState, addFinding } as never;

      render(<AnalyzeWorkspace {...props} />);

      const onCreateFinding = capturedMapViewProps.current!.onCreateFinding as (
        factor: string
      ) => void;
      onCreateFinding('Temperature');

      expect(addFinding).toHaveBeenCalledTimes(1);
      const callArgs = addFinding.mock.calls[0] as unknown as [
        unknown,
        { activeFilters: Record<string, string[]> },
        unknown,
      ];
      expect(callArgs[1].activeFilters).toEqual({});
    });

    // PR-CS-0 Task 7 — durable finding→scope edge. When a drill materializes a
    // ProblemStatementScope in useAnalyzeStore.scopes whose WHERE matches the
    // active drill chips, the captured Finding must carry that scope's id as the
    // 4th addFinding arg (the durable scopeId FK), not just the display filters.
    it('passes the active scope id as scopeId when the drill matches a materialized scope', () => {
      const addFinding = vi.fn(() => ({ id: 'f-scoped' }) as never);
      const props = makeMinimalProps();
      props.findingsState = { ...props.findingsState, addFinding } as never;

      // Outcome must be set for the activeScope memo to engage.
      useProjectStore.setState({ outcome: 'Fill Weight' });
      // Seed a drill chip (Machine=A) — same predicate shape the activeScope memo
      // re-derives via buildConditionFromCategoricalFilters + predicateSetKey.
      useAnalysisScopeStore.getState().addCategoricalValue('Machine', 'A');
      // Materialize the matching scope in the analyze store (projectId
      // 'general-unassigned' === AnalyzeWorkspace.scopeProjectId).
      useAnalyzeStore.setState({
        scopes: [
          {
            id: 'scope-machine-a',
            projectId: 'general-unassigned',
            outcome: 'Fill Weight',
            predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }],
            hypothesisIds: [],
            createdAt: 1,
            updatedAt: 1,
            deletedAt: null,
          },
        ],
      });

      render(<AnalyzeWorkspace {...props} />);

      const onCreateFinding = capturedMapViewProps.current!.onCreateFinding as (
        factor: string
      ) => void;
      onCreateFinding('Machine');

      expect(addFinding).toHaveBeenCalledTimes(1);
      const callArgs = addFinding.mock.calls[0] as unknown as [
        unknown,
        unknown,
        unknown,
        string | undefined,
      ];
      // 4th positional arg is the durable scopeId FK.
      expect(callArgs[3]).toBe('scope-machine-a');
    });

    it('passes scopeId=undefined when the drill matches no materialized scope', () => {
      const addFinding = vi.fn(() => ({ id: 'f-unscoped' }) as never);
      const props = makeMinimalProps();
      props.findingsState = { ...props.findingsState, addFinding } as never;

      // No scopes materialized → activeScope memo resolves undefined.
      render(<AnalyzeWorkspace {...props} />);

      const onCreateFinding = capturedMapViewProps.current!.onCreateFinding as (
        factor: string
      ) => void;
      onCreateFinding('Temperature');

      expect(addFinding).toHaveBeenCalledTimes(1);
      const callArgs = addFinding.mock.calls[0] as unknown as [
        unknown,
        unknown,
        unknown,
        string | undefined,
      ];
      expect(callArgs[3]).toBeUndefined();
    });
  });
});

// ── IM-4b Task 5 — ScopeRail SEAM (production mount in AnalyzeWorkspace) ────────
//
// NOT an injected-prop ScopeRail unit test — renders the real AnalyzeWorkspace
// (ScopeRail is preserved via `...actual` in the @variscout/ui mock; WallCanvas
// is stubbed) and asserts the rail RENDERS from useAnalyzeStore.scopes and that
// selecting a chip RE-ANCHORS by rewriting analysisScopeStore.categoricalFilters
// (which IM-4a's producer consumes to re-select the active scope / Problem card),
// and archiving soft-deletes via analyzeStore.archiveScope.

describe('AnalyzeWorkspace ScopeRail seam (IM-4b Task 5)', () => {
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

  it('does NOT render the rail when no scopes are captured', () => {
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

// FE-1 — the model-builder band is wired through AnalyzeWorkspace into WallCanvas.
// WallCanvas is mocked here (capturedWallCanvasProps), so we assert the APP-OWNED
// seam: AnalyzeWorkspace builds modelBuilderProps from the project store
// (outcome + factors), threads the ACTIVE-scope rows, and that firing
// onCaptureModel creates a Finding carrying the model snapshot in its
// projection.modelContext. A dead app wiring (no modelBuilderProps, or capture
// not routed to findingsState) fails these.
describe('AnalyzeWorkspace — model-builder band wiring (FE-1)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [] });
    useProjectStore.setState({ outcome: 'Y', factors: ['Shift', 'Noise'] });
    capturedWallCanvasProps.current = null;
  });

  it('threads modelBuilderProps (candidateFactors + scopeLabel + onCaptureModel) to WallCanvas', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    const mbp = capturedWallCanvasProps.current?.modelBuilderProps as
      | Record<string, unknown>
      | undefined;
    expect(mbp).toBeDefined();
    expect(mbp!.candidateFactors).toEqual(['Shift', 'Noise']);
    expect(mbp!.scopeLabel).toBe('All data');
    expect(typeof mbp!.onCaptureModel).toBe('function');
  });

  it('does NOT thread modelBuilderProps when no outcome is set', () => {
    useProjectStore.setState({ outcome: null, factors: ['Shift'] });
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    expect(capturedWallCanvasProps.current?.modelBuilderProps).toBeUndefined();
  });

  it('chips a single-value drill factor as constant in scope', () => {
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Shift', values: ['A'] }],
    });
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    const mbp = capturedWallCanvasProps.current?.modelBuilderProps as Record<string, unknown>;
    expect(mbp.constantFactors).toEqual(['Shift']);
  });

  it('onCaptureModel creates a Finding + stamps the model snapshot into its projection.modelContext', () => {
    const addFinding = vi.fn(() => ({ id: 'f-model', text: '' }) as never);
    const setProjection = vi.fn();
    const props = makeMinimalProps();
    props.findingsState = { ...props.findingsState, addFinding, setProjection } as never;

    render(<AnalyzeWorkspace {...props} />);
    const onCaptureModel = (
      capturedWallCanvasProps.current!.modelBuilderProps as Record<string, unknown>
    ).onCaptureModel as (s: CapturedModelSnapshot) => void;

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

  it('(a) zero hubs — clicking "Write a suspected mechanism" creates one hub named "New mechanism branch"', () => {
    const createHub = vi.fn(() => ({ id: 'hub-write' }) as never);
    const props = makeMinimalProps();
    props.hypothesesState = { ...props.hypothesesState, createHub, hubs: [] } as never;

    render(<AnalyzeWorkspace {...props} />);

    // The empty-state renders because hubs.length === 0
    fireEvent.click(screen.getByTestId('empty-write-hypothesis'));

    expect(createHub).toHaveBeenCalledTimes(1);
    expect((createHub.mock.calls[0] as unknown[])[0]).toBe('New mechanism branch');
  });

  it('(b) zero hubs + factors — clicking "Seed 3 from Factor Intelligence" creates min(3, factors) hubs', () => {
    const createHub = vi.fn(() => ({ id: 'hub-seed' }) as never);
    const props = makeMinimalProps();
    props.hypothesesState = { ...props.hypothesesState, createHub, hubs: [] } as never;
    // Set 2 factors in the project store — seed should create 2 (min(3, 2)) hubs
    useProjectStore.setState({ outcome: 'Y', factors: ['Shift', 'Machine'] });

    render(<AnalyzeWorkspace {...props} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    expect(createHub).toHaveBeenCalledTimes(2);
    expect((createHub.mock.calls[0] as unknown[])[0]).toBe('Suspected mechanism: Shift');
    expect((createHub.mock.calls[1] as unknown[])[0]).toBe('Suspected mechanism: Machine');
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

// CS-13 Evidence-Map drill retrofit (spec §4.0a).
// handleMapDrillDown previously switched tabs WITHOUT writing the scope the
// Explore charts read. The retrofit routes it through navigateToExploreForChip,
// which writes BOTH yColumn and boxplotFactor to useAnalysisScopeStore.
// The mocked panelsStore's showExplore is a throwaway vi.fn — we assert the
// REAL store write (the part the retrofit adds); tab-switch is seam-covered.
describe('AnalyzeWorkspace — Evidence-Map drill writes analysis scope (CS-13 retrofit)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    capturedMapViewProps.current = null;
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [] });
    useProjectStore.setState({ outcome: null });
  });

  it('map drill-down writes the analysis scope before switching to Explore (CS-13 retrofit)', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    const onDrillDown = capturedMapViewProps.current?.onDrillDown as (f: string) => void;
    expect(onDrillDown).toBeDefined();
    onDrillDown('SHIFT');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('SHIFT');
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
