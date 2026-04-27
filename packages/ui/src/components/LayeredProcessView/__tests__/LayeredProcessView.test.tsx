import { render, screen } from '@testing-library/react';
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

  it('shows target Cpk in Outcome band when target is set', () => {
    render(
      <LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} target={1.33} />
    );

    const outcomeBand = screen.getByTestId('band-outcome');
    expect(outcomeBand).toHaveTextContent('Target: 1.33');
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
    expect(outcomeBand).toHaveTextContent('USL: 12.5');
    expect(outcomeBand).toHaveTextContent('LSL: 8.5');
  });

  it('shows placeholder when no outcome data', () => {
    render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

    const outcomeBand = screen.getByTestId('band-outcome');
    expect(outcomeBand).toHaveTextContent('No outcome target set');
  });
});
