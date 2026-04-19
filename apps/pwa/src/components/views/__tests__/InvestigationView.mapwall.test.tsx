/**
 * Tests for Map/Wall toggle wired into PWA InvestigationView.
 *
 * Strategy:
 * - Heavy dependencies (charts, hooks, feature stores) are mocked so we can
 *   render InvestigationView in isolation without providing the full
 *   orchestration props tree.
 * - useWallLayoutStore is NOT mocked — we use the real store and reset it in
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

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  return {
    ...actual,
    WallCanvas: (props: { hubs: unknown[] }) =>
      props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" />
      ) : (
        <div data-testid="wall-canvas-empty" />
      ),
  };
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
    getState: () => ({ showAnalysis: vi.fn() }),
  },
}));

// ── 2. Component + store imports AFTER mocks ───────────────────────────────

import { useWallLayoutStore, useProjectStore, getProjectInitialState } from '@variscout/stores';
import InvestigationView from '../InvestigationView';

// ── 3. Minimal props factory ───────────────────────────────────────────────

function makeMinimalProps(): React.ComponentProps<typeof InvestigationView> {
  const noOp = vi.fn();
  return {
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
  };
}

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('PWA InvestigationView Map/Wall toggle', () => {
  beforeEach(() => {
    // Reset wallLayoutStore to initial state (viewMode = 'map')
    useWallLayoutStore.setState(
      (
        useWallLayoutStore as typeof useWallLayoutStore & { getInitialState: () => unknown }
      ).getInitialState()
    );
    // Reset project store (no processMap by default)
    useProjectStore.setState(getProjectInitialState());
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

    expect(useWallLayoutStore.getState().viewMode).toBe('wall');
  });

  it('Wall button shows aria-pressed="true" after click', () => {
    // Pre-set the store to 'wall' to simulate persisted state
    useWallLayoutStore.getState().setViewMode('wall');

    render(<InvestigationView {...makeMinimalProps()} />);

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows WallCanvas when wall mode is active and processMap is set', () => {
    useWallLayoutStore.getState().setViewMode('wall');
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

  it('shows fallback message when wall mode is active but no processMap', () => {
    useWallLayoutStore.getState().setViewMode('wall');
    // processMap is null by default after reset

    render(<InvestigationView {...makeMinimalProps()} />);

    expect(screen.getByText(/Build a Process Map in the Frame workspace first/i)).toBeTruthy();
  });

  it('list/board/tree sub-toggle is visible in Map mode', () => {
    render(<InvestigationView {...makeMinimalProps()} />);
    // All three sub-toggle buttons should be present in Map mode
    expect(screen.getByRole('button', { name: /^list$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^board$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^tree$/i })).toBeTruthy();
  });

  it('list/board/tree sub-toggle is hidden in Wall mode', () => {
    useWallLayoutStore.getState().setViewMode('wall');

    render(<InvestigationView {...makeMinimalProps()} />);

    expect(screen.queryByRole('button', { name: /^list$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^board$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^tree$/i })).toBeNull();
  });
});
