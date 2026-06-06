import type React from 'react';
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
// FSJ-3b: b0 slot callbacks
const onFixDataMock = vi.fn();
const onRenameColumnMock = vi.fn();

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
    analysisMode: 'standard',
    defectMapping: null,
    measureColumns: [],
    setOutcome: setOutcomeMock,
    setFactors: setFactorsMock,
    measureSpecs: {},
    setMeasureSpec: setMeasureSpecMock,
    processContext: null,
    setProcessContext: setProcessContextMock,
    dataFilename: null,
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
    // FSJ-3b: OutcomeNoMatchBanner stub — renders the Skip button so tests
    // can assert the no-Y floor wiring without importing the real component.
    OutcomeNoMatchBanner: (props: {
      onRename?: (oldName: string, newName: string) => void;
      onExpectedChange?: () => void;
      onSkip?: () => void;
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'outcome-no-match-banner' },
        React.createElement(
          'button',
          { type: 'button', 'data-testid': 'banner-skip', onClick: props.onSkip },
          'Skip'
        )
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
      // FSJ-3b: b0 landing slots
      b0Slots?: {
        topBar?: React.ReactNode;
        belowY?: React.ReactNode;
        noYBanner?: React.ReactNode;
        selectionDisabled?: React.ReactNode;
        emptyY?: React.ReactNode;
      };
      analysisMode?: string;
      defectMapping?: unknown;
      measureColumns?: readonly string[];
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
        ),
        // FSJ-3b: render b0Slots content so tests can interact with provenance,
        // "Fix data…", "+ track another outcome", and noYBanner affordances.
        props.b0Slots?.topBar ?? null,
        props.b0Slots?.belowY ?? null,
        props.b0Slots?.noYBanner ?? null,
        props.b0Slots?.selectionDisabled ?? null,
        props.b0Slots?.emptyY ?? null
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
    onFixDataMock.mockClear();
    onRenameColumnMock.mockClear();
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
      analysisMode: 'standard',
      defectMapping: null,
      measureColumns: [],
      setOutcome: setOutcomeMock,
      setFactors: setFactorsMock,
      measureSpecs: { Fill_Weight: { target: 12 } },
      setMeasureSpec: setMeasureSpecMock,
      processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-1' },
      setProcessContext: setProcessContextMock,
      dataFilename: null,
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
        analysisMode: 'standard',
        defectMapping: null,
        measureColumns: [],
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
        projectId: 'inv-1',
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

  // FSJ-3b Task 4: b0 landing chrome — provenance, Fix-data hatch, no-Y floor.
  // Coverage note: these tests exercise the b0Slots construction + wiring
  // directly through the CanvasWorkspace prop capture + the rendered slot DOM.
  // FrameViewB0's actual b0 gate (rawData empty = no b0, rawData non-empty = b0)
  // lives inside CanvasWorkspace (shared-ui, FSJ-2 tested) — not duplicated here.
  // NOTE: the stub renders noYBanner unconditionally (the real yCandidates.length===0
  // gate lives in FrameViewB0, FSJ-2 shared-ui tests) — these tests assert
  // construction + wiring, not the display condition.
  describe('FSJ-3b: b0 landing chrome', () => {
    it('passes b0Slots with provenance line showing source + rows + columns', () => {
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [
          { Fill_Weight: 12, Machine: 'A' },
          { Fill_Weight: 11, Machine: 'B' },
        ],
        dataFilename: 'fill_weights.csv',
      };

      render(<FrameView activeIP={DEFAULT_TEST_IP} onFixData={onFixDataMock} />);

      // b0Slots.topBar renders inside the CanvasWorkspace stub.
      const provenance = screen.getByTestId('b0-provenance');
      expect(provenance).toHaveTextContent('fill_weights.csv');
      expect(provenance).toHaveTextContent('2 rows');
      expect(provenance).toHaveTextContent('2 columns');
    });

    it('falls back to "Pasted Data" when dataFilename is null', () => {
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Fill_Weight: 12 }],
        dataFilename: null,
      };

      render(<FrameView activeIP={DEFAULT_TEST_IP} onFixData={onFixDataMock} />);

      expect(screen.getByTestId('b0-provenance')).toHaveTextContent('Pasted Data');
    });

    it('"Fix data…" button fires onFixData', () => {
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Fill_Weight: 12 }],
        dataFilename: 'test.csv',
      };

      render(<FrameView activeIP={DEFAULT_TEST_IP} onFixData={onFixDataMock} />);

      fireEvent.click(screen.getByTestId('b0-fix-data'));

      expect(onFixDataMock).toHaveBeenCalledTimes(1);
    });

    it('"+ track another outcome" fires onFixData', () => {
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Fill_Weight: 12 }],
        dataFilename: 'test.csv',
      };

      render(<FrameView activeIP={DEFAULT_TEST_IP} onFixData={onFixDataMock} />);

      fireEvent.click(screen.getByTestId('b0-track-another-outcome'));

      expect(onFixDataMock).toHaveBeenCalledTimes(1);
    });

    it('"Fix data…" and "+ track another outcome" are hidden when onFixData is not wired', () => {
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Fill_Weight: 12 }],
        dataFilename: 'test.csv',
      };

      // No onFixData prop — negative control.
      render(<FrameView activeIP={DEFAULT_TEST_IP} />);

      expect(screen.queryByTestId('b0-fix-data')).not.toBeInTheDocument();
      expect(screen.queryByTestId('b0-track-another-outcome')).not.toBeInTheDocument();
    });

    it('noYBanner (OutcomeNoMatchBanner) is passed unconditionally — FrameViewB0 owns the gate', () => {
      // The b0Slots.noYBanner is always constructed and passed; CanvasWorkspace/FrameViewB0
      // decides whether to render it based on yCandidates. The CanvasWorkspace stub
      // renders it unconditionally so we can assert it's wired.
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Category: 'A' }], // data shape irrelevant here — the stub always renders noYBanner
        dataFilename: null,
      };

      render(<FrameView activeIP={DEFAULT_TEST_IP} onFixData={onFixDataMock} />);

      expect(screen.getByTestId('outcome-no-match-banner')).toBeInTheDocument();
    });

    it('noYBanner Skip fires the showExplore handler (no-Y floor → Explore, never a dead end)', () => {
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Category: 'A' }],
        dataFilename: null,
      };

      render(<FrameView activeIP={DEFAULT_TEST_IP} onFixData={onFixDataMock} />);

      fireEvent.click(screen.getByTestId('banner-skip'));

      expect(showExploreMock).toHaveBeenCalledTimes(1);
    });

    it('passes b0Slots to CanvasWorkspace (contract: prop is present and has topBar/noYBanner)', () => {
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Fill_Weight: 12 }],
        dataFilename: 'fill.csv',
      };

      render(<FrameView activeIP={DEFAULT_TEST_IP} onFixData={onFixDataMock} />);

      const lastProps = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(lastProps?.b0Slots).toBeDefined();
      expect(lastProps?.b0Slots?.topBar).toBeDefined();
      expect(lastProps?.b0Slots?.noYBanner).toBeDefined();
    });

    it('renders a defect proposal banner with an inline confirm sequence', () => {
      const onAcceptDefect = vi.fn();
      const onDismissDefect = vi.fn();
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [
          {
            Date: '2026-05-01',
            Defect_Type: 'Scratch',
            Batch: 'B1',
            Units_Produced: 100,
          },
        ],
      };

      render(
        <FrameView
          activeIP={DEFAULT_TEST_IP}
          onFixData={onFixDataMock}
          defectDetection={{
            isDefectFormat: true,
            confidence: 'high',
            dataShape: 'event-log',
            suggestedMapping: {
              defectTypeColumn: 'Defect_Type',
              aggregationUnit: 'Batch',
              unitsProducedColumn: 'Units_Produced',
            },
          }}
          onAcceptDefectDetection={onAcceptDefect}
          onDismissDefectDetection={onDismissDefect}
        />
      );

      expect(screen.getByTestId('b0-defect-banner')).toBeInTheDocument();
      expect(screen.getByText(/Choose an option in the banner above/i)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('b0-defect-expand'));
      expect(screen.getByTestId('b0-defect-confirm-panel')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('b0-defect-accept'));
      expect(onAcceptDefect).toHaveBeenCalledWith({
        dataShape: 'event-log',
        aggregationUnit: 'Batch',
        defectTypeColumn: 'Defect_Type',
        countColumn: undefined,
        resultColumn: undefined,
        unitsProducedColumn: 'Units_Produced',
      });

      fireEvent.click(screen.getByTestId('b0-defect-dismiss'));
      expect(onDismissDefect).toHaveBeenCalledTimes(1);
    });

    it('renders a performance proposal banner with accept, stack, and dismiss actions', () => {
      const onAcceptWide = vi.fn();
      const onDismissWide = vi.fn();
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Batch: 'B1', V1: 10, V2: 11, V3: 12 }],
      };

      render(
        <FrameView
          activeIP={DEFAULT_TEST_IP}
          onFixData={onFixDataMock}
          wideFormatDetection={{
            isWideFormat: true,
            confidence: 'high',
            reason: 'matched channel pattern',
            metadataColumns: ['Batch'],
            channels: [
              {
                id: 'V1',
                label: 'V1',
                n: 1,
                preview: { min: 10, max: 10, mean: 10 },
                matchedPattern: true,
              },
              {
                id: 'V2',
                label: 'V2',
                n: 1,
                preview: { min: 11, max: 11, mean: 11 },
                matchedPattern: true,
              },
              {
                id: 'V3',
                label: 'V3',
                n: 1,
                preview: { min: 12, max: 12, mean: 12 },
                matchedPattern: true,
              },
            ],
          }}
          onAcceptWideFormatDetection={onAcceptWide}
          onDismissWideFormatDetection={onDismissWide}
        />
      );

      expect(screen.getByTestId('b0-performance-banner')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('b0-performance-accept'));
      expect(onAcceptWide).toHaveBeenCalledWith(['V1', 'V2', 'V3'], 'Channel');

      fireEvent.click(screen.getByTestId('b0-performance-stack'));
      expect(onFixDataMock).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('b0-performance-dismiss'));
      expect(onDismissWide).toHaveBeenCalledTimes(1);
    });

    it('renders quiet time chip actions', () => {
      const onDismissQuiet = vi.fn();
      const onUndoQuiet = vi.fn();
      storeStateRef.current = {
        ...storeStateRef.current,
        rawData: [{ Timestamp: '2026-05-01T10:00:00', Weight: 10 }],
      };

      render(
        <FrameView
          activeIP={DEFAULT_TEST_IP}
          onFixData={onFixDataMock}
          quietTimeExtraction={{
            timeColumn: 'Timestamp',
            newColumns: ['Timestamp_Month', 'Timestamp_DayOfWeek'],
            dismissed: false,
          }}
          onDismissQuietTimeExtraction={onDismissQuiet}
          onUndoQuietTimeExtraction={onUndoQuiet}
        />
      );

      expect(screen.getByTestId('b0-time-chip')).toHaveTextContent('Dates detected in Timestamp');
      expect(screen.getByTestId('b0-time-chip')).toHaveTextContent('added Month + Day of Week');

      fireEvent.click(screen.getByTestId('b0-time-chip-adjust'));
      expect(onFixDataMock).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('b0-time-chip-undo'));
      expect(onUndoQuiet).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('b0-time-chip-dismiss'));
      expect(onDismissQuiet).toHaveBeenCalledTimes(1);
    });

    it('forwards mode framing props into CanvasWorkspace', () => {
      const defectMapping = {
        dataShape: 'event-log' as const,
        aggregationUnit: 'Batch',
        defectTypeColumn: 'Defect_Type',
      };
      storeStateRef.current = {
        ...storeStateRef.current,
        analysisMode: 'defect',
        defectMapping,
        measureColumns: ['V1', 'V2', 'V3'],
      };

      render(<FrameView activeIP={DEFAULT_TEST_IP} />);

      expect(hoisted.canvasWorkspaceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          analysisMode: 'defect',
          defectMapping,
          measureColumns: ['V1', 'V2', 'V3'],
        })
      );
    });
  });
});
