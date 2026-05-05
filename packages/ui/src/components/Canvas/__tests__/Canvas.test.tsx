import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/charts', async () => {
  const React = await import('react');
  return {
    IChart: () => React.createElement('div', { 'data-testid': 'mock-cpk-trend' }),
    CapabilityGapTrendChart: () => React.createElement('div', { 'data-testid': 'mock-gap-trend' }),
    CapabilityBoxplot: () =>
      React.createElement('div', { 'data-testid': 'mock-capability-boxplot' }),
    StepErrorPareto: () => React.createElement('div', { 'data-testid': 'mock-step-pareto' }),
  };
});

import { fireEvent, render, screen } from '@testing-library/react';
import type { ProcessMap } from '@variscout/core/frame';
import type { CanvasStepCardModel } from '@variscout/hooks';
import { Canvas } from '../index';

const map: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

const mapWithSteps: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'step-1', name: 'Mix', order: 0 },
    { id: 'step-2', name: 'Fill', order: 1 },
  ],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

const data = {
  cpkTrend: { data: [], stats: null, specs: { target: 1.33 } },
  cpkGapTrend: { series: [], stats: null },
  capabilityNodes: [],
  errorSteps: [],
};

const filter = {
  availableContext: { hubColumns: [] },
  contextValueOptions: {},
  value: {},
  onChange: vi.fn(),
};

const stepCards: CanvasStepCardModel[] = [
  {
    stepId: 'step-1',
    stepName: 'Mix',
    assignedColumns: ['Pressure'],
    metricColumn: 'Pressure',
    metricKind: 'numeric',
    values: [10, 11, 12, 13],
    distribution: [],
    stats: {
      mean: 11.5,
      median: 11.5,
      stdDev: 1.29,
      sigmaWithin: 0.89,
      mrBar: 1,
      ucl: 14.17,
      lcl: 8.83,
      outOfSpecPercentage: 0,
    },
    capability: { state: 'no-specs', n: 4, canAddSpecs: true },
  },
  {
    stepId: 'step-2',
    stepName: 'Fill',
    assignedColumns: ['Defect'],
    metricColumn: 'Defect',
    metricKind: 'categorical',
    values: [],
    distribution: [{ label: 'Scratch', count: 7 }],
    capability: { state: 'no-specs', n: 0, canAddSpecs: true },
    defectCount: 7,
  },
];

describe('Canvas', () => {
  it('renders the PR5 card surface instead of the dedicated operations band', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
      />
    );

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-card-surface')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-step-card-step-1')).toHaveTextContent('Mix');
    expect(screen.queryByTestId('ops-band-dashboard')).not.toBeInTheDocument();
  });

  it('renders the chip rail in author mode when chips are available', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="author"
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
      />
    );

    expect(screen.getByTestId('chip-rail')).toBeInTheDocument();
    expect(screen.getByTestId('chip-rail-item-Bake_Time')).toBeInTheDocument();
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveAttribute(
      'data-droppable-id',
      'canvas:empty'
    );
  });

  it('hides the chip rail in read mode even when chips are available', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="read"
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
      />
    );

    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveClass('hidden');
    expect(screen.getByTestId('process-map-empty-drop-target')).not.toHaveAttribute(
      'data-droppable-id'
    );
  });

  it('does not expose chip placement drop targets when no chips are available', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="author"
      />
    );

    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveClass('hidden');
    expect(screen.getByTestId('process-map-empty-drop-target')).not.toHaveAttribute(
      'data-droppable-id'
    );
  });

  it('does not expose chip placement controls when the canvas is disabled', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="author"
        disabled
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
      />
    );

    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveClass('hidden');
    expect(screen.getByTestId('process-map-empty-drop-target')).not.toHaveAttribute(
      'data-droppable-id'
    );
  });

  it('keeps the mode toggle visible in read mode and hides structural authoring chrome', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="read"
        onModeChange={vi.fn()}
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
      />
    );

    expect(screen.getByRole('button', { name: /edit canvas/i })).toBeInTheDocument();
    expect(screen.queryByTestId('structural-toolbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
  });

  it('shows structural toolbar in author mode and forwards toolbar actions', () => {
    const onAddStep = vi.fn();
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="author"
        onModeChange={vi.fn()}
        onAddStep={onAddStep}
        onUndo={onUndo}
        onRedo={onRedo}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add step/i }));
    fireEvent.click(screen.getByRole('button', { name: /undo canvas action/i }));
    fireEvent.click(screen.getByRole('button', { name: /redo canvas action/i }));

    expect(onAddStep).toHaveBeenCalledTimes(1);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard chip pickup and drop onto a focused step', () => {
    const onPlaceChip = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="author"
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
        onPlaceChip={onPlaceChip}
      />
    );

    fireEvent.keyDown(screen.getByTestId('chip-rail-item-Bake_Time'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByTestId('process-map-step-step-1'), { key: 'Enter' });

    expect(onPlaceChip).toHaveBeenCalledWith('Bake_Time', 'step-1');
  });

  it('renders a lens picker and forwards enabled lens changes', () => {
    const onLensChange = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
        activeLens="default"
        onLensChange={onLensChange}
      />
    );

    expect(screen.getByTestId('canvas-lens-picker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /default lens/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: /capability lens/i }));

    expect(onLensChange).toHaveBeenCalledWith('capability');
    expect(screen.getByRole('button', { name: /performance lens/i })).toBeDisabled();
  });

  it('opens and dismisses the step overlay from a card click', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));

    expect(screen.getByTestId('canvas-step-overlay')).toHaveTextContent('Mix');

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTestId('canvas-step-overlay')).not.toBeInTheDocument();
  });

  it('keeps spec edit affordances separate from card drill-down', () => {
    const onStepSpecsRequest = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
        onStepSpecsRequest={onStepSpecsRequest}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add specs for mix/i }));

    expect(onStepSpecsRequest).toHaveBeenCalledWith('Pressure', 'step-1');
    expect(screen.queryByTestId('canvas-step-overlay')).not.toBeInTheDocument();
  });

  it('wires the two PR5 response paths from the overlay', () => {
    const onQuickAction = vi.fn();
    const onFocusedInvestigation = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        stepCards={stepCards}
        onQuickAction={onQuickAction}
        onFocusedInvestigation={onFocusedInvestigation}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    fireEvent.click(screen.getByRole('button', { name: /quick action/i }));
    fireEvent.click(screen.getByRole('button', { name: /focused investigation/i }));

    expect(onQuickAction).toHaveBeenCalledWith('step-1');
    expect(onFocusedInvestigation).toHaveBeenCalledWith('step-1');
    expect(screen.getByRole('button', { name: /charter/i })).toBeDisabled();
  });
});
