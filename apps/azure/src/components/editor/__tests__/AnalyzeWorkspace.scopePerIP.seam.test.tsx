/**
 * PR-CS-0 Task 2 — drill-materialized scopes are keyed per Improvement Project.
 *
 * The `scopeProjectId` prop (active IP id, or the 'general-unassigned'
 * sentinel for the quick-analysis flow) is threaded into the drill→scope spine:
 *  - `syncScopeFromDrill(scopeProjectId, outcome, filters)` stamps the id
 *    onto the materialized ProblemStatementScope, AND
 *  - the prop is a dependency of that effect + the activeScope memo + the
 *    railScopes memo, so switching IPs re-keys materialization and the rail.
 *
 * This asserts the per-IP contract end-to-end through the real AnalyzeWorkspace
 * + the real `useAnalyzeStore.syncScopeFromDrill`:
 *  1. rendering with scopeProjectId="ip-A" + a drill chip materializes a
 *     scope whose projectId === 'ip-A';
 *  2. rendering with scopeProjectId="ip-B" (same filters) materializes a
 *     DISTINCT scope (projectId === 'ip-B') — no co-mingling;
 *  3. the rail (railScopes → ScopeRail chips) shows ONLY the active IP's scopes.
 *
 * Strategy mirrors AnalyzeWorkspace.mapwall.test.tsx: heavy deps mocked,
 * useAnalyzeStore + useAnalysisScopeStore are the REAL stores (reset per test),
 * and @variscout/core primitives (buildConditionFromCategoricalFilters,
 * predicateSetKey, createProblemStatementScope) are stubbed deterministically so
 * the real syncScopeFromDrill materializes a scope that ECHOES the id under test.
 *
 * IMPORTANT: vi.mock() calls must appear before any component imports.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

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

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    QuestionChecklist: () => <div data-testid="question-checklist" />,
    AnalyzeConclusion: () => null,
    FindingsLog: () => <div data-testid="findings-log" />,
    QuestionLinkPrompt: () => null,
    useWallIsMobile: () => false,
    WallCanvas: () => <div data-testid="wall-canvas" />,
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
  const _highlightedFactor: string | null = null;
  const usePanelsStore = (
    selector: (s: {
      analyzeViewMode: 'map' | 'findings';
      highlightedFactor: string | null;
      setAnalyzeViewMode: (m: 'map' | 'findings') => void;
    }) => unknown
  ) =>
    selector({
      analyzeViewMode: _analyzeViewMode,
      highlightedFactor: _highlightedFactor,
      setAnalyzeViewMode: (m: 'map' | 'findings') => {
        _analyzeViewMode = m;
      },
    });
  usePanelsStore.getState = () => ({
    analyzeViewMode: _analyzeViewMode,
    highlightedFactor: _highlightedFactor,
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
    // The real syncScopeFromDrill calls this; the stub ECHOES projectId
    // onto the materialized scope so we can assert per-IP keying.
    createProblemStatementScope: (
      projectId: string,
      outcome: string,
      predicates: Array<{ column: string; value: unknown }> = []
    ) => ({
      id: `scope-${projectId}-${outcome}`,
      projectId,
      outcome,
      predicates,
      hypothesisIds: [],
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
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
    aiOrch: { handleAskCoScoutFromCategory: noOp } as never,
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

describe('AnalyzeWorkspace — scope is keyed per Improvement Project (PR-CS-0 Task 2)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().setAnalyzeViewMode('map');
    // A real outcome + a real drill chip → syncScopeFromDrill materializes.
    useProjectStore.setState({ outcome: 'Fill Weight' });
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Machine', values: ['A'] }],
    });
    useAnalyzeStore.setState({ scopes: [] });
  });

  it('materializes a scope stamped with the active IP id (scopeProjectId="ip-A")', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-A" />);

    const scopes = useAnalyzeStore.getState().scopes;
    expect(scopes).toHaveLength(1);
    expect(scopes[0].projectId).toBe('ip-A');
  });

  it('keys a DISTINCT scope per IP — ip-A and ip-B do not co-mingle on the same filters', () => {
    // First IP materializes under ip-A.
    const { unmount } = render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-A" />);
    expect(useAnalyzeStore.getState().scopes.map(s => s.projectId)).toEqual(['ip-A']);
    unmount();

    // Same drill filters, but the active IP switched to ip-B → a NEW scope keyed
    // to ip-B (the existing ip-A scope is NOT reused — idempotency is per-IP).
    render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-B" />);

    const ids = useAnalyzeStore
      .getState()
      .scopes.map(s => s.projectId)
      .sort();
    expect(ids).toEqual(['ip-A', 'ip-B']);
    // Distinct scope objects — no co-mingling.
    expect(useAnalyzeStore.getState().scopes).toHaveLength(2);
  });

  it('re-firing for the SAME IP + filters is idempotent (no duplicate)', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-A" />);
    const after1 = useAnalyzeStore.getState().scopes.length;
    // Re-render with the same id + filters: syncScopeFromDrill finds the existing
    // scope (keyed on projectId + outcome + predicateSetKey) and returns it.
    render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-A" />);
    expect(useAnalyzeStore.getState().scopes.length).toBe(after1);
  });

  it('defaults to the general-unassigned sentinel when the prop is omitted (quick-analysis flow)', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} />);
    const scopes = useAnalyzeStore.getState().scopes;
    expect(scopes).toHaveLength(1);
    expect(scopes[0].projectId).toBe('general-unassigned');
  });
});

// ── 5. Rail isolation — railScopes shows ONLY the active IP's scopes ───────────
//
// Pre-seed scopes from TWO different IPs into the store, render with the active
// IP = ip-A, and assert the ScopeRail (mounted by AnalyzeWorkspace, preserved via
// `...actual` in the @variscout/ui mock) renders ONLY ip-A's chip — proving the
// railScopes memo filters on scopeProjectId (and has it in its deps).

describe('AnalyzeWorkspace ScopeRail — only the active IP scopes appear (PR-CS-0 Task 2)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().setAnalyzeViewMode('map');
    // No active drill → no fresh materialization; we drive the rail purely from
    // pre-seeded store scopes so the filtering behaviour is isolated.
    useProjectStore.setState({ outcome: 'Fill Weight' });
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({
      scopes: [
        {
          id: 'scope-ipA',
          projectId: 'ip-A',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }],
          hypothesisIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
        {
          id: 'scope-ipB',
          projectId: 'ip-B',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
          hypothesisIds: [],
          createdAt: 2,
          updatedAt: 2,
          deletedAt: null,
        },
      ] as never,
    });
  });

  it('renders only the active IP (ip-A) scope chip, not the other IP (ip-B)', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-A" />);
    expect(screen.getByTestId('scope-chip-scope-ipA')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-chip-scope-ipB')).toBeNull();
  });

  it('switching the active IP to ip-B flips which chip the rail shows', () => {
    render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-B" />);
    expect(screen.getByTestId('scope-chip-scope-ipB')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-chip-scope-ipA')).toBeNull();
  });
});

// ── 6. rerender guards — deps arrays on a LIVE component ──────────────────
//
// Every test above uses a fresh render() (or unmount+render), so memos and
// effects recompute on mount regardless of their dep lists. The tests below
// use rerender() on a MOUNTED component to prove that each of the three dep
// arrays actually lists scopeProjectId:
//
//   A. useEffect deps [categoricalFilters, outcome, scopeProjectId]:
//      Without scopeProjectId, the effect won't re-fire when ONLY the
//      prop changes, so no ip-B scope is ever materialized.
//
//   B. railScopes memo deps [scopes, scopeProjectId]:
//      When scopes are pre-seeded (no effect firing, no scopes change),
//      the memo only re-runs if scopeProjectId is in its dep list.
//      Without it the rendered rail stays frozen on the initial IP's chip.
//
//   C. activeScope memo deps [categoricalFilters, outcome, scopes, scopeProjectId]:
//      Pre-seed TWO scopes with IDENTICAL predicates (same predicateSetKey),
//      one for ip-A and one for ip-B. Set categoricalFilters to exactly that
//      condition so activeScope can resolve to a matching scope. When rerendering
//      from ip-A to ip-B the useEffect re-fires, but syncScopeFromDrill finds
//      the existing ip-B scope and returns it WITHOUT calling set() (idempotent
//      path — analyzeStore.ts:~718). The scopes array reference therefore stays
//      stable. The only dep that can flip activeScope is scopeProjectId.
//      We verify by checking aria-current="true" on the active scope's chip:
//      if scopeProjectId is absent from the memo's deps, activeScope stays
//      pointing at ip-A's scope even after the prop changes to ip-B, so ip-B's
//      chip renders (via railScopes) but WITHOUT aria-current.

describe('AnalyzeWorkspace — rerender() deps-array guards (PR-CS-0 Task 2)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    usePanelsStore.getState().setAnalyzeViewMode('map');
    useProjectStore.setState({ outcome: 'Fill Weight' });
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Machine', values: ['A'] }],
    });
    useAnalyzeStore.setState({ scopes: [] });
  });

  it('Test A — useEffect dep: rerender to ip-B materializes a new ip-B scope (effect must re-fire on the live component)', () => {
    // Mount with ip-A: effect fires, ip-A scope appears.
    const { rerender } = render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-A" />);
    expect(useAnalyzeStore.getState().scopes.map(s => s.projectId)).toEqual(['ip-A']);

    // Prop-only change to ip-B — same categoricalFilters + outcome.
    // If scopeProjectId is absent from the useEffect deps, the effect
    // won't re-fire here and no ip-B scope will ever appear.
    act(() => {
      rerender(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-B" />);
    });

    const ids = useAnalyzeStore
      .getState()
      .scopes.map(s => s.projectId)
      .sort();
    // Both scopes must exist: ip-A from the first mount, ip-B from the re-fired
    // effect after the prop changed.
    expect(ids).toContain('ip-B');
    // Specifically: the effect MUST have run again for ip-B.
    expect(useAnalyzeStore.getState().scopes.find(s => s.projectId === 'ip-B')).toBeDefined();
  });

  it('Test B — railScopes memo dep: rerender to ip-B on a live component with pre-seeded scopes flips the rendered rail chip', () => {
    // Pre-seed both IPs in the store so scopes is stable (never changes during
    // this test). This isolates the railScopes memo dep from the effect:
    // the ONLY way the rail can switch chips is if scopeProjectId is
    // listed in the memo's dep array.
    useAnalysisScopeStore.setState({ categoricalFilters: [] }); // no fresh materialization
    useAnalyzeStore.setState({
      scopes: [
        {
          id: 'scope-ipA',
          projectId: 'ip-A',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }],
          hypothesisIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
        {
          id: 'scope-ipB',
          projectId: 'ip-B',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }],
          hypothesisIds: [],
          createdAt: 2,
          updatedAt: 2,
          deletedAt: null,
        },
      ] as never,
    });

    // Mount with ip-A: rail shows ip-A's chip, not ip-B's.
    const { rerender } = render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-A" />);
    expect(screen.getByTestId('scope-chip-scope-ipA')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-chip-scope-ipB')).toBeNull();

    // Prop-only change to ip-B — scopes array is UNCHANGED (no effect fires,
    // no store write). If scopeProjectId is absent from the railScopes
    // memo deps the memo won't recompute here and ip-A's chip stays rendered.
    act(() => {
      rerender(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-B" />);
    });

    // Rail must now show ip-B's chip and hide ip-A's.
    expect(screen.getByTestId('scope-chip-scope-ipB')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-chip-scope-ipA')).toBeNull();
  });

  it('Test C — activeScope memo dep: rerender to ip-B flips aria-current via the idempotent-effect path (stable scopes)', () => {
    // Pre-seed BOTH scopes with IDENTICAL predicates so predicateSetKey matches
    // whichever IP is active. The effect will re-fire on rerender but
    // syncScopeFromDrill finds the existing scope and returns it WITHOUT calling
    // set() (idempotent path), leaving scopes referentially stable.
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Machine', values: ['A'] }],
    });
    useAnalyzeStore.setState({
      scopes: [
        {
          id: 'scope-ipA',
          projectId: 'ip-A',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }],
          hypothesisIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
        {
          id: 'scope-ipB',
          projectId: 'ip-B',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }],
          hypothesisIds: [],
          createdAt: 2,
          updatedAt: 2,
          deletedAt: null,
        },
      ] as never,
    });

    // Mount with ip-A: activeScope resolves to scope-ipA (projectId match).
    // Rail shows only ip-A's chip (railScopes filters by scopeProjectId).
    const { rerender } = render(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-A" />);
    expect(screen.getByTestId('scope-chip-scope-ipA')).toBeInTheDocument();
    expect(screen.getByTestId('scope-chip-scope-ipA').getAttribute('aria-current')).toBe('true');
    expect(screen.queryByTestId('scope-chip-scope-ipB')).toBeNull();

    // Prop-only change to ip-B. The effect re-fires but is idempotent (ip-B scope
    // already exists — syncScopeFromDrill returns it without set(), so scopes is
    // unchanged). The ONLY dep that can flip activeScope is scopeProjectId.
    act(() => {
      rerender(<AnalyzeWorkspace {...makeMinimalProps()} scopeProjectId="ip-B" />);
    });

    // ip-B's chip is now the active scope: aria-current must be "true".
    // ip-A's chip is no longer rendered (railScopes now shows only ip-B).
    expect(screen.getByTestId('scope-chip-scope-ipB')).toBeInTheDocument();
    expect(screen.getByTestId('scope-chip-scope-ipB').getAttribute('aria-current')).toBe('true');
    expect(screen.queryByTestId('scope-chip-scope-ipA')).toBeNull();
  });
});
