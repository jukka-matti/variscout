/**
 * Azure AnalyzeWorkspace — Seed-3 ranking SEAM test (ER-2 / A3 honesty fix).
 *
 * Verifies that handleSeedFromFactorIntel selects the top-3 factors by
 * adjustedEtaSquared from computeMainEffects, NOT the first three columns in
 * insertion order.
 *
 * Strategy: override useFilteredData to return the deterministic fixture.
 * computeMainEffects is NOT mocked — the real engine runs over the fixture.
 *
 * Fixture: factors ['Noise','Strong','Medium','Weak'] where Strong has the
 * dominant group separation. Insertion order would seed Noise first; the fixed
 * handler must seed Strong first.
 *
 * Also asserts the fallback path: when the engine returns null (n < 3 / all
 * single-level), the CTA still seeds the first 3 factors in list order.
 */

const showCharterMock = vi.hoisted(() => vi.fn());
const capturedWallCanvasProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  return { ...actual, EvidenceMapBase: () => <div /> };
});

// ── filteredData stub — overridden per test ──────────────────────────────────
const filteredDataStub = vi.hoisted(() => ({
  current: [] as Array<Record<string, unknown>>,
}));

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useFilteredData: () => ({ filteredData: filteredDataStub.current }),
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
    useTranslation: () => ({ t: (key: string) => key, locale: 'en-US' }),
  };
});

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    QuestionChecklist: () => <div />,
    AnalyzeConclusion: () => null,
    FindingsLog: () => <div data-testid="findings-log" />,
    QuestionLinkPrompt: () => null,
    useWallIsMobile: () => false,
    WallCanvas: (props: {
      hubs: Array<{ id: string; name?: string }>;
      onWriteHypothesis?: () => void;
      onSeedFromFactorIntel?: () => void;
    }) => {
      capturedWallCanvasProps.current = props as Record<string, unknown>;
      return (
        <div data-testid="wall-canvas-empty">
          {props.onWriteHypothesis && (
            <button data-testid="empty-write-hypothesis" onClick={props.onWriteHypothesis}>
              write
            </button>
          )}
          {props.onSeedFromFactorIntel && (
            <button data-testid="empty-seed-factors" onClick={props.onSeedFromFactorIntel}>
              seed
            </button>
          )}
        </div>
      );
    },
    CommandPalette: () => null,
    Minimap: () => null,
    OverallProblemHeader: () => null,
    ScopeRail: () => null,
    ObjectDetailDrawer: () => null,
    CausesMatrix: () => null,
    useWallKeyboard: () => {},
  };
});

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  // The `...actual` spread may not carry deep re-exports under the test mock
  // runtime (same issue as computeMainEffects → () => null in the mapwall
  // test). Import the real implementations from the sub-path barrel which
  // resolves independently of the root-barrel mock.
  const stats =
    await vi.importActual<typeof import('@variscout/core/stats')>('@variscout/core/stats');
  return {
    ...actual,
    // Real engine functions — the seam under test
    computeMainEffects: stats.computeMainEffects,
    excludeYDerivedFactors: stats.excludeYDerivedFactors,
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
        .map(f => ({ column: f.column, op: 'eq', value: f.values[0] })),
    predicateSetKey: (predicates: Array<{ column: string; value: unknown }>) =>
      predicates
        .map(p => `${p.column}=${String(p.value)}`)
        .sort()
        .join('|'),
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
  return { ...actual, detectEvidenceClusters: () => [] };
});

vi.mock('@variscout/core/ai', () => ({ detectInvestigationPhase: () => null }));

vi.mock('@variscout/core/strategy', () => ({
  resolveMode: () => 'standard',
  getStrategy: () => ({ questionStrategy: { evidenceLabel: 'R²' } }),
}));

vi.mock('@variscout/core/stats', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core/stats')>();
  return {
    ...actual,
    wouldCreateCycle: () => false,
  };
});

vi.mock('../../../features/analyze/analyzeStore', () => ({
  useAnalyzeFeatureStore: { getState: () => ({ expandToQuestion: vi.fn() }) },
}));

vi.mock('../../../features/ai/aiStore', () => ({
  useAIStore: { getState: () => ({ syncFactorMetadata: vi.fn() }) },
}));

vi.mock('../../../features/panels/panelsStore', () => {
  let _analyzeViewMode: 'map' | 'findings' = 'map';
  const usePanelsStore = (
    selector: (s: {
      analyzeViewMode: 'map' | 'findings';
      highlightedFactor: string | null;
      setAnalyzeViewMode: (m: 'map' | 'findings') => void;
    }) => unknown
  ) => {
    const state = {
      analyzeViewMode: _analyzeViewMode,
      highlightedFactor: null,
      setAnalyzeViewMode: (m: 'map' | 'findings') => {
        _analyzeViewMode = m;
      },
    };
    return selector(state);
  };
  usePanelsStore.getState = () => ({
    analyzeViewMode: _analyzeViewMode,
    highlightedFactor: null,
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

// ── Component + store imports AFTER mocks ────────────────────────────────────

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useAnalysisScopeStore,
  useAnalyzeStore,
  useProjectStore,
} from '@variscout/stores';
import { AnalyzeWorkspace } from '../AnalyzeWorkspace';

// ── Fixture: insertion order ≠ effect order ──────────────────────────────────
// Factors in list order: ['Noise', 'Strong', 'Medium', 'Weak']
// 'Strong' has the largest mean-separation → highest adjustedEtaSquared (~0.60)
// 'Medium' has a moderate separation      → 2nd highest (~0.20)
// 'Noise'  has identical group means      → zero adjustedEtaSquared
// 'Weak'   has minimal separation         → zero (tied with Noise)
//
// Old code (factors.slice(0,3)): seeds Noise, Strong, Medium (insertion order)
// Fixed code (by rank):           seeds Strong, Medium, Noise or Weak (rank order)
//   → the key assertion: Strong is FIRST, Noise is NOT first
//
// Grounded: Strong=0.5972, Medium=0.2007, Noise=0.0000, Weak=0.0000
// (verified via tsx against computeMainEffects 2026-06-11)

const OUTCOME = 'Y';
const FACTORS = ['Noise', 'Strong', 'Medium', 'Weak'];

const RANKED_ROWS = [
  { Noise: 'A', Strong: 'Day', Medium: 'X', Weak: 'P', Y: 30 },
  { Noise: 'B', Strong: 'Day', Medium: 'X', Weak: 'Q', Y: 28 },
  { Noise: 'A', Strong: 'Day', Medium: 'Z', Weak: 'P', Y: 16 },
  { Noise: 'B', Strong: 'Day', Medium: 'Z', Weak: 'Q', Y: 14 },
  { Noise: 'B', Strong: 'Night', Medium: 'X', Weak: 'P', Y: 11 },
  { Noise: 'A', Strong: 'Night', Medium: 'X', Weak: 'Q', Y: 9 },
  { Noise: 'B', Strong: 'Night', Medium: 'Z', Weak: 'P', Y: 7 },
  { Noise: 'A', Strong: 'Night', Medium: 'Z', Weak: 'Q', Y: 5 },
  { Noise: 'A', Strong: 'Day', Medium: 'X', Weak: 'P', Y: 29 },
  { Noise: 'B', Strong: 'Day', Medium: 'X', Weak: 'Q', Y: 27 },
  { Noise: 'A', Strong: 'Day', Medium: 'Z', Weak: 'P', Y: 15 },
  { Noise: 'B', Strong: 'Day', Medium: 'Z', Weak: 'Q', Y: 13 },
  { Noise: 'B', Strong: 'Night', Medium: 'X', Weak: 'P', Y: 10 },
  { Noise: 'A', Strong: 'Night', Medium: 'X', Weak: 'Q', Y: 8 },
  { Noise: 'B', Strong: 'Night', Medium: 'Z', Weak: 'P', Y: 6 },
  { Noise: 'A', Strong: 'Night', Medium: 'Z', Weak: 'Q', Y: 4 },
];

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
      createHub: vi.fn(name => ({ id: `hub-${name}` }) as never),
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

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Azure AnalyzeWorkspace — Seed-3 ranking honesty (ER-2 / A3)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    useAnalysisScopeStore.setState({ categoricalFilters: [] });
    useAnalyzeStore.setState({ scopes: [] });
    useProjectStore.setState({ outcome: OUTCOME, factors: FACTORS });
    filteredDataStub.current = [];
    capturedWallCanvasProps.current = null;
    showCharterMock.mockClear();
  });

  it('seeds hubs in adjustedEtaSquared rank order, not insertion order (Strong first, not Noise first)', () => {
    filteredDataStub.current = RANKED_ROWS;

    const props = makeMinimalProps();
    const createHub = props.hypothesesState.createHub as ReturnType<typeof vi.fn>;
    render(<AnalyzeWorkspace {...props} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    expect(createHub).toHaveBeenCalledTimes(3);

    // Strong must be first call — it has dominant separation (adjustedEtaSquared ~0.60)
    // Noise is insertion-order first but effect-rank last → must NOT be first
    expect((createHub.mock.calls[0] as unknown[])[0]).toBe('Suspected cause: Strong');
    expect((createHub.mock.calls[0] as unknown[])[0]).not.toBe('Suspected cause: Noise');

    // Second must be Medium (moderate effect ~0.20)
    expect((createHub.mock.calls[1] as unknown[])[0]).toBe('Suspected cause: Medium');

    // All seeded names have the "Suspected cause:" prefix (P5 invariant)
    const seededNames = (createHub.mock.calls as unknown[][]).map(c => c[0] as string);
    for (const name of seededNames) {
      expect(name).toMatch(/^Suspected cause:/);
    }
  });

  it('seeds exactly 3 factors when 4 are available', () => {
    filteredDataStub.current = RANKED_ROWS;

    const props = makeMinimalProps();
    const createHub = props.hypothesesState.createHub as ReturnType<typeof vi.fn>;
    render(<AnalyzeWorkspace {...props} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    expect(createHub).toHaveBeenCalledTimes(3);
  });

  it('fallback: engine null (n<3) → seeds first 3 factors in list order, CTA still works', () => {
    // Only 2 rows — engine returns null (n < 3 per factor)
    filteredDataStub.current = [
      { Noise: 'A', Strong: 'Day', Y: 10 },
      { Noise: 'B', Strong: 'Night', Y: 20 },
    ];
    useProjectStore.setState({ outcome: OUTCOME, factors: ['Alpha', 'Beta', 'Gamma', 'Delta'] });

    const props = makeMinimalProps();
    const createHub = props.hypothesesState.createHub as ReturnType<typeof vi.fn>;
    render(<AnalyzeWorkspace {...props} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    expect(createHub).toHaveBeenCalledTimes(3);
    // Fallback preserves list order
    expect((createHub.mock.calls[0] as unknown[])[0]).toBe('Suspected cause: Alpha');
    expect((createHub.mock.calls[1] as unknown[])[0]).toBe('Suspected cause: Beta');
    expect((createHub.mock.calls[2] as unknown[])[0]).toBe('Suspected cause: Gamma');
  });

  it('fallback: no outcome → seeds first 3 in list order (CTA still works)', () => {
    useProjectStore.setState({ outcome: null, factors: ['Alpha', 'Beta', 'Gamma', 'Delta'] });
    filteredDataStub.current = RANKED_ROWS;

    const props = makeMinimalProps();
    const createHub = props.hypothesesState.createHub as ReturnType<typeof vi.fn>;
    render(<AnalyzeWorkspace {...props} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    expect(createHub).toHaveBeenCalledTimes(3);
    expect((createHub.mock.calls[0] as unknown[])[0]).toBe('Suspected cause: Alpha');
  });
});
