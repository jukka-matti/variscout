import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const setProcessContextMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const setOutcomeMock = vi.fn();
const setFactorsMock = vi.fn();
const showExploreMock = vi.fn();
const showImprovementMock = vi.fn();
const showAnalyzeMock = vi.fn();
const showCharterMock = vi.fn();
const showSustainmentMock = vi.fn();
const showHomeMock = vi.fn();
const expandToHypothesisMock = vi.fn();
const setWallViewModeMock = vi.fn();
const addCausalLinkMock = vi.fn();
const linkQuestionToCausalLinkMock = vi.fn();
const removeCausalLinkMock = vi.fn();

// E1 T6: Process tab is project-scoped. PWA FrameView guards CanvasWorkspace
// behind `activeIP != null` (resolved via useActiveIPContext). Legacy tests
// cover the post-guard wiring; we supply a default non-null IP-shaped stub
// so the guard passes. The dedicated "Process empty state" test below sets
// activeIPRef.current.activeIP to null to assert the guidance branch.
const DEFAULT_TEST_IP = {
  id: 'ip-default',
  hubId: 'hub-1',
  status: 'active',
  metadata: { title: 'Default test project', members: [] },
  goal: { outcomeGoals: [] },
  sections: {
    background: {},
    investigationLineage: {},
    approach: {},
    outcomeReference: {},
  },
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
};

const activeIPContextRef: { current: { activeIP: unknown } } = {
  current: { activeIP: DEFAULT_TEST_IP },
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
    // E1 T5: FrameView reads `upsertProject` from the store and forwards it
    // to CanvasWorkspace as `onPersistCanvasState`. Mocked as a no-op here —
    // FrameView legacy tests don't exercise the persist callback.
    upsertProject: vi.fn(),
  },
};

const hoisted = vi.hoisted(() => ({
  canvasWorkspaceMock: vi.fn(),
  listByHubMock: vi.fn(),
  actionItemsListByHubMock: vi.fn(),
  sustainmentRecordsListByHubMock: vi.fn(),
  controlHandoffsListByHubMock: vi.fn(),
  dispatchMock: vi.fn(),
  sessionStateRef: { current: { hub: { id: 'hub-1' } as { id: string } | null } },
}));

function actionItem(id: string, text: string, stepId = 'step-1') {
  return {
    id,
    text,
    stepId,
    parentImprovementProjectId: null,
    parentImprovementIdeaId: null,
    createdAt: 1,
    deletedAt: null,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// CS-0 Tasks 5+6: PWA bare "See the data" should seed analysisScopeStore.yColumn.
// Declare via vi.hoisted so the ref is available inside vi.mock factory
// (which is hoisted to the top of the file by Vitest's transform).
const { pwaAnalysisScopeRef, pwaAnalysisScopeStoreMock } = vi.hoisted(() => {
  const ref: { current: { yColumn?: string } } = { current: {} };
  const storeMock = {
    getState: () => ({
      setY: (yColumn: string | undefined) => {
        ref.current.yColumn = yColumn;
      },
    }),
  };
  return { pwaAnalysisScopeRef: ref, pwaAnalysisScopeStoreMock: storeMock };
});

// E1 T5: useActiveIPStore is used by useActiveIPContext (imported by FrameView
// to resolve the active IP). The mock exposes the minimal surface the hook
// reads: `activeIPs` (selector source) + the three action setters + a no-op
// `getState()` returning a getActiveIP that always reports no active IP.
// FrameView tests don't need an active-IP cascade — they cover the legacy
// CanvasWorkspace wiring; this mock makes useActiveIPContext return null
// without crashing.
const noActiveIPStoreState = {
  activeIPs: {},
  rehydrateActiveIP: vi.fn(),
  setActiveIP: vi.fn(),
  clearActiveIP: vi.fn(),
  getActiveIP: () => null,
};
vi.mock('@variscout/stores', () => ({
  useProjectStore: Object.assign(
    vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
    {
      // CS-0: imperative getState() used by handleSeeData to read outcome without
      // adding it as a reactive dep (keeps useCallback deps empty).
      getState: () => storeStateRef.current,
    }
  ),
  useAnalyzeStore: Object.assign(
    vi.fn((selector: (s: unknown) => unknown) => selector(investigationStateRef.current)),
    {
      getState: () => investigationStateRef.current,
    }
  ),
  useImprovementProjectStore: Object.assign(
    vi.fn((selector: (s: unknown) => unknown) => selector(improvementProjectStateRef.current)),
    {
      getState: () => improvementProjectStateRef.current,
    }
  ),
  useCanvasViewportStore: Object.assign(vi.fn(), {
    getState: () => ({
      setViewMode: setWallViewModeMock,
    }),
  }),
  useActiveIPStore: Object.assign(
    vi.fn((selector: (s: unknown) => unknown) => selector(noActiveIPStoreState)),
    {
      getState: () => noActiveIPStoreState,
    }
  ),
  // CS-0 Tasks 5+6: PWA handleSeeData seeds yColumn via useAnalysisScopeStore.getState().setY.
  useAnalysisScopeStore: pwaAnalysisScopeStoreMock,
}));

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    // E1 T6: Process tab "No active project" empty state. Stubbed as plain DOM
    // for guard-branch assertions.
    NoActiveProjectGuidance: (props: {
      onGoHome: () => void;
      heading?: string;
      description?: string;
      ctaLabel?: string;
    }) =>
      React.createElement(
        'section',
        { role: 'alert' },
        React.createElement('h2', null, props.heading ?? 'No active project'),
        React.createElement('p', null, props.description ?? 'default description'),
        React.createElement(
          'button',
          { type: 'button', onClick: props.onGoHome },
          props.ctaLabel ?? 'Go to Home'
        )
      ),
    InboxDigest: (props: { prompts: unknown[]; onNavigate: (prompt: unknown) => void }) =>
      React.createElement(
        'div',
        { 'data-testid': 'inbox-digest', 'data-count': props.prompts.length },
        props.prompts.length > 0
          ? React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => props.onNavigate(props.prompts[0]),
              },
              'Open inbox prompt'
            )
          : null
      ),
    CanvasWorkspace: (props: {
      canvasViewportHubId?: string | null;
      onSeeData: () => void;
      onQuickAction?: (stepId: string) => void;
      onLogQuickAction?: (
        stepId: string,
        payload: { text: string; status: 'open' | 'done'; assignedTo?: unknown; dueAt?: string }
      ) => void;
      onFocusedInvestigation?: (stepId: string) => void;
      onOpenWall?: () => void;
      onOpenInvestigationFocus?: (focus: { kind: string; id: string }) => void;
      onAddCausalLink?: (
        fromFactor: string,
        toFactor: string,
        whyStatement: string,
        options?: { questionIds?: string[] }
      ) => void;
      onRemoveCausalLink?: (linkId: string) => void;
      onCharter?: () => void;
      priorStepStats?: ReadonlyMap<string, unknown>;
      actionItems?: unknown[];
      contextLinkGroups?: { surfaceType: string; items: { id: string }[] }[];
    }) => {
      hoisted.canvasWorkspaceMock(props);
      return React.createElement(
        'div',
        { 'data-testid': 'canvas-workspace' },
        React.createElement(
          'button',
          { type: 'button', 'data-testid': 'see-data', onClick: props.onSeeData },
          'See data'
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'quick-action',
            onClick: () =>
              props.onLogQuickAction?.('step-1', {
                text: 'Refill buffer tank',
                status: 'done',
              }),
          },
          'Quick action'
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'focused-investigation',
            onClick: () => props.onFocusedInvestigation?.('step-1'),
          },
          'Focused investigation'
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'overlay-question',
            // CanvasAnalyzeFocus is a discriminated union with `kind` + `id`.
            // Pass kind:'suspected-cause' so FrameView's handler branch fires and
            // calls expandToHypothesis(focus.id). (ADR-085: Question entity retired.)
            onClick: () => props.onOpenInvestigationFocus?.({ kind: 'suspected-cause', id: 'q-1' }),
          },
          'Overlay focus'
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'open-wall',
            onClick: () => props.onOpenWall?.(),
          },
          'Open wall'
        ),
        React.createElement(
          'button',
          { type: 'button', 'data-testid': 'cta-charter', onClick: props.onCharter },
          'Charter'
        )
      );
    },
  };
});

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({
      showExplore: showExploreMock,
      showImprovement: showImprovementMock,
      showAnalyze: showAnalyzeMock,
      showCharter: showCharterMock,
      showControl: showSustainmentMock,
      showHome: showHomeMock,
    }),
  }),
}));

vi.mock('../../../features/analyze/analyzeStore', () => ({
  useAnalyzeFeatureStore: Object.assign(vi.fn(), {
    getState: () => ({
      // IM-1: expandToQuestion retired; FrameView now calls expandToHypothesis.
      expandToHypothesis: expandToHypothesisMock,
    }),
  }),
}));

vi.mock('../../../persistence', () => ({
  pwaHubRepository: {
    dispatch: hoisted.dispatchMock,
    evidenceSnapshots: {
      listByHub: hoisted.listByHubMock,
    },
    actionItems: {
      listByHub: hoisted.actionItemsListByHubMock,
    },
    controlRecords: {
      listByHub: hoisted.sustainmentRecordsListByHubMock,
    },
    controlHandoffs: {
      listByHub: hoisted.controlHandoffsListByHubMock,
    },
  },
}));

vi.mock('../../../store/sessionStore', () => ({
  useSession: () => hoisted.sessionStateRef.current,
}));

// E1 T6: mock the useActiveIPContext hook directly so legacy tests can
// supply a non-null activeIP (passes the Process tab guard) and the new
// empty-state test can supply null (triggers the guidance branch).
vi.mock('@variscout/hooks', () => ({
  useActiveIPContext: () => activeIPContextRef.current,
}));

import FrameView from '../FrameView';

describe('FrameView (PWA shell)', () => {
  beforeEach(() => {
    pwaAnalysisScopeRef.current = {};
    hoisted.canvasWorkspaceMock.mockClear();
    showExploreMock.mockClear();
    showImprovementMock.mockClear();
    showAnalyzeMock.mockClear();
    showCharterMock.mockClear();
    showSustainmentMock.mockClear();
    showHomeMock.mockClear();
    expandToHypothesisMock.mockClear();
    setWallViewModeMock.mockClear();
    addCausalLinkMock.mockReset();
    linkQuestionToCausalLinkMock.mockReset();
    removeCausalLinkMock.mockReset();
    addCausalLinkMock.mockReturnValue({ id: 'link-created' });
    hoisted.listByHubMock.mockReset();
    hoisted.listByHubMock.mockResolvedValue([]);
    hoisted.actionItemsListByHubMock.mockReset();
    hoisted.actionItemsListByHubMock.mockResolvedValue([]);
    hoisted.sustainmentRecordsListByHubMock.mockReset();
    hoisted.sustainmentRecordsListByHubMock.mockResolvedValue([]);
    hoisted.controlHandoffsListByHubMock.mockReset();
    hoisted.controlHandoffsListByHubMock.mockResolvedValue([]);
    hoisted.dispatchMock.mockReset();
    hoisted.dispatchMock.mockResolvedValue(undefined);
    hoisted.sessionStateRef.current = { hub: { id: 'hub-1' } };
    // E1 T6: reset to default IP-shaped stub so the guard passes for legacy
    // tests. The dedicated empty-state test overrides this in its own body.
    activeIPContextRef.current = { activeIP: DEFAULT_TEST_IP };
    improvementProjectStateRef.current = {
      projectsById: {},
      getProjectForHub: () => undefined,
      upsertProject: vi.fn(),
    };
    storeStateRef.current = {
      rawData: [{ Fill_Weight: 12 }],
      outcome: 'Fill_Weight',
      factors: ['Machine'],
      setOutcome: setOutcomeMock,
      setFactors: setFactorsMock,
      measureSpecs: { Fill_Weight: { target: 12 } },
      setMeasureSpec: setMeasureSpecMock,
      processContext: { currentUnderstanding: 'fill line' },
      setProcessContext: setProcessContextMock,
    };
    investigationStateRef.current = {
      findings: [{ id: 'f-1' }],
      questions: [{ id: 'q-1' }],
      hypotheses: [{ id: 'hub-1' }],
      causalLinks: [{ id: 'link-1' }],
      addCausalLink: addCausalLinkMock,
      linkQuestionToCausalLink: linkQuestionToCausalLinkMock,
      removeCausalLink: removeCausalLinkMock,
    };
  });

  it('passes app store state into the shared Canvas workspace', () => {
    render(<FrameView />);

    expect(screen.getByTestId('canvas-workspace')).toBeInTheDocument();
    expect(hoisted.canvasWorkspaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rawData: [{ Fill_Weight: 12 }],
        outcome: 'Fill_Weight',
        factors: ['Machine'],
        measureSpecs: { Fill_Weight: { target: 12 } },
        canvasViewportHubId: 'hub-1',
        processContext: { currentUnderstanding: 'fill line' },
        setOutcome: setOutcomeMock,
        setFactors: setFactorsMock,
        setMeasureSpec: setMeasureSpecMock,
        setProcessContext: setProcessContextMock,
        findings: [{ id: 'f-1' }],
        // IM-1: Question entity retired; `questions` prop no longer forwarded to CanvasWorkspace.
        hypotheses: [{ id: 'hub-1' }],
        causalLinks: [{ id: 'link-1' }],
      })
    );
  });

  it('passes the active session hub id to CanvasWorkspace when process context has no hub id', () => {
    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { currentUnderstanding: 'fill line' },
    };

    render(<FrameView />);

    expect(hoisted.canvasWorkspaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        canvasViewportHubId: 'hub-1',
      })
    );
  });

  it('passes most-recent snapshot stepCapabilities to CanvasWorkspace as priorStepStats', async () => {
    hoisted.listByHubMock.mockResolvedValue([
      {
        id: 'snap-old',
        hubId: 'hub-1',
        sourceId: 'src-1',
        capturedAt: '2026-05-05T00:00:00.000Z',
        rowCount: 30,
        origin: 'paste',
        importedAt: 1746576000000,
        createdAt: 1746576000000,
        deletedAt: null,
        stepCapabilities: [{ stepId: 'step-1', n: 30, mean: 29, cpk: 1.4 }],
      },
      {
        id: 'snap-new',
        hubId: 'hub-1',
        sourceId: 'src-1',
        capturedAt: '2026-05-07T00:00:00.000Z',
        rowCount: 30,
        origin: 'paste',
        importedAt: 1746576000000,
        createdAt: 1746576000000,
        deletedAt: null,
        stepCapabilities: [{ stepId: 'step-1', n: 30, mean: 30, cpk: 0.8 }],
      },
    ]);

    render(<FrameView />);

    await waitFor(() => expect(hoisted.listByHubMock).toHaveBeenCalledWith('hub-1'));
    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.priorStepStats?.get('step-1')).toEqual({
        stepId: 'step-1',
        n: 30,
        mean: 30,
        cpk: 0.8,
      });
    });
  });

  it('passes action items read for the active session hub to CanvasWorkspace', async () => {
    const actionItems = [actionItem('action-1', 'Check oven gasket seating')];
    hoisted.actionItemsListByHubMock.mockResolvedValue(actionItems);

    render(<FrameView />);

    await waitFor(() => expect(hoisted.actionItemsListByHubMock).toHaveBeenCalledWith('hub-1'));
    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual(actionItems);
    });
  });

  it('replaces previous hub action items when switching hubs and the next read is empty', async () => {
    hoisted.actionItemsListByHubMock
      .mockResolvedValueOnce([actionItem('hub-1-action', 'Hub 1 action')])
      .mockResolvedValueOnce([]);

    const { rerender } = render(<FrameView />);

    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([expect.objectContaining({ text: 'Hub 1 action' })]);
    });

    hoisted.sessionStateRef.current = { hub: { id: 'hub-2' } };
    rerender(<FrameView />);

    await waitFor(() => expect(hoisted.actionItemsListByHubMock).toHaveBeenCalledWith('hub-2'));
    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([]);
    });
  });

  it('clears previous hub action items when switching hubs and the next read fails', async () => {
    hoisted.actionItemsListByHubMock
      .mockResolvedValueOnce([actionItem('hub-1-action', 'Hub 1 action')])
      .mockRejectedValueOnce(new Error('hub 2 unavailable'));

    const { rerender } = render(<FrameView />);

    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([expect.objectContaining({ text: 'Hub 1 action' })]);
    });

    hoisted.sessionStateRef.current = { hub: { id: 'hub-2' } };
    rerender(<FrameView />);

    await waitFor(() => expect(hoisted.actionItemsListByHubMock).toHaveBeenCalledWith('hub-2'));
    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([]);
    });
  });

  it('does not read snapshots when there is no active session hub', () => {
    hoisted.sessionStateRef.current = { hub: null };

    render(<FrameView />);

    expect(hoisted.listByHubMock).not.toHaveBeenCalled();
    expect(hoisted.actionItemsListByHubMock).not.toHaveBeenCalled();
    const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
    expect(props?.priorStepStats?.size).toBe(0);
  });

  it('wires See Data to the PWA Analysis panel action', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(showExploreMock).toHaveBeenCalledTimes(1);
  });

  it('dispatches ACTION_ITEM_ADD when Canvas logs a quick action', async () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('quick-action'));

    await waitFor(() => expect(hoisted.dispatchMock).toHaveBeenCalledTimes(1));
    expect(hoisted.dispatchMock).toHaveBeenCalledWith({
      kind: 'ACTION_ITEM_ADD',
      hubId: 'hub-1',
      actionItem: expect.objectContaining({
        id: expect.any(String),
        text: 'Refill buffer tank',
        stepId: 'step-1',
        parentImprovementProjectId: null,
        parentImprovementIdeaId: null,
        status: 'done',
        assignedTo: null,
        dueAt: null,
        doneAt: expect.any(String),
        doneBy: null,
        createdBy: { displayName: 'Local browser' },
        createdAt: expect.any(Number),
        deletedAt: null,
      }),
    });
    expect(showImprovementMock).not.toHaveBeenCalled();
  });

  it('shows session-only quick actions immediately when repository persistence is unavailable', async () => {
    hoisted.actionItemsListByHubMock.mockRejectedValue(new Error('hub not persisted'));
    hoisted.dispatchMock.mockRejectedValue(new Error('hub not persisted'));

    render(<FrameView />);

    fireEvent.click(screen.getByTestId('quick-action'));

    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([
        expect.objectContaining({
          text: 'Refill buffer tank',
          stepId: 'step-1',
          status: 'done',
          parentImprovementProjectId: null,
          parentImprovementIdeaId: null,
        }),
      ]);
    });
    expect(hoisted.dispatchMock).toHaveBeenCalledTimes(1);
  });

  it('does not apply a post-dispatch refresh after switching to another hub', async () => {
    const refresh = deferred<unknown[]>();
    let hubOneReadCount = 0;
    hoisted.actionItemsListByHubMock.mockImplementation((hubId: string) => {
      if (hubId === 'hub-1') {
        hubOneReadCount += 1;
        return hubOneReadCount === 1 ? Promise.resolve([]) : refresh.promise;
      }
      return Promise.resolve([]);
    });

    const { rerender } = render(<FrameView />);

    await waitFor(() => expect(hoisted.actionItemsListByHubMock).toHaveBeenCalledWith('hub-1'));

    fireEvent.click(screen.getByTestId('quick-action'));

    await waitFor(() => expect(hubOneReadCount).toBe(2));
    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([
        expect.objectContaining({
          text: 'Refill buffer tank',
          stepId: 'step-1',
        }),
      ]);
    });

    hoisted.sessionStateRef.current = { hub: { id: 'hub-2' } };
    rerender(<FrameView />);

    await waitFor(() => expect(hoisted.actionItemsListByHubMock).toHaveBeenCalledWith('hub-2'));
    await act(async () => {
      refresh.resolve([actionItem('hub-1-refresh', 'Hub 1 refresh action')]);
      await refresh.promise;
      await Promise.resolve();
    });

    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([]);
    });
  });

  it('wires Canvas focused investigation response path to the PWA Investigation panel', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('focused-investigation'));

    expect(showAnalyzeMock).toHaveBeenCalledTimes(1);
  });

  it('opens Investigation and expands a hypothesis for overlay focus', () => {
    // ADR-085: Question entity retired. FrameView.handleOpenInvestigationFocus
    // maps focus.kind === 'suspected-cause' to expandToHypothesis(focus.id).
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('overlay-question'));

    expect(expandToHypothesisMock).toHaveBeenCalledWith('q-1');
    expect(showAnalyzeMock).toHaveBeenCalledTimes(1);
  });

  it('opens Investigation in Wall mode from the Canvas wall drill action', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('open-wall'));

    expect(setWallViewModeMock).toHaveBeenCalledWith('wall');
    expect(showAnalyzeMock).toHaveBeenCalledTimes(1);
  });

  it('wires causal-link mutation callbacks to the investigation store', () => {
    // IM-1: Question entity retired. onAddCausalLink ignores questionIds and calls
    // addCausalLink(from, to, why) directly; linkQuestionToCausalLink is no longer
    // invoked. The options argument is accepted but silently ignored per IM-1 contract.
    render(<FrameView />);

    const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
    expect(props?.onAddCausalLink).toEqual(expect.any(Function));
    expect(props?.onRemoveCausalLink).toEqual(expect.any(Function));

    props.onAddCausalLink('Machine', 'Fill_Weight', 'Machine drift changes fill weight');
    props.onRemoveCausalLink('link-created');

    expect(addCausalLinkMock).toHaveBeenCalledWith(
      'Machine',
      'Fill_Weight',
      'Machine drift changes fill weight'
    );
    expect(linkQuestionToCausalLinkMock).not.toHaveBeenCalled();
    expect(removeCausalLinkMock).toHaveBeenCalledWith('link-created');
  });

  it('wires Canvas charter CTA to the panels-store show action', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('cta-charter'));

    expect(showCharterMock).toHaveBeenCalledTimes(1);
  });

  it('includes sustainment context links when a live record is confirmed', async () => {
    hoisted.sustainmentRecordsListByHubMock.mockResolvedValue([
      {
        id: 'sr-1',
        hubId: 'hub-1',
        investigationId: 'inv-1',
        status: 'confirmed-sustained',
        title: 'Sustain Reduce rework',
        consecutiveOnTargetTicks: 4,
        hasOverride: false,
        lastEvaluatedSnapshotId: undefined,
        cadence: 'monthly',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      },
    ]);

    render(<FrameView />);

    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(
        props?.contextLinkGroups?.find(
          (group: { surfaceType: string }) => group.surfaceType === 'sustainment'
        )?.items
      ).toEqual([expect.objectContaining({ id: 'sr-1' })]);
    });
  });

  it('passes the Inbox sustainment target id when opening a lifecycle prompt', async () => {
    const liveIP = {
      id: 'ip-1',
      hubId: 'hub-1',
      status: 'closed',
      metadata: { title: 'Reduce rework' },
      goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 98 }] },
      sections: {
        background: {},
        investigationLineage: {},
        approach: {},
        outcomeReference: {},
      },
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
    };
    improvementProjectStateRef.current = {
      projectsById: { 'ip-1': liveIP },
      getProjectForHub: (hubId: string) => (hubId === 'hub-1' ? liveIP : undefined),
      upsertProject: vi.fn(),
    };

    render(<FrameView />);

    fireEvent.click(await screen.findByRole('button', { name: 'Open inbox prompt' }));

    expect(showSustainmentMock).toHaveBeenCalledWith('ip-1');
  });

  // E1 T6: Process tab "No active project" empty state.
  describe('Process tab guard (E1 T6)', () => {
    it('renders NoActiveProjectGuidance instead of CanvasWorkspace when activeIP is null', () => {
      activeIPContextRef.current = { activeIP: null };

      render(<FrameView />);

      expect(screen.queryByTestId('canvas-workspace')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /no active project/i })).toBeInTheDocument();
      expect(screen.getByText(/process work happens inside a project/i)).toBeInTheDocument();
      expect(hoisted.canvasWorkspaceMock).not.toHaveBeenCalled();
    });

    it('invokes panelsStore.showHome() when the "Go to Home" CTA is clicked', () => {
      activeIPContextRef.current = { activeIP: null };

      render(<FrameView />);

      fireEvent.click(screen.getByRole('button', { name: /go to home/i }));

      expect(showHomeMock).toHaveBeenCalledTimes(1);
    });

    it('renders CanvasWorkspace (not the guidance) when activeIP is non-null', () => {
      render(<FrameView />);

      expect(screen.getByTestId('canvas-workspace')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // CS-0 Tasks 5+6: bare "See the data" should seed analysisScopeStore.yColumn
  // from the current outcome before opening Explore. PWA has no chip path.
  it('CS-0: bare See Data seeds analysisScopeStore.yColumn from the project outcome', () => {
    // Precondition: outcome is set in storeStateRef (set in beforeEach to 'Fill_Weight').
    // pwaAnalysisScopeRef.current.yColumn starts undefined (cleared in beforeEach).
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(pwaAnalysisScopeRef.current.yColumn).toBe('Fill_Weight');
    expect(showExploreMock).toHaveBeenCalledTimes(1);
  });

  it('CS-0: bare See Data does not seed yColumn when outcome is null', () => {
    storeStateRef.current = { ...storeStateRef.current, outcome: null };

    render(<FrameView />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(pwaAnalysisScopeRef.current.yColumn).toBeUndefined();
    expect(showExploreMock).toHaveBeenCalledTimes(1);
  });

  it('CS-0: bare See Data calls showExplore with no arguments (no intent)', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(showExploreMock).toHaveBeenCalledTimes(1);
    expect(showExploreMock).toHaveBeenCalledWith();
  });
});
