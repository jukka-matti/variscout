import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowReadinessSignals } from '@variscout/core';

const setProcessContextMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const setOutcomeMock = vi.fn();
const setFactorsMock = vi.fn();
const showAnalysisMock = vi.fn();
const showImprovementMock = vi.fn();
const showInvestigationMock = vi.fn();
const showCharterMock = vi.fn();
const showSustainmentMock = vi.fn();
const showHandoffMock = vi.fn();
const expandToQuestionMock = vi.fn();
const setWallViewModeMock = vi.fn();
const setInvestigationViewModeMock = vi.fn();
const addCausalLinkMock = vi.fn();
const linkQuestionToCausalLinkMock = vi.fn();
const removeCausalLinkMock = vi.fn();

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
    projectsByHub: {},
    getProjectsForHub: () => [],
  },
};

const hoisted = vi.hoisted(() => ({
  canvasWorkspaceMock: vi.fn(),
  listByHubMock: vi.fn(),
  actionItemsListByHubMock: vi.fn(),
  sustainmentRecordsListByHubMock: vi.fn(),
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
  useProjectStore: vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
  useInvestigationStore: Object.assign(
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
  useWallLayoutStore: Object.assign(vi.fn(), {
    getState: () => ({
      setViewMode: setWallViewModeMock,
    }),
  }),
}));

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
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
      signals: WorkflowReadinessSignals;
      onSeeData: () => void;
      onQuickAction?: (stepId: string) => void;
      onLogQuickAction?: (
        stepId: string,
        payload: { text: string; status: 'open' | 'done'; assignedTo?: unknown; dueAt?: string }
      ) => void;
      onFocusedInvestigation?: (stepId: string) => void;
      onOpenWall?: () => void;
      onOpenInvestigationFocus?: (focus: { questionId?: string }) => void;
      onAddCausalLink?: (
        fromFactor: string,
        toFactor: string,
        whyStatement: string,
        options?: { questionIds?: string[] }
      ) => void;
      onRemoveCausalLink?: (linkId: string) => void;
      onCharter?: () => void;
      onSustainment?: () => void;
      onHandoff?: () => void;
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
            onClick: () => props.onOpenInvestigationFocus?.({ questionId: 'q-1' }),
          },
          'Overlay question'
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
        ),
        React.createElement(
          'button',
          { type: 'button', 'data-testid': 'cta-sustainment', onClick: props.onSustainment },
          'Sustainment'
        ),
        React.createElement(
          'button',
          { type: 'button', 'data-testid': 'cta-handoff', onClick: props.onHandoff },
          'Handoff'
        )
      );
    },
  };
});

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({
      showAnalysis: showAnalysisMock,
      showImprovement: showImprovementMock,
      showInvestigation: showInvestigationMock,
      showCharter: showCharterMock,
      showSustainment: showSustainmentMock,
      showHandoff: showHandoffMock,
      setInvestigationViewMode: setInvestigationViewModeMock,
    }),
  }),
}));

vi.mock('../../../features/investigation/investigationStore', () => ({
  useInvestigationFeatureStore: Object.assign(vi.fn(), {
    getState: () => ({
      expandToQuestion: expandToQuestionMock,
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
    sustainmentRecords: {
      listByHub: hoisted.sustainmentRecordsListByHubMock,
    },
  },
}));

import FrameView from '../FrameView';

describe('FrameView (Azure shell)', () => {
  beforeEach(() => {
    hoisted.canvasWorkspaceMock.mockClear();
    showAnalysisMock.mockClear();
    showImprovementMock.mockClear();
    showInvestigationMock.mockClear();
    showCharterMock.mockClear();
    showSustainmentMock.mockClear();
    showHandoffMock.mockClear();
    expandToQuestionMock.mockClear();
    setWallViewModeMock.mockClear();
    setInvestigationViewModeMock.mockClear();
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
    hoisted.dispatchMock.mockReset();
    hoisted.dispatchMock.mockResolvedValue(undefined);
    improvementProjectStateRef.current = {
      projectsByHub: {},
      getProjectsForHub: () => [],
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
        processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-1' },
        setOutcome: setOutcomeMock,
        setFactors: setFactorsMock,
        setMeasureSpec: setMeasureSpecMock,
        setProcessContext: setProcessContextMock,
        findings: [{ id: 'f-1' }],
        questions: [{ id: 'q-1' }],
        hypotheses: [{ id: 'hub-1' }],
        causalLinks: [{ id: 'link-1' }],
        signals: { hasIntervention: false, sustainmentConfirmed: false },
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

  it('passes action items read for the active process hub to CanvasWorkspace', async () => {
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

    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-2' },
    };
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

    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-2' },
    };
    rerender(<FrameView />);

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

    render(<FrameView />);

    expect(hoisted.listByHubMock).not.toHaveBeenCalled();
    expect(hoisted.actionItemsListByHubMock).not.toHaveBeenCalled();
    const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
    expect(props?.priorStepStats?.size).toBe(0);
  });

  it('wires See Data to the Azure Analysis panel action', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(showAnalysisMock).toHaveBeenCalledTimes(1);
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

  it('shows quick actions immediately when repository refresh is unavailable', async () => {
    hoisted.actionItemsListByHubMock.mockRejectedValue(new Error('refresh unavailable'));
    hoisted.dispatchMock.mockRejectedValue(new Error('refresh unavailable'));

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

    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { currentUnderstanding: 'fill line', processHubId: 'hub-2' },
    };
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

  it('wires Canvas focused investigation response path to the Azure Investigation panel', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('focused-investigation'));

    expect(showInvestigationMock).toHaveBeenCalledTimes(1);
  });

  it('opens Investigation and expands a question for overlay focus', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('overlay-question'));

    expect(expandToQuestionMock).toHaveBeenCalledWith('q-1');
    expect(showInvestigationMock).toHaveBeenCalledTimes(1);
  });

  it('opens Investigation map in Wall mode from the Canvas wall drill action', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('open-wall'));

    expect(setWallViewModeMock).toHaveBeenCalledWith('wall');
    expect(setInvestigationViewModeMock).toHaveBeenCalledWith('map');
    expect(showInvestigationMock).toHaveBeenCalledTimes(1);
  });

  it('wires causal-link mutation callbacks to the investigation store', () => {
    render(<FrameView />);

    const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
    expect(props?.onAddCausalLink).toEqual(expect.any(Function));
    expect(props?.onRemoveCausalLink).toEqual(expect.any(Function));

    props.onAddCausalLink('Machine', 'Fill_Weight', 'Machine drift changes fill weight', {
      questionIds: ['q-1', 'q-2'],
    });
    props.onRemoveCausalLink('link-created');

    expect(addCausalLinkMock).toHaveBeenCalledWith(
      'Machine',
      'Fill_Weight',
      'Machine drift changes fill weight'
    );
    expect(linkQuestionToCausalLinkMock).toHaveBeenCalledWith('link-created', 'q-1');
    expect(linkQuestionToCausalLinkMock).toHaveBeenCalledWith('link-created', 'q-2');
    expect(removeCausalLinkMock).toHaveBeenCalledWith('link-created');
  });

  it('wires Canvas charter/sustainment/handoff CTAs to the panels-store show actions', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('cta-charter'));
    fireEvent.click(screen.getByTestId('cta-sustainment'));
    fireEvent.click(screen.getByTestId('cta-handoff'));

    expect(showCharterMock).toHaveBeenCalledTimes(1);
    expect(showSustainmentMock).toHaveBeenCalledTimes(1);
    expect(showHandoffMock).toHaveBeenCalledTimes(1);
  });

  it('marks Sustainment ready only when a closed project has completed intervention evidence and keeps Handoff gated until sustainment is confirmed', async () => {
    improvementProjectStateRef.current = {
      projectsByHub: {
        'hub-1': [
          {
            id: 'ip-1',
            hubId: 'hub-1',
            status: 'closed',
            metadata: { title: 'Reduce rework' },
            goal: { outcomeGoal: { outcomeSpecId: 'outcome-1', target: 98 } },
            sections: {
              background: {},
              investigationLineage: {},
              approach: { actionItemIds: ['action-1'] },
              outcomeReference: {},
            },
            createdAt: 1,
            updatedAt: 1,
            deletedAt: null,
          },
        ],
      },
      getProjectsForHub: () => [],
    };
    hoisted.actionItemsListByHubMock.mockResolvedValue([
      { ...actionItem('action-1', 'Change nozzle'), completedAt: 1714000000000 },
    ]);

    render(<FrameView />);

    await waitFor(() => {
      const props = hoisted.canvasWorkspaceMock.mock.lastCall?.[0];
      expect(props?.signals).toEqual({ hasIntervention: true, sustainmentConfirmed: false });
    });
  });

  it('marks Handoff ready and includes sustainment context links when a live record is confirmed', async () => {
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
      expect(props?.signals.sustainmentConfirmed).toBe(true);
      expect(
        props?.contextLinkGroups?.find(
          (group: { surfaceType: string }) => group.surfaceType === 'sustainment'
        )?.items
      ).toEqual([expect.objectContaining({ id: 'sr-1' })]);
    });
  });

  it('passes the Inbox sustainment target id when opening a lifecycle prompt', async () => {
    improvementProjectStateRef.current = {
      projectsByHub: {
        'hub-1': [
          {
            id: 'ip-1',
            hubId: 'hub-1',
            status: 'closed',
            metadata: { title: 'Reduce rework' },
            goal: { outcomeGoal: { outcomeSpecId: 'outcome-1', target: 98 } },
            sections: {
              background: {},
              investigationLineage: {},
              approach: {},
              outcomeReference: {},
            },
            createdAt: 1,
            updatedAt: 1,
            deletedAt: null,
          },
        ],
      },
      getProjectsForHub: () => [],
    };
    storeStateRef.current = {
      ...storeStateRef.current,
      processContext: { processHubId: 'hub-1' },
    };

    render(<FrameView />);

    fireEvent.click(await screen.findByRole('button', { name: 'Open inbox prompt' }));

    expect(showSustainmentMock).toHaveBeenCalledWith('ip-1');
  });
});
