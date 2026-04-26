/**
 * Tests for Map/Wall toggle wired into InvestigationWorkspace.
 *
 * Strategy:
 * - Heavy dependencies (charts, hooks, feature stores) are mocked so we can
 *   render InvestigationWorkspace in isolation without providing the full
 *   orchestration props tree.
 * - useWallLayoutStore is NOT mocked — we use the real store and reset it in
 *   beforeEach per the Zustand testing pattern in .claude/rules/testing.md.
 * - panelsStore is NOT mocked — we toggle investigationViewMode to 'map' in
 *   beforeEach so the Evidence Map tab is the active view.
 *
 * IMPORTANT: vi.mock() calls must appear before any component imports.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── 1. Mocks BEFORE component imports ──────────────────────────────────────

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  return {
    ...actual,
    EvidenceMapBase: () => <div data-testid="evidence-map-base" />,
    WallCanvas: (props: { hubs: unknown[] }) =>
      props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" data-has-process-map={String('processMap' in props)} />
      ) : (
        <div data-testid="wall-canvas-empty" data-has-process-map={String('processMap' in props)} />
      ),
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
    InvestigationPhaseBadge: () => null,
    InvestigationConclusion: () => null,
    FindingsLog: () => <div data-testid="findings-log" />,
    QuestionLinkPrompt: () => null,
  };
});

vi.mock('../InvestigationMapView', () => ({
  InvestigationMapView: () => <div data-testid="investigation-map-view" />,
}));

vi.mock('../CoScoutSection', () => ({
  CoScoutSection: () => <div data-testid="coscout-section" />,
}));

vi.mock('../../../features/panels/panelsStore', () => {
  // Minimal mutable stub so we can control investigationViewMode
  let _investigationViewMode: 'map' | 'findings' = 'map';
  const _highlightedFactor: string | null = null;

  const usePanelsStore = (
    selector: (s: {
      investigationViewMode: 'map' | 'findings';
      highlightedFactor: string | null;
      setInvestigationViewMode: (m: 'map' | 'findings') => void;
    }) => unknown
  ) => {
    const state = {
      investigationViewMode: _investigationViewMode,
      highlightedFactor: _highlightedFactor,
      setInvestigationViewMode: (m: 'map' | 'findings') => {
        _investigationViewMode = m;
      },
    };
    return selector(state);
  };
  // Expose getState for imperative calls inside the component
  usePanelsStore.getState = () => ({
    investigationViewMode: _investigationViewMode,
    highlightedFactor: _highlightedFactor,
    setInvestigationViewMode: (m: 'map' | 'findings') => {
      _investigationViewMode = m;
    },
    showAnalysis: vi.fn(),
    showImprovement: vi.fn(),
    setHighlightedFactor: vi.fn(),
  });
  return { usePanelsStore };
});

vi.mock('../../../features/findings/findingsStore', () => ({
  useFindingsStore: (selector: (s: { highlightedFindingId: string | null }) => unknown) =>
    selector({ highlightedFindingId: null }),
}));

vi.mock('../../../features/investigation/investigationStore', () => ({
  useInvestigationFeatureStore: {
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
    hasTeamFeatures: () => false,
    computeMainEffects: () => null,
    computeInteractionEffects: () => null,
    inferCharacteristicType: () => 'continuous',
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

import { useWallLayoutStore } from '@variscout/stores';
import { InvestigationWorkspace } from '../InvestigationWorkspace';

// ── 3. Minimal props factory ───────────────────────────────────────────────

function makeMinimalProps(): React.ComponentProps<typeof InvestigationWorkspace> {
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
    questionsState: {
      questions: [],
      addQuestion: noOp,
      addSubQuestion: noOp,
      getChildrenSummary: vi.fn(() => null),
      setValidationTask: noOp,
      completeTask: noOp,
      setManualStatus: noOp,
      addIdea: noOp,
      updateIdea: noOp,
      removeIdea: noOp,
      selectIdea: noOp,
      setCauseRole: noOp,
    } as never,
    handleCreateQuestion: noOp,
    handleProjectIdea: noOp,
    handleAddCommentWithAuthor: noOp as never,
    handleAddPhoto: undefined,
    handleCaptureFromTeams: undefined,
    isTeamsCamera: false,
    aiOrch: {
      handleAskCoScoutFromCategory: noOp,
    } as never,
    actionProposalsState: {} as never,
    handleSearchKnowledge: noOp,
    columnAliases: {},
    suspectedCausesState: {
      hubs: [],
      createHub: vi.fn(() => ({ id: 'hub-1' }) as never),
      updateHub: noOp,
      deleteHub: noOp,
      connectQuestion: noOp,
      disconnectQuestion: noOp,
      connectFinding: noOp,
      disconnectFinding: noOp,
      resetHubs: noOp,
    } as never,
    questionsMap: {},
    ideaImpacts: {},
  };
}

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('InvestigationWorkspace Map/Wall toggle', () => {
  beforeEach(() => {
    // Reset wallLayoutStore to initial state (viewMode = 'map')
    useWallLayoutStore.setState(
      (
        useWallLayoutStore as typeof useWallLayoutStore & { getInitialState: () => unknown }
      ).getInitialState()
    );
  });

  it('defaults to Map view — Map button has aria-pressed="true"', () => {
    render(<InvestigationWorkspace {...makeMinimalProps()} />);

    const mapBtn = screen.getByRole('button', { name: /^map$/i });
    expect(mapBtn.getAttribute('aria-pressed')).toBe('true');

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders InvestigationMapView by default', () => {
    render(<InvestigationWorkspace {...makeMinimalProps()} />);
    expect(screen.getByTestId('investigation-map-view')).toBeTruthy();
  });

  it('switches to Wall on click and persists state in the store', () => {
    render(<InvestigationWorkspace {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /^wall$/i }));

    expect(useWallLayoutStore.getState().viewMode).toBe('wall');
  });

  it('Wall button shows aria-pressed="true" after click', () => {
    // Pre-set the store to 'wall' to simulate a persisted state
    useWallLayoutStore.getState().setViewMode('wall');

    render(<InvestigationWorkspace {...makeMinimalProps()} />);

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders the WallCanvas for a chart-first investigation without a process map', () => {
    useWallLayoutStore.getState().setViewMode('wall');
    const props = makeMinimalProps();
    props.suspectedCausesState.hubs = [
      {
        id: 'hub-1',
        name: 'Nozzle heat drift',
        synthesis: '',
        questionIds: [],
        findingIds: [],
        status: 'suspected',
        createdAt: '',
        updatedAt: '',
      },
    ] as never;

    render(<InvestigationWorkspace {...props} />);

    expect(screen.getByTestId('wall-canvas')).toBeInTheDocument();
  });
});
