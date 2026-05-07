import { fireEvent, render, screen } from '@testing-library/react';
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
    suspectedCauses: [],
    causalLinks: [],
  },
};

const hoisted = vi.hoisted(() => ({
  canvasWorkspaceMock: vi.fn(),
}));

vi.mock('@variscout/stores', () => ({
  useProjectStore: vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
  useInvestigationStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector(investigationStateRef.current)
  ),
}));

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    CanvasWorkspace: (props: {
      signals: WorkflowReadinessSignals;
      onSeeData: () => void;
      onQuickAction?: (stepId: string) => void;
      onFocusedInvestigation?: (stepId: string) => void;
      onOpenInvestigationFocus?: (focus: { questionId?: string }) => void;
      onCharter?: () => void;
      onSustainment?: () => void;
      onHandoff?: () => void;
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
            onClick: () => props.onQuickAction?.('step-1'),
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
      suspectedCauses: [{ id: 'hub-1' }],
      causalLinks: [{ id: 'link-1' }],
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
        processContext: { currentUnderstanding: 'fill line' },
        setOutcome: setOutcomeMock,
        setFactors: setFactorsMock,
        setMeasureSpec: setMeasureSpecMock,
        setProcessContext: setProcessContextMock,
        findings: [{ id: 'f-1' }],
        questions: [{ id: 'q-1' }],
        suspectedCauses: [{ id: 'hub-1' }],
        causalLinks: [{ id: 'link-1' }],
        signals: { hasIntervention: false, sustainmentConfirmed: false },
      })
    );
  });

  it('wires See Data to the Azure Analysis panel action', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('see-data'));

    expect(showAnalysisMock).toHaveBeenCalledTimes(1);
  });

  it('wires Canvas response paths to the Azure workflow panels', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('quick-action'));
    fireEvent.click(screen.getByTestId('focused-investigation'));

    expect(showImprovementMock).toHaveBeenCalledTimes(1);
    expect(showInvestigationMock).toHaveBeenCalledTimes(1);
  });

  it('opens Investigation and expands a question for overlay focus', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('overlay-question'));

    expect(expandToQuestionMock).toHaveBeenCalledWith('q-1');
    expect(showInvestigationMock).toHaveBeenCalledTimes(1);
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
});
