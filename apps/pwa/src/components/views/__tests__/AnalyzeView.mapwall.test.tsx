/**
 * Tests for Map/Wall toggle wired into PWA AnalyzeView.
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
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── 1. Mocks BEFORE component imports ──────────────────────────────────────

const showCharterMock = vi.hoisted(() => vi.fn());
const capturedWallCanvasProps = vi.hoisted(() => ({
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
    AnalyzePhaseBadge: () => null,
    AnalyzeConclusion: () => null,
    FindingsLog: () => <div data-testid="findings-log" />,
    useWallIsMobile: () => false,
    WallCanvas: (props: {
      hubs: unknown[];
      planningProps?: Record<string, unknown>;
      onWriteHypothesis?: () => void;
      onSeedFromFactorIntel?: () => void;
    }) => {
      // Capture props for assertion in planningProps tests
      capturedWallCanvasProps.current = props as Record<string, unknown>;
      return props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" />
      ) : (
        <div data-testid="wall-canvas-empty">
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
  getCanvasViewportInitialState,
  getProjectInitialState,
  useAnalyzeStore,
  useCanvasViewportStore,
  useProjectStore,
} from '@variscout/stores';
import { DEFAULT_PROCESS_HUB_ID } from '@variscout/core';
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
    // IM-1 (ADR-085): questionsState / handleCreateQuestion / factorIntelQuestions /
    // handleQuestionClick / questionsMap / ideaImpacts are all removed from
    // AnalyzeViewProps — they were tied to the retired Question entity.
    columnAliases: {},
    resolvedMode: 'standard' as never,
    ...overrides,
  };
}

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('PWA AnalyzeView Map/Wall toggle', () => {
  beforeEach(() => {
    // Reset canvasViewportStore to initial state (viewMode = 'map')
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    // Reset project store (no processMap by default)
    useProjectStore.setState(getProjectInitialState());
    window.sessionStorage.clear();
    showCharterMock.mockClear();
  });

  it('defaults to Map view — Map button has aria-pressed="true"', () => {
    render(<AnalyzeView {...makeMinimalProps()} />);

    const mapBtn = screen.getByRole('button', { name: /^map$/i });
    expect(mapBtn.getAttribute('aria-pressed')).toBe('true');

    const wallBtn = screen.getByRole('button', { name: /^wall$/i });
    expect(wallBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders FindingsLog by default (Map mode)', () => {
    render(<AnalyzeView {...makeMinimalProps()} />);
    expect(screen.getByTestId('findings-log')).toBeTruthy();
  });

  it('switches to Wall on click and persists state in the store', () => {
    render(<AnalyzeView {...makeMinimalProps()} />);

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

  it('list/board sub-toggle is visible in Map mode', () => {
    // IM-1: the `tree` sub-toggle was removed — AnalyzeView now only renders
    // list + board sub-toggles in Map mode (question-tree view retired with Question entity).
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

  // ── PR-CS-7: Evidence Map (Layer 1) parity in PWA Analyze ──────────────────
  // A factor that cleanly separates the outcome (eta² high) yields a meaningful
  // best-subsets model so the Evidence Map content switch enables; selecting it
  // mounts the Layer-1 graph host. Layers 2/3 self-suppress (no causal/convergence
  // data passed to useEvidenceMapData). FindingsLog stays reachable via Findings.
  describe('Evidence Map content switch (PR-CS-7)', () => {
    // The responsive EvidenceMap wrapper (visx withParentSize) calls
    // `new ResizeObserver(...)` on mount. jsdom/happy-dom has none — provide a
    // no-op stub so the host mounts cleanly (the inner SVG only paints once a
    // non-zero size is observed, which the real browser supplies).
    const originalResizeObserver = globalThis.ResizeObserver;
    beforeEach(() => {
      class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
      globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
    });
    afterEach(() => {
      globalThis.ResizeObserver = originalResizeObserver;
    });

    // Two factors; `Machine` strongly drives Y so best-subsets rSquaredAdj > 0.05.
    const evidenceData = [
      { Machine: 'A', Shift: 'Day', Y: 10 },
      { Machine: 'A', Shift: 'Night', Y: 11 },
      { Machine: 'A', Shift: 'Day', Y: 10 },
      { Machine: 'A', Shift: 'Night', Y: 12 },
      { Machine: 'B', Shift: 'Day', Y: 30 },
      { Machine: 'B', Shift: 'Night', Y: 31 },
      { Machine: 'B', Shift: 'Day', Y: 29 },
      { Machine: 'B', Shift: 'Night', Y: 32 },
    ];

    // AnalyzeView reads `outcome` from useProjectStore (not the prop), so the
    // Layer-1 stat gate keys off the store outcome. Seed it for these cases.
    function evidenceProps() {
      useProjectStore.setState({ outcome: 'Y' });
      return makeMinimalProps({
        outcome: 'Y',
        factors: ['Machine', 'Shift'],
        filteredData: evidenceData,
      });
    }

    it('exposes a Findings / Evidence Map content switch in Map mode', () => {
      render(<AnalyzeView {...evidenceProps()} />);
      expect(screen.getByRole('button', { name: /^findings$/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /^evidence map$/i })).toBeTruthy();
    });

    it('enables the Evidence Map button when a meaningful model exists', () => {
      render(<AnalyzeView {...evidenceProps()} />);
      const mapBtn = screen.getByRole('button', { name: /^evidence map$/i });
      expect(mapBtn.hasAttribute('disabled')).toBe(false);
    });

    it('disables the Evidence Map button with no factors (no model)', () => {
      useProjectStore.setState({ outcome: 'Y' });
      render(
        <AnalyzeView {...makeMinimalProps({ outcome: 'Y', factors: [], filteredData: [] })} />
      );
      const mapBtn = screen.getByRole('button', { name: /^evidence map$/i });
      expect(mapBtn.hasAttribute('disabled')).toBe(true);
    });

    it('mounts the Evidence Map host (Layer 1) when selected; findings stays reachable', () => {
      render(<AnalyzeView {...evidenceProps()} />);

      // Default content is the findings list.
      expect(screen.getByTestId('findings-log')).toBeTruthy();
      expect(screen.queryByTestId('analyze-evidence-map')).toBeNull();

      // Switch to the Evidence Map graph.
      fireEvent.click(screen.getByRole('button', { name: /^evidence map$/i }));
      expect(screen.getByTestId('analyze-evidence-map')).toBeTruthy();
      expect(screen.queryByTestId('findings-log')).toBeNull();

      // Findings list is still reachable.
      fireEvent.click(screen.getByRole('button', { name: /^findings$/i }));
      expect(screen.getByTestId('findings-log')).toBeTruthy();
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

  it('(a) zero hubs — clicking "Write a suspected mechanism" creates one hub named "New mechanism branch"', () => {
    render(<AnalyzeView {...makeMinimalProps({ factors: [] })} />);

    // The empty-state renders because hubs.length === 0
    fireEvent.click(screen.getByTestId('empty-write-hypothesis'));

    const hubs = useAnalyzeStore.getState().hypotheses;
    expect(hubs).toHaveLength(1);
    expect(hubs[0].name).toBe('New mechanism branch');
  });

  it('(c) NEGATIVE CONTROL — zero candidate factors → Seed button NOT in document', () => {
    // LOAD-BEARING: fails if onSeedFromFactorIntel gating is dropped
    render(<AnalyzeView {...makeMinimalProps({ factors: [] })} />);

    expect(screen.queryByTestId('empty-seed-factors')).toBeNull();
  });
});
