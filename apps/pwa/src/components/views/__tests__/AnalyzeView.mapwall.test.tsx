/**
 * Tests for the Wall/Causes/Findings Analyze lenses wired into PWA AnalyzeView.
 *
 * Strategy:
 * - Heavy dependencies (charts, hooks, feature stores) are mocked so we can
 *   render AnalyzeView in isolation without providing the full
 *   orchestration props tree.
 * - useCanvasViewportStore is NOT mocked — we use the real store and reset it in
 *   beforeEach per the Zustand testing pattern in .claude/rules/testing.md.
 * - useProjectStore / useAnalyzeStore are NOT mocked for the toggle
 *   path — we seed processMap via useProjectStore.setState.
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
    AnalyzeConclusion: () => null,
    FindingsLog: (props: Record<string, unknown>) => {
      capturedFindingsLogProps.current = props;
      return <div data-testid="findings-log" />;
    },
    useWallIsMobile: () => false,
    WallCanvas: (props: {
      hubs: Array<{ id: string; name?: string }>;
      planningProps?: Record<string, unknown>;
      onWriteHypothesis?: () => void;
      onSeedFromFactorIntel?: () => void;
      onSelectHub?: (id: string) => void;
    }) => {
      // Capture props for assertion in planningProps tests
      capturedWallCanvasProps.current = props as Record<string, unknown>;
      return props.hubs.length > 0 ? (
        <div data-testid="wall-canvas">
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
        <div data-testid="wall-canvas-empty">
          {props.onWriteHypothesis && (
            <button data-testid="empty-write-hypothesis" onClick={props.onWriteHypothesis}>
              Add a suspected cause
            </button>
          )}
          {props.onSeedFromFactorIntel && (
            <button data-testid="empty-seed-factors" onClick={props.onSeedFromFactorIntel}>
              Seed 3 largest contributors
            </button>
          )}
        </div>
      );
    },
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

vi.mock('../../../features/analyze/analyzeStore', () => ({
  useAnalyzeFeatureStore: {
    getState: () => ({ expandToQuestion: vi.fn() }),
  },
}));

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: {
    getState: () => ({ showExplore: vi.fn(), showCharter: showCharterMock }),
  },
}));

// ── 2. Component + store imports AFTER mocks ───────────────────────────────

import {
  getAnalyzeInitialState,
  getAnalysisScopeInitialState,
  getCanvasViewportInitialState,
  getProjectInitialState,
  getViewInitialState,
  useAnalysisScopeStore,
  useAnalyzeStore,
  useCanvasViewportStore,
  useProjectStore,
  useViewStore,
} from '@variscout/stores';
import { createFinding, createHypothesis, DEFAULT_PROCESS_HUB_ID } from '@variscout/core';
import type { ProcessHubId } from '@variscout/core/processHub';
import { RETURN_NAVIGATION_STORAGE_KEY } from '@variscout/hooks';
import AnalyzeView from '../AnalyzeView';

const h = (id: string) => id as ProcessHubId;

// ── 3. Minimal props factory ───────────────────────────────────────────────

function makeMinimalProps(
  overrides: Partial<React.ComponentProps<typeof AnalyzeView>> = {}
): React.ComponentProps<typeof AnalyzeView> {
  const noOp = vi.fn();
  return {
    canvasViewportHubId: h('hub-test'),
    filteredData: [],
    outcome: null,
    factors: [],
    handleRestoreFinding: noOp,
    handleSetFindingStatus: noOp,
    drillPath: [],
    // IM-1 (ADR-085): questionsState / handleCreateQuestion / factorIntelQuestions /
    // handleQuestionClick / questionsMap / ideaImpacts are all removed from
    // AnalyzeViewProps — they were tied to the retired Question entity.
    columnAliases: {},
    resolvedMode: 'standard' as never,
    ...overrides,
  };
}

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('PWA AnalyzeView Wall/Causes/Findings lenses', () => {
  beforeEach(() => {
    // Reset canvasViewportStore to initial state (viewMode = 'wall')
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    // Reset project store (no processMap by default)
    useProjectStore.setState(getProjectInitialState());
    // PO-6: findings now come from the store — reset to empty state
    useAnalyzeStore.setState(getAnalyzeInitialState());
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
    useViewStore.setState(getViewInitialState());
    capturedWallCanvasProps.current = null;
    capturedFindingsLogProps.current = null;
    window.sessionStorage.clear();
    showCharterMock.mockClear();
  });

  it('lands on Wall by default and omits Evidence Map from the primary controls', () => {
    render(<AnalyzeView {...makeMinimalProps()} />);

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^causes$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^findings$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^map$/i })).toBeNull();
    expect(screen.queryByText('Evidence Map')).toBeNull();
  });

  it('renders WallCanvas by default', () => {
    render(<AnalyzeView {...makeMinimalProps()} />);
    expect(screen.getByTestId('analyze-wall-canvas-shell')).toBeInTheDocument();
  });

  it('switches to Wall on click and persists state in the store', () => {
    render(<AnalyzeView {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /^wall$/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
  });

  it('switches to Causes, renders the matrix, and row click focuses the Wall card', () => {
    const finding = createFinding('Operator notes night-shift staffing gap', {}, null);
    const hub = {
      ...createHypothesis('Night shift staffing', '', [finding.id]),
      id: 'h-night',
    };
    useAnalyzeStore.setState({ findings: [finding], hypotheses: [hub] });

    render(<AnalyzeView {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /^causes$/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('causes');
    expect(screen.getByText('1 causes · 0 supported · 0 in flight · 0 stalled · 0 ruled out'));
    expect(screen.getByRole('row', { name: /Night shift staffing/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('row', { name: /Night shift staffing/i }));

    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
    expect(useViewStore.getState().focusedWallEntityId).toBe('h-night');
  });

  it('routes direct Analyze entry to Wall arrival when findings exist and no hubs exist', () => {
    useAnalyzeStore.setState({
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
        } as never,
      ],
      hypotheses: [],
    });

    render(<AnalyzeView {...makeMinimalProps()} />);

    expect(useCanvasViewportStore.getState().viewMode).toBe('wall');
    expect(screen.getByRole('button', { name: /^wall$/i }).getAttribute('aria-pressed')).toBe(
      'true'
    );
  });

  it('treats a persisted map mode as Findings arrival in primary Analyze', () => {
    useCanvasViewportStore.getState().setViewMode('map');

    render(<AnalyzeView {...makeMinimalProps()} />);

    expect(useCanvasViewportStore.getState().viewMode).toBe('map');
    expect(screen.getByTestId('findings-log')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^findings$/i }).getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect(screen.queryByRole('button', { name: /^map$/i })).toBeNull();
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

    render(<AnalyzeView {...makeMinimalProps({ canvasViewportHubId: h('session-hub-1') })} />);

    const groupByTributary = screen.getByRole('button', { name: /group by tributary/i });
    fireEvent.click(groupByTributary);

    const state = useCanvasViewportStore.getState();
    expect(state.viewports[h('session-hub-1')]?.groupByTributary).toBe(true);
    expect(state.viewports[DEFAULT_PROCESS_HUB_ID]).toBeUndefined();
  });

  it('Wall button shows aria-pressed="true" after click', () => {
    // Pre-set the store to 'wall' to simulate persisted state
    useCanvasViewportStore.getState().setViewMode('wall');

    render(<AnalyzeView {...makeMinimalProps()} />);

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

    render(<AnalyzeView {...makeMinimalProps()} />);

    // WallCanvas renders (either empty or not, but present)
    expect(
      screen.queryByTestId('wall-canvas') ?? screen.queryByTestId('wall-canvas-empty')
    ).toBeTruthy();
  });

  it('shows WallCanvas when wall mode is active but no processMap', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    // processMap is null by default after reset

    render(<AnalyzeView {...makeMinimalProps()} />);

    expect(
      screen.queryByTestId('wall-canvas') ?? screen.queryByTestId('wall-canvas-empty')
    ).toBeTruthy();
  });

  it('renders the canvas-first Wall shell with the overall problem header', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useAnalyzeStore.setState({
      findings: [],
      hypotheses: [createHypothesis('Nozzle heat drift', '', [])],
    });

    render(
      <AnalyzeView
        {...makeMinimalProps({
          outcome: 'Fill Weight',
          factors: ['Shift'],
        })}
      />
    );

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
    useCanvasViewportStore.getState().setViewMode('wall');
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      findings: [finding],
      hypotheses: [hub],
    });

    render(<AnalyzeView {...makeMinimalProps({ outcome: 'Fill Weight', factors: ['Shift'] })} />);
    fireEvent.click(screen.getByTestId('mock-wall-select-h-hot'));

    expect(screen.getByTestId('object-detail-drawer')).toHaveTextContent('Suspected cause');
    expect(screen.getByTestId('object-detail-title')).toHaveTextContent('Nozzle runs hot');
    expect(screen.getByRole('tab', { name: 'Evidence' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Comments' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
  });

  it('renders the current scope switcher from flat sibling scopes', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useProjectStore.setState({ ...getProjectInitialState(), outcome: 'Fill Weight' });
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Shift', values: ['Night'] }],
    });
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      scopes: [
        {
          id: 'scope-night',
          projectId: 'hub-test',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
          hypothesisIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
        {
          id: 'scope-day',
          projectId: 'hub-test',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Day' }],
          hypothesisIds: [],
          createdAt: 2,
          updatedAt: 2,
          deletedAt: null,
        },
      ],
      hypotheses: [createHypothesis('Existing', '', [])],
    });

    render(<AnalyzeView {...makeMinimalProps({ outcome: 'Fill Weight' })} />);

    expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Current scope');
    expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Shift = Night');
    expect(screen.getByTestId('scope-switcher')).toHaveTextContent('2 scopes');
    expect(screen.getByTestId('overall-problem-header')).toHaveTextContent('2 open scope branches');
  });

  it('switching a scope rewrites categorical filters', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useProjectStore.setState({ ...getProjectInitialState(), outcome: 'Fill Weight' });
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Shift', values: ['Night'] }],
    });
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      scopes: [
        {
          id: 'scope-night',
          projectId: 'hub-test',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
          hypothesisIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
        {
          id: 'scope-day',
          projectId: 'hub-test',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Day' }],
          hypothesisIds: [],
          createdAt: 2,
          updatedAt: 2,
          deletedAt: null,
        },
      ],
      hypotheses: [createHypothesis('Existing', '', [])],
    });

    render(<AnalyzeView {...makeMinimalProps({ outcome: 'Fill Weight' })} />);

    fireEvent.click(screen.getByTestId('scope-chip-scope-day'));

    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'Shift', values: ['Day'] },
    ]);
  });

  it('filters Wall findings to the active scope while leaving other scope findings out', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useProjectStore.setState({ ...getProjectInitialState(), outcome: 'Fill Weight' });
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      scopes: [
        {
          id: 'scope-night',
          projectId: 'hub-test',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
          hypothesisIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
      findings: [
        { ...createFinding('Night shift note', {}, null), id: 'f-night', scopeId: 'scope-night' },
        { ...createFinding('Day shift note', {}, null), id: 'f-day', scopeId: 'scope-day' },
        { ...createFinding('Loose note', {}, null), id: 'f-loose' },
      ],
      hypotheses: [createHypothesis('Existing', '', [])],
    });
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Shift', values: ['Night'] }],
    });

    render(<AnalyzeView {...makeMinimalProps()} />);

    expect(
      (capturedWallCanvasProps.current?.findings as Array<{ id: string }>).map(f => f.id)
    ).toEqual(['f-night']);
  });

  it('passes all Wall findings when no active scope is selected, including loose findings', () => {
    useCanvasViewportStore.getState().setViewMode('wall');
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      findings: [
        { ...createFinding('Night shift note', {}, null), id: 'f-night', scopeId: 'scope-night' },
        { ...createFinding('Day shift note', {}, null), id: 'f-day', scopeId: 'scope-day' },
        { ...createFinding('Loose note', {}, null), id: 'f-loose' },
      ],
      hypotheses: [createHypothesis('Existing', '', [])],
    });

    render(<AnalyzeView {...makeMinimalProps()} />);

    expect(
      (capturedWallCanvasProps.current?.findings as Array<{ id: string }>).map(f => f.id)
    ).toEqual(['f-night', 'f-day', 'f-loose']);
  });

  it('passes only active-scope findings into FindingsLog', () => {
    useCanvasViewportStore.getState().setViewMode('map');
    useProjectStore.setState({ ...getProjectInitialState(), outcome: 'Fill Weight' });
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      scopes: [
        {
          id: 'scope-night',
          projectId: 'hub-test',
          outcome: 'Fill Weight',
          predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
          hypothesisIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
      findings: [
        { ...createFinding('Night shift note', {}, null), id: 'f-night', scopeId: 'scope-night' },
        { ...createFinding('Loose note', {}, null), id: 'f-loose' },
      ],
    });
    useAnalysisScopeStore.setState({
      categoricalFilters: [{ column: 'Shift', values: ['Night'] }],
    });

    render(<AnalyzeView {...makeMinimalProps()} />);

    expect(
      (capturedFindingsLogProps.current?.findings as Array<{ id: string }>).map(f => f.id)
    ).toEqual(['f-night']);
  });

  it('list/board sub-toggle is visible in Findings mode', () => {
    // IM-1: the `tree` sub-toggle was removed — AnalyzeView now only renders
    // list + board sub-toggles in Findings mode (question-tree view retired with Question entity).
    useCanvasViewportStore.getState().setViewMode('map');
    render(<AnalyzeView {...makeMinimalProps()} />);
    expect(screen.getByRole('button', { name: /^list$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^board$/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^tree$/i })).toBeNull();
  });

  it('list/board sub-toggle is hidden in Wall mode', () => {
    useCanvasViewportStore.getState().setViewMode('wall');

    render(<AnalyzeView {...makeMinimalProps()} />);

    expect(screen.queryByRole('button', { name: /^list$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^board$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^tree$/i })).toBeNull();
  });

  describe('Evidence Map demotion (AW-4)', () => {
    it('does not expose the Evidence Map content switch in primary Analyze', () => {
      useCanvasViewportStore.getState().setViewMode('map');
      render(<AnalyzeView {...makeMinimalProps()} />);

      expect(screen.getByTestId('findings-log')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^evidence map$/i })).toBeNull();
      expect(screen.queryByTestId('analyze-evidence-map')).toBeNull();
    });
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

    render(<AnalyzeView {...makeMinimalProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Project' }));

    expect(showCharterMock).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(RETURN_NAVIGATION_STORAGE_KEY)).toBeNull();
  });

  it('mounts WallCanvas with the onExploreFactor wire (CS-13)', () => {
    // Render in wall mode — mirrors the onProposeHypothesis assertion pattern.
    useCanvasViewportStore.getState().setViewMode('wall');
    capturedWallCanvasProps.current = null;
    render(<AnalyzeView {...makeMinimalProps()} />);
    // The `as` re-widens — tsc otherwise narrows `current` to null at the reset
    // above (render()'s mutation is opaque to control-flow analysis).
    const wallProps = capturedWallCanvasProps.current as Record<string, unknown> | null;
    expect(wallProps?.onExploreFactor).toBeTypeOf('function');
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
        <AnalyzeView
          {...makeMinimalProps({
            planningProps: {
              plans: [],
              members: [],
              currentUserId: 'analyst@local',
              onAddPlan,
              onLinkFinding,
              onEditPlan,
            },
          })}
        />
      );

      // WallCanvas should have received planningProps
      expect(capturedWallCanvasProps.current?.planningProps).toBeDefined();
      const pp = capturedWallCanvasProps.current?.planningProps as Record<string, unknown>;
      expect(pp.currentUserId).toBe('analyst@local');
      expect(pp.onAddPlan).toBe(onAddPlan);
      expect(pp.onLinkFinding).toBe(onLinkFinding);
      expect(pp.onEditPlan).toBe(onEditPlan);
    });

    it('does not pass planningProps to WallCanvas when omitted', () => {
      render(<AnalyzeView {...makeMinimalProps()} />);
      expect(capturedWallCanvasProps.current?.planningProps).toBeUndefined();
    });
  });

  // FE-1 — the model-builder band is wired through AnalyzeView into WallCanvas.
  // WallCanvas is mocked (capturedWallCanvasProps), so we assert the APP-OWNED
  // seam: AnalyzeView builds modelBuilderProps from the store outcome + the
  // factors prop, threads the scope rows, and routes onCaptureModel to
  // findingsState (Finding + projection.modelContext). Dead wiring fails these.
  describe('model-builder band wiring (FE-1)', () => {
    beforeEach(() => {
      capturedWallCanvasProps.current = null;
      useCanvasViewportStore.getState().setViewMode('wall');
      useProjectStore.setState({ outcome: 'Y' });
    });

    it('threads modelBuilderProps (candidateFactors + scopeLabel + onCaptureModel) to WallCanvas', () => {
      render(
        <AnalyzeView
          {...makeMinimalProps({
            factors: ['Shift', 'Noise'],
            filteredData: [{ Shift: 'A', Y: 1 }],
          })}
        />
      );
      const mbp = capturedWallCanvasProps.current?.modelBuilderProps as
        | Record<string, unknown>
        | undefined;
      expect(mbp).toBeDefined();
      expect(mbp!.candidateFactors).toEqual(['Shift', 'Noise']);
      expect(mbp!.scopeLabel).toBe('All data');
      expect(typeof mbp!.onCaptureModel).toBe('function');
    });

    it('does NOT thread modelBuilderProps when no factors are provided', () => {
      render(<AnalyzeView {...makeMinimalProps({ factors: [] })} />);
      expect(capturedWallCanvasProps.current?.modelBuilderProps).toBeUndefined();
    });

    it('onCaptureModel creates a Finding + stamps the model snapshot into projection.modelContext', () => {
      // FE-1 fix: PWA capture writes to useAnalyzeStore (the PWA Wall's reactive
      // source of truth), NOT findingsState — so the captured model renders on
      // the Wall. Assert against the real store, not the findingsState prop.
      useAnalyzeStore.setState(getAnalyzeInitialState());
      render(
        <AnalyzeView
          {...makeMinimalProps({
            factors: ['Shift'],
            filteredData: [{ Shift: 'A', Y: 1 }],
          })}
        />
      );
      const onCaptureModel = (
        capturedWallCanvasProps.current!.modelBuilderProps as Record<string, unknown>
      ).onCaptureModel as (s: {
        factors: string[];
        rSquaredAdj: number;
        perFactorP: Record<string, number>;
        scopeLabel: string;
        topFactor: string | null;
      }) => void;
      onCaptureModel({
        factors: ['Shift'],
        rSquaredAdj: 0.71,
        perFactorP: { Shift: 0.002 },
        scopeLabel: 'All data',
        topFactor: 'Shift',
      });
      const captured = useAnalyzeStore
        .getState()
        .findings.find(f => f.projection?.modelContext?.rSquaredAdj !== undefined);
      expect(captured).toBeDefined();
      expect(captured!.projection?.modelContext?.rSquaredAdj).toBeCloseTo(0.71, 10);
      expect(captured!.projection?.modelContext?.linkedFactor).toBe('Shift');
    });
  });
});

// Wall empty-state CTA wiring (Bug 2 — investigations.md 2026-06-04).
// The CTAs were never passed to the destination WallCanvas mount; only the
// retired CanvasWallOverlay ever wired them. These tests assert the PWA seam:
// AnalyzeView → WallCanvas → (mock) CTA buttons create hubs via useAnalyzeStore.
describe('PWA AnalyzeView — Wall empty-state CTA wiring (Bug 2)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    useProjectStore.setState(getProjectInitialState());
    useAnalyzeStore.setState(getAnalyzeInitialState());
    capturedWallCanvasProps.current = null;
  });

  it('(a) zero hubs — clicking "Add a suspected cause" creates one hub named "New suspected cause"', () => {
    render(<AnalyzeView {...makeMinimalProps({ factors: [] })} />);

    // The empty-state renders because hubs.length === 0
    fireEvent.click(screen.getByTestId('empty-write-hypothesis'));

    const hubs = useAnalyzeStore.getState().hypotheses;
    expect(hubs).toHaveLength(1);
    expect(hubs[0].name).toBe('New suspected cause');
  });

  it('(c) NEGATIVE CONTROL — zero candidate factors → Seed button NOT in document', () => {
    // LOAD-BEARING: fails if onSeedFromFactorIntel gating is dropped
    render(<AnalyzeView {...makeMinimalProps({ factors: [] })} />);

    expect(screen.queryByTestId('empty-seed-factors')).toBeNull();
  });
});
