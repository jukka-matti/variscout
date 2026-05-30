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
    WallCanvas: (props: { hubs: unknown[]; planningProps?: Record<string, unknown> }) => {
      capturedWallCanvasProps.current = props as Record<string, unknown>;
      return props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" data-has-process-map={String('processMap' in props)} />
      ) : (
        <div data-testid="wall-canvas-empty" data-has-process-map={String('processMap' in props)} />
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
} from '@variscout/stores';
import type { ProblemStatementScope } from '@variscout/core';
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
  const SCOPE_INV = 'general-unassigned'; // matches AnalyzeWorkspace.scopeInvestigationId

  const scopeA: ProblemStatementScope = {
    id: 'scope-a',
    investigationId: SCOPE_INV,
    outcome: 'Fill Weight',
    predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' }],
    hypothesisIds: [],
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  };
  const scopeB: ProblemStatementScope = {
    id: 'scope-b',
    investigationId: SCOPE_INV,
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
