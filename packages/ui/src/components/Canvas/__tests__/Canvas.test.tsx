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

describe('Canvas', () => {
  it('owns the three-band rendering path without changing behavior', () => {
    const onOpsModeChange = vi.fn();

    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        opsMode="spatial"
        onOpsModeChange={onOpsModeChange}
      />
    );

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('ops-band-dashboard')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show temporal trends/i }));

    expect(onOpsModeChange).toHaveBeenCalledWith('full');
  });

  it('uses opsMode for temporal trends while authoring mode is inert', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        mode="read"
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /show temporal trends/i })).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-temporal-row')).toHaveAttribute('aria-hidden', 'true');
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
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
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
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
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
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
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
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
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
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
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
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
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
        opsMode="spatial"
        onOpsModeChange={vi.fn()}
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
        onPlaceChip={onPlaceChip}
      />
    );

    fireEvent.keyDown(screen.getByTestId('chip-rail-item-Bake_Time'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByTestId('process-map-step-step-1'), { key: 'Enter' });

    expect(onPlaceChip).toHaveBeenCalledWith('Bake_Time', 'step-1');
  });
});
