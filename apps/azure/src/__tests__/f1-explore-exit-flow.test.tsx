/**
 * PR-CCJ-F1 Task 6 — CanvasWorkspace → Explore tab exit wiring e2e.
 *
 * Tests the chain from the CanvasWorkspace → Explore button click through to
 * the panelsStore `activeView` + `pendingExploreIntent` state.
 *
 * Scope: steps 1–6 of the F1 acceptance criteria (intent emission).
 * The Dashboard/Explore consume path (steps 7–8 — clearing pendingExploreIntent
 * on mount) is covered by `EditorDashboardView.test.tsx` / Dashboard.test.tsx
 * rather than this file, which would require mocking useDashboardCharts +
 * the full Explore surface. This scope decision matches the E1 e2e pattern
 * (apps/azure/src/__tests__/e1-create-project-flow.test.tsx) which also
 * limits CanvasWorkspace to a prop-capture mock, avoiding visx + DnD-kit setup.
 *
 * F1 routing row exercised: §4.5 row 4 (`y-plus-one-factor`).
 * Fixture: IP with 1 outcomeSpec (Yield) + 1 factorControl (Vessel).
 * Expected intent: `{ focusedChart: 'boxplot', boxplotFactor: 'Vessel' }`.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewIP } from '@variscout/core/improvementProject';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type { ExploreLandingView } from '@variscout/core/exploreRouting';

// ── Deterministic fixture helpers ─────────────────────────────────────────────

const FIXTURE_TS = 1_700_000_000_000;

function makeOutcomeSpec(columnName: string): OutcomeSpec {
  return {
    id: `os-${columnName}`,
    hubId: 'hub-f1',
    columnName,
    characteristicType: 'nominalIsBest',
    createdAt: 0,
    deletedAt: null,
  };
}

/** Build an IP via the canonical factory so the shape stays type-safe as the
 *  type evolves. Then patch in factorControls via goal override. */
function makeIP(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  const base = createNewIP({
    hubId: 'hub-f1',
    title: 'F1 E2E Test IP',
    issueStatement: 'Yield lower than spec',
    currentUserId: 'tester@test.com',
    currentUserDisplayName: 'Tester',
    now: () => FIXTURE_TS,
    id: 'ip-f1-e2e',
  });
  return {
    ...base,
    goal: {
      ...base.goal,
      factorControls: [{ factor: 'Vessel', targetCondition: 'any' }],
    },
    ...overrides,
  };
}

// ── Store + feature mocks ────────────────────────────────────────────────────

const setProcessContextMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const setOutcomeMock = vi.fn();
const setFactorsMock = vi.fn();
const showExploreMock = vi.fn();
const showAnalyzeMock = vi.fn();
const showCharterMock = vi.fn();
const showSustainmentMock = vi.fn();
const showDashboardMock = vi.fn();
const expandToQuestionMock = vi.fn();
const setWallViewModeMock = vi.fn();
const setAnalyzeViewModeMock = vi.fn();
const addCausalLinkMock = vi.fn();
const linkQuestionToCausalLinkMock = vi.fn();
const removeCausalLinkMock = vi.fn();
const upsertProjectMock = vi.fn();
const clearPendingExploreIntentMock = vi.fn();

// The panelsStore state we can inspect after clicking → Explore.
// Using a mutable ref so the test can read the final value after the
// `showExplore(intent)` call updates it.
interface PendingExploreIntent {
  focusedChart: 'ichart' | 'boxplot';
  boxplotFactor?: string;
}
const panelsStateRef: {
  activeView: string;
  pendingExploreIntent: PendingExploreIntent | null;
} = {
  activeView: 'frame',
  pendingExploreIntent: null,
};

const storeStateRef: { current: Record<string, unknown> } = {
  current: {
    rawData: [],
    outcome: null,
    factors: [],
    setOutcome: setOutcomeMock,
    setFactors: setFactorsMock,
    measureSpecs: {},
    setMeasureSpec: setMeasureSpecMock,
    processContext: { processHubId: 'hub-f1' },
    setProcessContext: setProcessContextMock,
  },
};

const investigationStateRef: { current: Record<string, unknown> } = {
  current: {
    findings: [],
    questions: [],
    hypotheses: [],
    causalLinks: [],
    addCausalLink: addCausalLinkMock,
    linkQuestionToCausalLink: linkQuestionToCausalLinkMock,
    removeCausalLink: removeCausalLinkMock,
  },
};

const improvementProjectStateRef: { current: Record<string, unknown> } = {
  current: {
    projectsByHub: {},
    getProjectsForHub: () => [],
    upsertProject: upsertProjectMock,
  },
};

const hoisted = vi.hoisted(() => ({
  canvasWorkspaceMock: vi.fn(),
  listByHubMock: vi.fn(),
  actionItemsListByHubMock: vi.fn(),
  controlRecordsListByHubMock: vi.fn(),
  controlHandoffsListByHubMock: vi.fn(),
  dispatchMock: vi.fn(),
}));

vi.mock('@variscout/stores', () => ({
  useProjectStore: vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
  useAnalyzeStore: Object.assign(
    vi.fn((selector: (s: unknown) => unknown) => selector(investigationStateRef.current)),
    { getState: () => investigationStateRef.current }
  ),
  useImprovementProjectStore: Object.assign(
    vi.fn((selector: (s: unknown) => unknown) => selector(improvementProjectStateRef.current)),
    { getState: () => improvementProjectStateRef.current }
  ),
  useCanvasViewportStore: Object.assign(vi.fn(), {
    getState: () => ({ setViewMode: setWallViewModeMock }),
  }),
}));

// CanvasWorkspace is mocked to avoid rendering the full canvas tree (visx,
// DnD-kit, FocusTrap). The mock exposes a "simulate → Explore click" button
// that invokes the `onExploreExit` prop with a y-plus-one-factor landing view
// (Yield + Vessel fixture). This lets the test verify the FrameView →
// panelsStore chain without driving the real ExploreExitButton.
vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  const React = await import('react');
  return {
    ...actual,
    NoActiveProjectGuidance: (props: {
      onGoHome: () => void;
      heading?: string;
      description?: string;
      ctaLabel?: string;
    }) =>
      React.createElement(
        'section',
        { role: 'alert', 'data-testid': 'no-active-project-guidance' },
        React.createElement(
          'button',
          { type: 'button', onClick: props.onGoHome },
          props.ctaLabel ?? 'Go to Home'
        )
      ),
    InboxDigest: () => React.createElement('div', { 'data-testid': 'inbox-digest' }),
    CanvasWorkspace: (props: Record<string, unknown>) => {
      hoisted.canvasWorkspaceMock(props);
      const onExploreExit = props.onExploreExit as
        | ((landing: ExploreLandingView) => void)
        | undefined;
      // Expose a button the test can click to simulate the → Explore button
      // inside EditModeToolbar. The landing view matches the y-plus-one-factor
      // route (Yield + Vessel: §4.5 row 4).
      return React.createElement(
        'div',
        { 'data-testid': 'canvas-workspace' },
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'simulate-explore-exit',
            onClick: () => {
              onExploreExit?.({
                isEnabled: true,
                focusedChart: 'boxplot',
                boxplotFactor: 'Vessel',
                previewText: 'will land on I-Chart + Boxplot by Vessel',
                routeKey: 'y-plus-one-factor',
              });
            },
          },
          'Simulate → Explore'
        )
      );
    },
  };
});

vi.mock('../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({
      showExplore: (intent?: PendingExploreIntent) => {
        showExploreMock(intent);
        panelsStateRef.activeView = 'explore';
        panelsStateRef.pendingExploreIntent = intent ?? null;
      },
      showAnalyze: showAnalyzeMock,
      showCharter: showCharterMock,
      showControl: showSustainmentMock,
      showDashboard: showDashboardMock,
      setAnalyzeViewMode: setAnalyzeViewModeMock,
      clearPendingExploreIntent: clearPendingExploreIntentMock,
    }),
  }),
}));

vi.mock('../features/analyze/analyzeStore', () => ({
  useAnalyzeFeatureStore: Object.assign(vi.fn(), {
    getState: () => ({ expandToQuestion: expandToQuestionMock }),
  }),
}));

vi.mock('../persistence', () => ({
  azureHubRepository: {
    dispatch: hoisted.dispatchMock,
    evidenceSnapshots: { listByHub: hoisted.listByHubMock },
    actionItems: { listByHub: hoisted.actionItemsListByHubMock },
    controlRecords: { listByHub: hoisted.controlRecordsListByHubMock },
    controlHandoffs: { listByHub: hoisted.controlHandoffsListByHubMock },
  },
}));

import FrameView from '../components/editor/FrameView';

describe('PR-CCJ-F1 Task 6 — → Explore exit wiring e2e', () => {
  beforeEach(() => {
    hoisted.canvasWorkspaceMock.mockClear();
    hoisted.listByHubMock.mockReset();
    hoisted.listByHubMock.mockResolvedValue([]);
    hoisted.actionItemsListByHubMock.mockReset();
    hoisted.actionItemsListByHubMock.mockResolvedValue([]);
    hoisted.controlRecordsListByHubMock.mockReset();
    hoisted.controlRecordsListByHubMock.mockResolvedValue([]);
    hoisted.controlHandoffsListByHubMock.mockReset();
    hoisted.controlHandoffsListByHubMock.mockResolvedValue([]);
    showExploreMock.mockClear();
    panelsStateRef.activeView = 'frame';
    panelsStateRef.pendingExploreIntent = null;
    storeStateRef.current = {
      rawData: [],
      outcome: null,
      factors: [],
      setOutcome: setOutcomeMock,
      setFactors: setFactorsMock,
      measureSpecs: {},
      setMeasureSpec: setMeasureSpecMock,
      processContext: { processHubId: 'hub-f1' },
      setProcessContext: setProcessContextMock,
    };
    improvementProjectStateRef.current = {
      projectsByHub: {},
      getProjectsForHub: () => [],
      upsertProject: upsertProjectMock,
    };
  });

  it('clicking → Explore sets activeView=explore + pendingExploreIntent in panelsStore', async () => {
    // ── Step 1: build an IP with 1 outcomeSpec (Yield) + 1 factorControl (Vessel) ──
    const ip = makeIP();
    const outcomeSpecs = [makeOutcomeSpec('Yield')];

    // ── Step 2: render FrameView with activeIP + outcomeSpecs ──
    // outcomeSpecs are normally threaded from Editor.tsx via activeHub.outcomes;
    // in this test we pass them directly as props (post-F1 FrameViewProps).
    render(<FrameView activeIP={ip} outcomeSpecs={outcomeSpecs} />);

    // Wait for FrameView's mount effects (snapshot + action-item loaders) to
    // flush before asserting, avoiding act() warnings.
    await waitFor(() => expect(hoisted.canvasWorkspaceMock).toHaveBeenCalled());

    // ── Step 3: CanvasWorkspace received the props ──
    expect(screen.queryByTestId('no-active-project-guidance')).not.toBeInTheDocument();
    expect(screen.getByTestId('canvas-workspace')).toBeInTheDocument();

    const canvasProps = hoisted.canvasWorkspaceMock.mock.lastCall?.[0] as Record<string, unknown>;
    expect(typeof canvasProps.onExploreExit).toBe('function');
    // outcomeSpecs threaded through so the gate check has the Yield spec
    expect(canvasProps.outcomeSpecs).toEqual(outcomeSpecs);

    // ── Step 4: verify panelsStore starts in 'frame' state ──
    expect(panelsStateRef.activeView).toBe('frame');
    expect(panelsStateRef.pendingExploreIntent).toBeNull();

    // ── Step 5: simulate the → Explore button click ──
    // The mocked CanvasWorkspace exposes a button that calls onExploreExit
    // with the y-plus-one-factor landing view (Yield + Vessel → §4.5 row 4).
    act(() => {
      fireEvent.click(screen.getByTestId('simulate-explore-exit'));
    });

    // ── Step 6: assert panelsStore.showExplore was called with intent ──
    expect(showExploreMock).toHaveBeenCalledTimes(1);
    expect(showExploreMock).toHaveBeenCalledWith({
      focusedChart: 'boxplot',
      boxplotFactor: 'Vessel',
    });

    // ── Step 6b: assert panelsStore state reflects the intent ──
    expect(panelsStateRef.activeView).toBe('explore');
    expect(panelsStateRef.pendingExploreIntent).toEqual({
      focusedChart: 'boxplot',
      boxplotFactor: 'Vessel',
    });
  });

  it('FrameView with null activeIP renders NoActiveProjectGuidance (guards the chain)', async () => {
    render(<FrameView activeIP={null} />);
    expect(await screen.findByTestId('no-active-project-guidance')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas-workspace')).not.toBeInTheDocument();
  });
});
