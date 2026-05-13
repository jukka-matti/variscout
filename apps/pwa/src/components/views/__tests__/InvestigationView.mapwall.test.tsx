/**
 * Tests for Map/Wall toggle wired into PWA InvestigationView.
 *
 * Strategy:
 * - Heavy dependencies (charts, hooks, feature stores) are mocked so we can
 *   render InvestigationView in isolation without providing the full
 *   orchestration props tree.
 * - useCanvasViewportStore is NOT mocked — we use the real store and reset it in
 *   beforeEach per the Zustand testing pattern in .claude/rules/testing.md.
 * - useProjectStore / useInvestigationStore are NOT mocked for the toggle
 *   path — we seed processMap via useProjectStore.setState.
 *
 * IMPORTANT: vi.mock() calls must appear before any component imports.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── 1. Mocks BEFORE component imports ──────────────────────────────────────

const showCharterMock = vi.hoisted(() => vi.fn());

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  return actual;
});

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useResizablePanel: () => ({
      width: 280,
      handleMouseDown: vi.fn(),
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
    useWallIsMobile: () => false,
    WallCanvas: (props: { hubs: unknown[] }) =>
      props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" />
      ) : (
        <div data-testid="wall-canvas-empty" />
      ),
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

vi.mock('../../../features/findings/findingsStore', () => ({
  useFindingsStore: (selector: (s: { highlightedFindingId: string | null }) => unknown) =>
    selector({ highlightedFindingId: null }),
}));

vi.mock('../../../features/investigation/investigationStore', () => ({
  useInvestigationFeatureStore: {
    getState: () => ({ expandToQuestion: vi.fn() }),
  },
}));

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: {
    getState: () => ({ showAnalysis: vi.fn(), showCharter: showCharterMock }),
  },
}));

// ── 2. Component + store imports AFTER mocks ───────────────────────────────

import {
  getCanvasViewportInitialState,
  getProjectInitialState,
  useCanvasViewportStore,
  useProjectStore,
} from '@variscout/stores';
import { DEFAULT_PROCESS_HUB_ID } from '@variscout/core';
import { RETURN_NAVIGATION_STORAGE_KEY } from '@variscout/hooks';
import InvestigationView from '../InvestigationView';

// ── 3. Minimal props factory ───────────────────────────────────────────────

function makeMinimalProps(
  overrides: Partial<React.ComponentProps<typeof InvestigationView>> = {}
): React.ComponentProps<typeof InvestigationView> {
  const noOp = vi.fn();
  return {
    canvasViewportHubId: 'hub-test',
    filteredData: [],
    outcome: null,
    factors: [],
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
      addFindingComment: noOp,
    } as never,
    handleRestoreFinding: noOp,
    handleSetFindingStatus: noOp,
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
    factorIntelQuestions: [],
    handleQuestionClick: noOp,
    columnAliases: {},
    resolvedMode: 'standard' as never,
    questionsMap: {},
    ideaImpacts: {},
    ...overrides,
  };
}

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('PWA InvestigationView Map/Wall toggle', () => {
  beforeEach(() => {
    // Reset canvasViewportStore to initial state (viewMode = 'map')
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    // Reset project store (no processMap by default)
    useProjectStore.setState(getProjectInitialState());
    window.sessionStorage.clear();
    showCharterMock.mockClear();
  });

  it('defaults to Map view — Map button has aria-pressed="true"', () => {
    render(<InvestigationView {...makeMinimalProps()} />);

    const mapBtn = screen.getByRole('button', { name: /^map$/i });
    expect(mapBtn.getAttribute('aria-pressed')).toBe('true');

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders FindingsLog by default (Map mode)', () => {
    render(<InvestigationView {...makeMinimalProps()} />);
    expect(screen.getByTestId('findings-log')).toBeTruthy();
  });

  it('switches to Wall on click and persists state in the store', () => {
    render(<InvestigationView {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /^wall$/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
  });

  it('writes Wall viewport state under the provided canvas viewport hub id', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useProjectStore.setState({
      ...getProjectInitialState(),
      processContext: {
        processMap: {
          id: 'pm-1',
          steps: [],
          sipoc: { suppliers: [], inputs: [], process: [], outputs: [], customers: [] },
        } as never,
      },
    });

    render(<InvestigationView {...makeMinimalProps({ canvasViewportHubId: 'session-hub-1' })} />);

    const groupByTributary = screen.getByRole('button', { name: /group by tributary/i });
    fireEvent.click(groupByTributary);

    const state = useCanvasViewportStore.getState();
    expect(state.viewports['session-hub-1']?.groupByTributary).toBe(true);
    expect(state.viewports[DEFAULT_PROCESS_HUB_ID]).toBeUndefined();
  });

  it('Wall button shows aria-pressed="true" after click', () => {
    // Pre-set the store to 'wall' to simulate persisted state
    useCanvasViewportStore.getState().setViewMode('wall');

    render(<InvestigationView {...makeMinimalProps()} />);

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows WallCanvas when wall mode is active and processMap is set', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useProjectStore.setState({
      ...getProjectInitialState(),
      processContext: {
        processMap: {
          id: 'pm-1',
          steps: [],
          sipoc: { suppliers: [], inputs: [], process: [], outputs: [], customers: [] },
        } as never,
      },
    });

    render(<InvestigationView {...makeMinimalProps()} />);

    // WallCanvas renders (either empty or not, but present)
    expect(
      screen.queryByTestId('wall-canvas') ?? screen.queryByTestId('wall-canvas-empty')
    ).toBeTruthy();
  });

  it('shows WallCanvas when wall mode is active but no processMap', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    // processMap is null by default after reset

    render(<InvestigationView {...makeMinimalProps()} />);

    expect(
      screen.queryByTestId('wall-canvas') ?? screen.queryByTestId('wall-canvas-empty')
    ).toBeTruthy();
  });

  it('list/board/tree sub-toggle is visible in Map mode', () => {
    render(<InvestigationView {...makeMinimalProps()} />);
    // All three sub-toggle buttons should be present in Map mode
    expect(screen.getByRole('button', { name: /^list$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^board$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^tree$/i })).toBeTruthy();
  });

  it('list/board/tree sub-toggle is hidden in Wall mode', () => {
    useCanvasViewportStore.getState().setViewMode('wall');

    render(<InvestigationView {...makeMinimalProps()} />);

    expect(screen.queryByRole('button', { name: /^list$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^board$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^tree$/i })).toBeNull();
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

    render(<InvestigationView {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Improvement Project' }));

    expect(showCharterMock).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY)).toBeNull();
  });
});
