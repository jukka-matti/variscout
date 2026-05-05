import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const setProcessContextMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const setOutcomeMock = vi.fn();
const setFactorsMock = vi.fn();
const showAnalysisMock = vi.fn();

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

const hoisted = vi.hoisted(() => ({
  canvasWorkspaceMock: vi.fn(),
}));

vi.mock('@variscout/stores', () => ({
  useProjectStore: vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
}));

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    CanvasWorkspace: (props: { onSeeData: () => void }) => {
      hoisted.canvasWorkspaceMock(props);
      return React.createElement(
        'button',
        { type: 'button', 'data-testid': 'canvas-workspace', onClick: props.onSeeData },
        'Canvas workspace'
      );
    },
  };
});

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({ showAnalysis: showAnalysisMock }),
  }),
}));

import FrameView from '../FrameView';

describe('FrameView (Azure shell)', () => {
  beforeEach(() => {
    hoisted.canvasWorkspaceMock.mockClear();
    showAnalysisMock.mockClear();
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
      })
    );
  });

  it('wires See Data to the Azure Analysis panel action', () => {
    render(<FrameView />);

    fireEvent.click(screen.getByTestId('canvas-workspace'));

    expect(showAnalysisMock).toHaveBeenCalledTimes(1);
  });
});
