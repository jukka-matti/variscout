import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LayeredProcessView } from '../LayeredProcessView';
import type { ProcessMap } from '@variscout/core/frame';

const emptyMap: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
};

describe('LayeredProcessView', () => {
  it('renders three bands labelled Outcome, Process Flow, Operations', () => {
    render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();

    expect(screen.getByText('Outcome')).toBeInTheDocument();
    expect(screen.getByText('Process Flow')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });

  it('shows target value in Outcome band when target is set', () => {
    render(
      <LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} target={1.33} />
    );

    const outcomeBand = screen.getByTestId('band-outcome');
    expect(within(outcomeBand).getByText('Target:')).toBeInTheDocument();
    expect(within(outcomeBand).getByText('1.33')).toBeInTheDocument();
  });

  it('shows USL and LSL in Outcome band when set', () => {
    render(
      <LayeredProcessView
        map={emptyMap}
        availableColumns={[]}
        onChange={() => {}}
        usl={12.5}
        lsl={8.5}
      />
    );

    const outcomeBand = screen.getByTestId('band-outcome');
    expect(within(outcomeBand).getByText('USL:')).toBeInTheDocument();
    expect(within(outcomeBand).getByText('12.5')).toBeInTheDocument();
    expect(within(outcomeBand).getByText('LSL:')).toBeInTheDocument();
    expect(within(outcomeBand).getByText('8.5')).toBeInTheDocument();
  });

  it('shows placeholder when no outcome data', () => {
    render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

    const outcomeBand = screen.getByTestId('band-outcome');
    expect(outcomeBand).toHaveTextContent('No outcome target set');
  });

  it('renders ProcessMapBase inside Process Flow band', () => {
    const mapWithStep: ProcessMap = {
      ...emptyMap,
      nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
    };

    render(
      <LayeredProcessView
        map={mapWithStep}
        availableColumns={['Temperature', 'Speed']}
        onChange={() => {}}
      />
    );

    const processFlowBand = screen.getByTestId('band-process-flow');
    // ProcessMapBase renders the step name
    expect(processFlowBand).toHaveTextContent('Mix');
  });
});
