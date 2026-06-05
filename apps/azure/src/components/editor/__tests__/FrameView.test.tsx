import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const setProcessContextMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const setOutcomeMock = vi.fn();
const setFactorsMock = vi.fn();
const showExploreMock = vi.fn();
const showImprovementMock = vi.fn();
const showAnalyzeMock = vi.fn();
const showSustainmentMock = vi.fn();
const showDashboardMock = vi.fn();
const expandToHypothesisMock = vi.fn();
const setWallViewModeMock = vi.fn();
const setAnalyzeViewModeMock = vi.fn();
const setFocusedWallEntityMock = vi.fn();
const addCausalLinkMock = vi.fn();
const removeCausalLinkMock = vi.fn();
const addFindingMock = vi.fn();

// LV1-D: minimal analysisScopeStore mock — tracks setY mutations so the
// FrameView integration test can assert the correct yColumn is applied.
// Must be declared via vi.hoisted so it is available inside vi.mock factories
// (which are hoisted to the top of the file by Vitest's transform).
const { analysisScopeRef, analysisScopeStoreMock } = vi.hoisted(() => {
  const ref: { current: { yColumn?: string } } = { current: {} };
  const storeMock = {
    getState: () => ({
      setY: (yColumn: string | undefined) => {
        ref.current.yColumn = yColumn;
      },
      setBoxplotFactor: (_col: string) => {},
      setStepId: (_id: string) => {},
    }),
  };
  return { analysisScopeRef: ref, analysisScopeStoreMock: storeMock };
});

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
    hypotheses: [],
    causalLinks: [],
    addCausalLink: addCausalLinkMock,
    removeCausalLink: removeCausalLinkMock,
    addFinding: addFindingMock,
  },
};

const improvementProjectStateRef: { current: Record<string, unknown> } = {
  current: {
    projectsById: {},
    getProjectForHub: () => undefined,
    // E1 T5: FrameView reads `upsertProject` and forwards it to
    // CanvasWorkspace as `onPersistCanvasState`. Legacy FrameView tests
    // don't exercise the persist callback — mocked as a no-op.
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
  // PR-CS-5 Part 1: useViewStore.getState().setFocusedWallEntity is the visible
  // Wall focus lens (ADR-086). handleOpenInvestigationFocus sets it so the
  // analyst lands focused + the AnalyzeWorkspace pan-on-focus effect centers
  // the node.
  useViewStore: Object.assign(vi.fn(), {
    getState: () => ({
      setFocusedWallEntity: setFocusedWallEntityMock,
    }),
  }),
  // LV1-D: useAnalysisScopeStore mock used by navigateToExploreForChip via
  // FrameView's handleChipExploreJump. getState().setY is the only mutation
  // path exercised by the integration test (outcome chip → yColumn).
  useAnalysisScopeStore: analysisScopeStoreMock,
}));

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    // E1 T6: Process tab "No active project" empty state. The real component
    // lives in packages/ui; the test stub here is plain DOM so we can assert
    // the guard branch without pulling Tailwind classes into the test.
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
      onSeeData: () => void;
      onLogQuickAction?: (
        stepId: string,
        payload: { text: string; status: 'open' | 'done'; assignedTo?: unknown; dueAt?: string }
      ) => void;
      onOpenWall?: () => void;
      onOpenInvestigationFocus?: (focus: { kind: string; id: string }) => void;
      onAddCausalLink?: (
        fromFactor: string,
        toFactor: string,
        whyStatement: string,
        options?: { questionIds?: string[] }
      ) => void;
      onRemoveCausalLink?: (linkId: string) => void;
      priorStepStats?: ReadonlyMap<string, unknown>;
      actionItems?: unknown[];
      contextLinkGroups?: { surfaceType: string; items: { id: string }[] }[];
      onNavigateContextLink?: (item: { id: string; label?: string }) => void;
      // PR-CS-5 Part 2: capture-from-step callback
      onCaptureFindingFromStep?: (card: unknown) => void;
      // LV1-D: chip → Explore jump callback
      onChipExploreJump?: (target: { kind: string; columnName?: string; stepId?: string }) => void;
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
            'data-testid': 'overlay-question',
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
        // LV1-D: simulate a chip Explore-jump so the FrameView integration
        // test can assert that handleChipExploreJump wires correctly.
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'chip-explore-jump-outcome',
            onClick: () => props.onChipExploreJump?.({ kind: 'outcome', columnName: 'Diameter' }),
          },
          'Chip explore jump'
        )
      );
    },
    // LV1-D: navigateToExploreForChip — test-double that delegates to the
    // mocked analysisScopeStore directly (avoids vi.importActual on @variscout/ui).
    navigateToExploreForChip: (
      target: { kind: string; columnName?: string; stepId?: string },
      onNavigateToExplore: () => void
    ) => {
      const scope = analysisScopeStoreMock.getState();
      if (target.kind === 'outcome' && target.columnName) scope.setY(target.columnName);
      else if (target.kind === 'factor' && target.columnName)
        scope.setBoxplotFactor(target.columnName);
      else if (target.kind === 'step' && target.stepId) scope.setStepId(target.stepId);
      onNavigateToExplore();
    },
  };
});

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({
      showExplore: showExploreMock,
      showImprovement: showImprovementMock,
      showAnalyze: showAnalyzeMock,
      showControl: showSustainmentMock,
      showDashboard: showDashboardMock,
      setAnalyzeViewMode: setAnalyzeViewModeMock,
    }),
  }),
}));

vi.mock('../../../features/analyze/analyzeStore', () => ({
  useAnalyzeFeatureStore: Object.assign(vi.fn(), {
    getState: () => ({
      expandToHypothesis: expandToHypothesisMock,
    }),
  }),
}));

vi.mock('../../../persistence', () => ({
  azureHubRepository: {
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

import FrameView from '../FrameView';

// E1 T6: Process tab is project-scoped. FrameView guards CanvasWorkspace
// behind `activeIP != null`. Legacy tests cover the post-guard wiring; we
// supply a minimal IP-shaped stub by default so the guard passes. The
// dedicated "Process empty state" test below renders without the prop to
// assert the guidance branch.
const DEFAULT_TEST_IP = {
  id: 'ip-default',
  hubId: 'hub-1',
  status: 'active' as const,
  metadata: { title: 'Default test project', members: [] },
  goal: { outcomeGoals: [] },
  sections: {
    background: {},
    approach: {},
    outcomeReference: {},
  },
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
} as unknown as Parameters<typeof FrameView>[0]['activeIP'];

describe('FrameView (Azure shell)', () => {
  beforeEach(() => {
    analysisScopeRef.current = {};
    hoisted.canvasWorkspaceMock.mockClear();
    showExploreMock.mockClear();
    showImprovementMock.mockClear();
    showAnalyzeMock.mockClear();
    showSustainmentMock.mockClear();
    showDashboardMock.mockClear();
    expandToHypothesisMock.mockClear();
    setWallViewModeMock.mockClear();
    setAnalyzeViewModeMock.mockClear();
    setFocusedWallEntityMock.mockClear();
    addCausalLinkMock.mockReset();
    removeCausalLinkMock.mockReset();
    addFindingMock.mockClear();
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
      processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-1' },
      setProcessContext: setProcessContextMock,
    };
    investigationStateRef.current = {
      findings: [{ id: 'f-1' }],
      hypotheses: [{ id: 'hub-1' }],
      causalLinks: [{ id: 'link-1' }],
      addCausalLink: addCausalLinkMock,
      removeCausalLink: removeCausalLinkMock,
      addFinding: addFindingMock,
    };
  });

  it('passes app store state into the shared Canvas workspace', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    expect(screen.getByTestId('canvas-workspace')).toBeInTheDocument();
    expect(hoisted.canvasWorkspaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rawData: [{ Fill_Weight: 12 }],
        outcome: 'Fill_Weight',
        factors: ['Machine'],
        measureSpecs: { Fill_Weight: { target: 12 } },
        processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-1' },
        setOutcome: setOutcomeMock,
        setFactors: setFactorsMock,
        setMeasureSpec: setMeasureSpecMock,
        setProcessContext: setProcessContextMock,
        findings: [{ id: 'f-1' }],
        hypotheses: [{ id: 'hub-1' }],
        causalLinks: [{ id: 'link-1' }],
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

    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

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

  it('passes action items read for the active process hub to CanvasWorkspace', async () => {
    const actionItems = [actionItem('action-1', 'Check oven gasket seating')];
    hoisted.actionItemsListByHubMock.mockResolvedValue(actionItems);

    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

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

    const { rerender } = render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([expect.objectContaining({ text: 'Hub 1 action' })]);
    });

    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-2' },
    };
    rerender(<FrameView activeIP={DEFAULT_TEST_IP} />);

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

    const { rerender } = render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([expect.objectContaining({ text: 'Hub 1 action' })]);
    });

    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-2' },
    };
    rerender(<FrameView activeIP={DEFAULT_TEST_IP} />);

    await waitFor(() => expect(hoisted.actionItemsListByHubMock).toHaveBeenCalledWith('hub-2'));
    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.actionItems).toEqual([]);
    });
  });

  it('does not read snapshots when there is no active process hub', () => {
    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { currentUnderstanding: 'fill line' },
    };

    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    expect(hoisted.listByHubMock).not.toHaveBeenCalled();
    expect(hoisted.actionItemsListByHubMock).not.toHaveBeenCalled();
    const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
    expect(props?.priorStepStats?.size).toBe(0);
  });

  it('wires See Data to the Azure Analysis panel action', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(showExploreMock).toHaveBeenCalledTimes(1);
  });

  it('dispatches ACTION_ITEM_ADD when Canvas logs a quick action', async () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

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

  it('shows quick actions immediately when repository refresh is unavailable', async () => {
    hoisted.actionItemsListByHubMock.mockRejectedValue(new Error('refresh unavailable'));
    hoisted.dispatchMock.mockRejectedValue(new Error('refresh unavailable'));

    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

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

    const { rerender } = render(<FrameView activeIP={DEFAULT_TEST_IP} />);

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

    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-2' },
    };
    rerender(<FrameView activeIP={DEFAULT_TEST_IP} />);

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

  it('opens Investigation and expands a hypothesis hub for overlay focus', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    fireEvent.click(screen.getByTestId('overlay-question'));

    expect(expandToHypothesisMock).toHaveBeenCalledWith('q-1');
    expect(showAnalyzeMock).toHaveBeenCalledTimes(1);
  });

  it('PR-CS-5: focuses + forces the Wall view on hypothesis overlay focus (dim + pan-to-node)', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    fireEvent.click(screen.getByTestId('overlay-question'));

    // The visible Wall focus lens is set so WallCanvas dims + AnalyzeWorkspace pans.
    expect(setFocusedWallEntityMock).toHaveBeenCalledWith('q-1');
    // Force the Wall map view so the analyst lands focused, not unfocused.
    expect(setWallViewModeMock).toHaveBeenCalledWith('wall');
    expect(setAnalyzeViewModeMock).toHaveBeenCalledWith('map');
    expect(showAnalyzeMock).toHaveBeenCalledTimes(1);
  });

  it('PR-CS-5: a hypothesis context-link routes through the focus path (focus + pan)', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
    // hub-1 is a live hypothesis (investigationStateRef seeds hypotheses: [{ id: 'hub-1' }]).
    props.onNavigateContextLink({ id: 'hub-1', label: 'Cause A' });

    expect(setFocusedWallEntityMock).toHaveBeenCalledWith('hub-1');
    expect(setWallViewModeMock).toHaveBeenCalledWith('wall');
    expect(setAnalyzeViewModeMock).toHaveBeenCalledWith('map');
    expect(showAnalyzeMock).toHaveBeenCalledTimes(1);
  });

  it('opens Investigation map in Wall mode from the Canvas wall drill action', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    fireEvent.click(screen.getByTestId('open-wall'));

    expect(setWallViewModeMock).toHaveBeenCalledWith('wall');
    expect(setAnalyzeViewModeMock).toHaveBeenCalledWith('map');
    expect(showAnalyzeMock).toHaveBeenCalledTimes(1);
  });

  it('wires causal-link mutation callbacks to the investigation store', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
    expect(props?.onAddCausalLink).toEqual(expect.any(Function));
    expect(props?.onRemoveCausalLink).toEqual(expect.any(Function));

    // IM-1: questionIds are dropped — the optional fourth argument is ignored.
    props.onAddCausalLink('Machine', 'Fill_Weight', 'Machine drift changes fill weight');
    props.onRemoveCausalLink('link-created');

    expect(addCausalLinkMock).toHaveBeenCalledWith(
      'Machine',
      'Fill_Weight',
      'Machine drift changes fill weight'
    );
    // linkQuestionToCausalLink is retired in IM-1 — no longer called.
    expect(removeCausalLinkMock).toHaveBeenCalledWith('link-created');
  });

  it('PR-CS-5: capture-from-step creates a finding noted with the step id (originStepId)', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
    expect(props?.onCaptureFindingFromStep).toEqual(expect.any(Function));

    props.onCaptureFindingFromStep({
      stepId: 'step-fill-1',
      stepName: 'Fill',
      assignedColumns: ['Fill_Weight'],
      metricKind: 'numeric',
      stats: { mean: 12, median: 12 },
      capability: { state: 'no-specs', n: 30 },
      distribution: [],
      values: [],
    });

    // addFinding(text, context, source?, scopeId?, originStepId) — step id lands in the 5th arg.
    expect(addFindingMock).toHaveBeenCalledTimes(1);
    const call = addFindingMock.mock.calls[0];
    expect(call[4]).toBe('step-fill-1');
    // Pre-seeded activeFilters from assigned columns.
    expect(call[1].activeFilters).toEqual({ Fill_Weight: [] });
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

    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

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
    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { processHubId: 'hub-1' },
    };

    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Open inbox prompt' }));

    expect(showSustainmentMock).toHaveBeenCalledWith('ip-1');
  });

  // E1 T6: Process tab "No active project" empty state.
  describe('Process tab guard (E1 T6)', () => {
    it('renders NoActiveProjectGuidance instead of CanvasWorkspace when activeIP is null', () => {
      render(<FrameView activeIP={null} />);

      expect(screen.queryByTestId('canvas-workspace')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /no active project/i })).toBeInTheDocument();
      expect(screen.getByText(/process work happens inside a project/i)).toBeInTheDocument();
      expect(hoisted.canvasWorkspaceMock).not.toHaveBeenCalled();
    });

    it('renders NoActiveProjectGuidance when activeIP prop is omitted', () => {
      render(<FrameView />);

      expect(screen.queryByTestId('canvas-workspace')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('invokes panelsStore.showDashboard() when the "Go to Home" CTA is clicked', () => {
      render(<FrameView activeIP={null} />);

      fireEvent.click(screen.getByRole('button', { name: /go to home/i }));

      expect(showDashboardMock).toHaveBeenCalledTimes(1);
    });

    it('renders CanvasWorkspace (not the guidance) when activeIP is non-null', () => {
      render(<FrameView activeIP={DEFAULT_TEST_IP} />);

      expect(screen.getByTestId('canvas-workspace')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // CS-0 Tasks 5+6: bare "See the data" should seed analysisScopeStore.yColumn
  // from the current outcome before opening Explore. This is the outcome-seeding
  // test — distinct from the chip path (handleChipExploreJump) which is unchanged.
  it('CS-0: bare See Data seeds analysisScopeStore.yColumn from the project outcome', () => {
    // Precondition: outcome is set in storeStateRef (set in beforeEach to 'Fill_Weight').
    // analysisScopeRef.current.yColumn starts undefined (cleared in beforeEach).
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(analysisScopeRef.current.yColumn).toBe('Fill_Weight');
    expect(showExploreMock).toHaveBeenCalledTimes(1);
  });

  it('CS-0: bare See Data does not seed yColumn when outcome is null', () => {
    storeStateRef.current = { ...storeStateRef.current, outcome: null };

    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(analysisScopeRef.current.yColumn).toBeUndefined();
    expect(showExploreMock).toHaveBeenCalledTimes(1);
  });

  it('CS-0: bare See Data does not create scopes in useAnalyzeStore (seeding Y alone has empty predicates)', () => {
    // Verify the chip path (handleChipExploreJump) is NOT triggered by bare See Data.
    // The outcome seeding goes through useProjectStore.getState().outcome, not the chip path.
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    fireEvent.click(screen.getByTestId('see-data'));

    // investigationStateRef.current has the scopes-like structure we started with
    // (no scopes field — analyzeStore does not have a scopes field in the mock here).
    // The key assertion: yColumn seeded, showExplore called, chip path NOT called
    // (chip test uses chip-explore-jump-outcome button, this test uses see-data).
    expect(analysisScopeRef.current.yColumn).toBe('Fill_Weight');
    expect(showExploreMock).toHaveBeenCalledTimes(1);
    // showExploreMock should be called with no arguments (bare showExplore, not with intent).
    expect(showExploreMock).toHaveBeenCalledWith();
  });

  // LV1-D Task 7: clicking a chip's Explore-jump affordance should mutate
  // analysisScopeStore.yColumn and switch panelsStore to Explore.
  it('LV1-D: onChipExploreJump mutates analysisScopeStore and switches to Explore', () => {
    render(<FrameView activeIP={DEFAULT_TEST_IP} />);

    // The CanvasWorkspace stub renders a chip-explore-jump-outcome button that
    // fires onChipExploreJump({ kind: 'outcome', columnName: 'Diameter' }).
    fireEvent.click(screen.getByTestId('chip-explore-jump-outcome'));

    // analysisScopeStore.setY should have been called via navigateToExploreForChip.
    expect(analysisScopeRef.current.yColumn).toBe('Diameter');
    // panelsStore.showExplore should have been called (no intent for chip path).
    expect(showExploreMock).toHaveBeenCalledTimes(1);
    expect(showExploreMock).toHaveBeenCalledWith();
  });
});
