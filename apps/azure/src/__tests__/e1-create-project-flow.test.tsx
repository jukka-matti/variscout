/**
 * PR-CCJ-E1 Task 7 — Home create → Process edit → state persists e2e.
 *
 * Exercises the full E1 happy path as a chain of focused render steps rather
 * than booting the ~2000-line Editor.tsx surface (whose setup dwarfs the test
 * value). Each step proves one link in the chain; together they cover:
 *
 *   1. CreateProjectModal Save emits { title, issueStatement } payload.
 *   2. createNewIP factory produces a default-shaped IP from that payload
 *      (status='active', Lead member, empty sections, Canvas fields undefined).
 *   3. FrameView with the new IP renders CanvasWorkspace (not the
 *      NoActiveProjectGuidance empty state) and forwards the IP downstream.
 *   4. CanvasWorkspace's onPersistCanvasState callback is wired to the store's
 *      upsertProject (proves the persist edge of the chain).
 *   5. Re-rendering FrameView with an updated IP (stepTimings populated)
 *      surfaces the new shape via the CanvasWorkspace `activeIP` prop —
 *      proving the activeIP-backed read path holds across simulated reload.
 *
 * The CanvasWorkspace + NoActiveProjectGuidance + InboxDigest are mocked at
 * the `@variscout/ui` boundary (same pattern as FrameView.test.tsx) so we
 * assert wiring without dragging visx, FocusTrap, Tailwind classes, or
 * DnD-kit infrastructure into the test.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewIP } from '@variscout/core/improvementProject';
import type { ImprovementProject } from '@variscout/core/improvementProject';

// Named timestamps for the deterministic e2e clock. `MOCK_CREATE_TS` is the
// value `createNewIP` stamps onto `createdAt` / `updatedAt`;
// `MOCK_PERSIST_TS` is the strictly-greater value the mocked Canvas modal
// returns on save so `expect(updatedAt).toBeGreaterThan(...)` is meaningful.
const MOCK_CREATE_TS = 1_700_000_000_000;
const MOCK_PERSIST_TS = 2_000_000_000_000;

// ── App-store mocks (mirrors FrameView.test.tsx pattern) ────────────────────

const setProcessContextMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const setOutcomeMock = vi.fn();
const setFactorsMock = vi.fn();
const showExploreMock = vi.fn();
const showImprovementMock = vi.fn();
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

const storeStateRef: { current: Record<string, unknown> } = {
  current: {
    rawData: [],
    outcome: null,
    factors: [],
    setOutcome: setOutcomeMock,
    setFactors: setFactorsMock,
    measureSpecs: {},
    setMeasureSpec: setMeasureSpecMock,
    processContext: null,
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
    projectsById: {},
    getProjectForHub: () => undefined,
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

// T7: keep the real CreateProjectModal (we drive its inputs end-to-end) but
// stub the heavy Canvas surface + empty-state guidance. Two-mode mock via
// importOriginal — pull everything from the real module, then override only
// the components we want to flatten.
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
        React.createElement('h2', null, props.heading ?? 'No active project'),
        React.createElement('p', null, props.description ?? 'default description'),
        React.createElement(
          'button',
          { type: 'button', onClick: props.onGoHome },
          props.ctaLabel ?? 'Go to Home'
        )
      ),
    InboxDigest: (props: { prompts: unknown[]; onNavigate: (prompt: unknown) => void }) =>
      React.createElement('div', {
        'data-testid': 'inbox-digest',
        'data-count': props.prompts.length,
      }),
    CanvasWorkspace: (props: Record<string, unknown>) => {
      hoisted.canvasWorkspaceMock(props);
      const activeIP = props.activeIP as { stepTimings?: unknown[] } | null | undefined;
      const stepTimingsCount = activeIP?.stepTimings?.length ?? 0;
      return React.createElement(
        'div',
        { 'data-testid': 'canvas-workspace' },
        React.createElement(
          'div',
          { 'data-testid': 'canvas-active-ip-id' },
          (activeIP as { id?: string } | null)?.id ?? ''
        ),
        React.createElement(
          'div',
          { 'data-testid': 'canvas-step-timings-count' },
          String(stepTimingsCount)
        ),
        // Expose a button that simulates a Canvas Edit-mode modal save by
        // invoking onPersistCanvasState with an updated IP. This lets the
        // test drive the persist edge of the chain without rendering the
        // real Calc / StepTimings / TimeAsFactors modals.
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'canvas-simulate-modal-save',
            onClick: () => {
              const persist = props.onPersistCanvasState as ((next: unknown) => void) | undefined;
              if (!activeIP || !persist) return;
              persist({
                ...activeIP,
                stepTimings: [
                  {
                    kind: 'paired',
                    stepId: 'step-prep-0',
                    startColumn: 'Prep_start',
                    endColumn: 'Prep_end',
                  },
                ],
                updatedAt: MOCK_PERSIST_TS,
              });
            },
          },
          'Simulate modal save'
        )
      );
    },
  };
});

vi.mock('../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({
      showExplore: showExploreMock,
      showImprovement: showImprovementMock,
      showAnalyze: showAnalyzeMock,
      showCharter: showCharterMock,
      showControl: showSustainmentMock,
      showDashboard: showDashboardMock,
      setAnalyzeViewMode: setAnalyzeViewModeMock,
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

import { CreateProjectModal } from '@variscout/ui';
import FrameView from '../components/editor/FrameView';

describe('PR-CCJ-E1 Task 7 — Home create → Process edit → state persists e2e', () => {
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
    hoisted.dispatchMock.mockReset();
    hoisted.dispatchMock.mockResolvedValue(undefined);
    upsertProjectMock.mockReset();
    showDashboardMock.mockClear();
    storeStateRef.current = {
      rawData: [],
      outcome: null,
      factors: [],
      setOutcome: setOutcomeMock,
      setFactors: setFactorsMock,
      measureSpecs: {},
      setMeasureSpec: setMeasureSpecMock,
      processContext: { processHubId: 'hub-1' },
      setProcessContext: setProcessContextMock,
    };
    improvementProjectStateRef.current = {
      projectsById: {},
      getProjectForHub: () => undefined,
      upsertProject: upsertProjectMock,
    };
  });

  it('user creates a project from Home, navigates to Process, edits canvas, state survives a re-render', async () => {
    // ── Step A: CreateProjectModal Save captures { title, issueStatement } ──
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { unmount: unmountModal } = render(
      <CreateProjectModal onSave={onSave} onClose={onClose} />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Yield investigation' },
    });
    fireEvent.change(screen.getByLabelText(/issue statement/i), {
      target: { value: 'Reactor B yields 3% lower than Reactor A' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      title: 'Yield investigation',
      issueStatement: 'Reactor B yields 3% lower than Reactor A',
    });
    unmountModal();

    // ── Step B: createNewIP produces a default-shaped IP from the payload ──
    const payload = onSave.mock.calls[0]![0] as {
      title: string;
      issueStatement?: string;
    };
    const newIP = createNewIP({
      hubId: 'hub-1',
      title: payload.title,
      issueStatement: payload.issueStatement,
      currentUserId: 'tester@example.com',
      currentUserDisplayName: 'Tester',
      now: () => MOCK_CREATE_TS,
      id: 'ip-e2e-1',
    });

    expect(newIP.id).toBe('ip-e2e-1');
    expect(newIP.hubId).toBe('hub-1');
    expect(newIP.status).toBe('active');
    expect(newIP.metadata.title).toBe('Yield investigation');
    expect(newIP.issueStatement).toBe('Reactor B yields 3% lower than Reactor A');
    expect(newIP.metadata.members ?? []).toHaveLength(1);
    expect((newIP.metadata.members ?? [])[0]).toMatchObject({
      userId: 'tester@example.com',
      displayName: 'Tester',
      role: 'lead',
    });
    expect(newIP.goal.outcomeGoals).toEqual([]);
    // Canvas-Edit-mode fields start absent — populated by later modal saves.
    expect(newIP.processSteps).toBeUndefined();
    expect(newIP.stepTimings).toBeUndefined();
    expect(newIP.formulaBindings).toBeUndefined();
    expect(newIP.timeDecompositionBindings).toBeUndefined();

    // ── Step C: FrameView with the new IP renders CanvasWorkspace ──
    // (not the NoActiveProjectGuidance empty-state guard) and forwards the
    // IP downstream. This proves the activeIP cascade from Home → Process.
    // Wait for CanvasWorkspace to render before asserting so FrameView's
    // mount effects (snapshot / action-item / control-record loaders
    // dispatched via the persistence facade) flush, silencing the noisy
    // "update to FrameView inside a test was not wrapped in act(...)"
    // warning that would otherwise fire when the loaders resolve after the
    // render call returns.
    const { rerender, unmount: unmountFrame } = render(<FrameView activeIP={newIP} />);
    await waitFor(() => expect(hoisted.canvasWorkspaceMock).toHaveBeenCalled());

    expect(screen.queryByTestId('no-active-project-guidance')).not.toBeInTheDocument();
    expect(screen.getByTestId('canvas-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-active-ip-id')).toHaveTextContent('ip-e2e-1');
    expect(screen.getByTestId('canvas-step-timings-count')).toHaveTextContent('0');

    // FrameView forwarded the IP + the store's upsertProject as the
    // onPersistCanvasState callback (proving the persist edge is wired).
    const initialCanvasProps = hoisted.canvasWorkspaceMock.mock.lastCall?.[0] as {
      activeIP: unknown;
      onPersistCanvasState: unknown;
    };
    expect(initialCanvasProps.activeIP).toBe(newIP);
    expect(initialCanvasProps.onPersistCanvasState).toBe(upsertProjectMock);

    // ── Step D: simulate a Canvas Edit-mode modal save ──
    // The mocked CanvasWorkspace exposes a button that invokes
    // onPersistCanvasState with an IP whose stepTimings has been populated.
    act(() => {
      fireEvent.click(screen.getByTestId('canvas-simulate-modal-save'));
    });

    // The persist callback (the store's upsertProject) received the updated
    // IP with stepTimings populated and a fresh updatedAt.
    await waitFor(() => expect(upsertProjectMock).toHaveBeenCalledTimes(1));
    const persistedIP = upsertProjectMock.mock.calls[0]![0] as ImprovementProject;
    expect(persistedIP.id).toBe('ip-e2e-1');
    expect(persistedIP.metadata.title).toBe('Yield investigation');
    expect(persistedIP.issueStatement).toBe('Reactor B yields 3% lower than Reactor A');
    expect(persistedIP.stepTimings).toEqual([
      {
        kind: 'paired',
        stepId: 'step-prep-0',
        startColumn: 'Prep_start',
        endColumn: 'Prep_end',
      },
    ]);
    expect(persistedIP.updatedAt).toBeGreaterThan(newIP.updatedAt);

    // ── Step E: simulate a reload by re-rendering FrameView with the
    //           updated IP. The activeIP-backed read path holds: the new
    //           stepTimings array surfaces through CanvasWorkspace, proving
    //           the Canvas state survives a re-render from the store.
    hoisted.canvasWorkspaceMock.mockClear();
    rerender(<FrameView activeIP={persistedIP} />);
    await waitFor(() => expect(hoisted.canvasWorkspaceMock).toHaveBeenCalled());

    expect(screen.getByTestId('canvas-workspace')).toBeInTheDocument();
    expect(screen.queryByTestId('no-active-project-guidance')).not.toBeInTheDocument();
    expect(screen.getByTestId('canvas-step-timings-count')).toHaveTextContent('1');

    const reloadedCanvasProps = hoisted.canvasWorkspaceMock.mock.lastCall?.[0] as {
      activeIP: { stepTimings?: unknown[] };
    };
    expect(reloadedCanvasProps.activeIP.stepTimings).toHaveLength(1);

    unmountFrame();

    // ── Sanity: when activeIP is null, the Process tab routes back to Home
    //           via NoActiveProjectGuidance (closes the empty-state branch).
    //           `findBy*` waits for FrameView's mount effects (loaders that
    //           still fire even on the empty-state branch) to flush, keeping
    //           the assertion act()-clean.
    render(<FrameView activeIP={null} />);
    expect(await screen.findByTestId('no-active-project-guidance')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas-workspace')).not.toBeInTheDocument();
  });
});
