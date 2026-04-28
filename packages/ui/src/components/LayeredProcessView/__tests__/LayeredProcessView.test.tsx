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

  it('renders one factor chip per tributary in Operations band', () => {
    const mapWithFactors: ProcessMap = {
      ...emptyMap,
      nodes: [
        { id: 'step-1', name: 'Mix', order: 0 },
        { id: 'step-2', name: 'Coat', order: 1 },
      ],
      tributaries: [
        { id: 't-1', stepId: 'step-1', column: 'Temperature' },
        { id: 't-2', stepId: 'step-2', column: 'Speed' },
      ],
    };

    render(
      <LayeredProcessView
        map={mapWithFactors}
        availableColumns={['Temperature', 'Speed']}
        onChange={() => {}}
      />
    );

    const operationsBand = screen.getByTestId('band-operations');
    const chips = operationsBand.querySelectorAll('[data-testid^="factor-chip-"]');
    expect(chips).toHaveLength(2);
    expect(operationsBand).toHaveTextContent('Temperature');
    expect(operationsBand).toHaveTextContent('Speed');
  });

  it('labels each factor chip with its parent step name', () => {
    const mapWithFactors: ProcessMap = {
      ...emptyMap,
      nodes: [{ id: 'step-1', name: 'Mix', order: 0 }],
      tributaries: [{ id: 't-1', stepId: 'step-1', column: 'Temperature' }],
    };

    render(<LayeredProcessView map={mapWithFactors} availableColumns={[]} onChange={() => {}} />);

    const chip = screen.getByTestId('factor-chip-t-1');
    expect(chip).toHaveTextContent('Temperature');
    expect(chip).toHaveTextContent('at Mix');
  });

  it('shows placeholder when no factors are mapped', () => {
    render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

    const operationsBand = screen.getByTestId('band-operations');
    expect(operationsBand).toHaveTextContent('No factors mapped yet');
  });

  it('replaces Operations band content when operationsBandContent is provided', () => {
    const mapWithFactors: ProcessMap = {
      ...emptyMap,
      nodes: [
        { id: 'step-1', name: 'Mix', order: 0 },
        { id: 'step-2', name: 'Coat', order: 1 },
      ],
      tributaries: [
        { id: 't-1', stepId: 'step-1', column: 'Temperature' },
        { id: 't-2', stepId: 'step-2', column: 'Speed' },
      ],
    };
    render(
      <LayeredProcessView
        map={mapWithFactors}
        availableColumns={[]}
        onChange={() => {}}
        operationsBandContent={<div data-testid="custom-ops">CUSTOM</div>}
      />
    );
    expect(screen.getByTestId('custom-ops')).toBeInTheDocument();
  });

  it('relocates tributary chips to Outcome band as Mapped factors when operationsBandContent is provided', () => {
    const mapWithFactors: ProcessMap = {
      ...emptyMap,
      nodes: [
        { id: 'step-1', name: 'Mix', order: 0 },
        { id: 'step-2', name: 'Coat', order: 1 },
      ],
      tributaries: [
        { id: 't-1', stepId: 'step-1', column: 'Temperature' },
        { id: 't-2', stepId: 'step-2', column: 'Speed' },
      ],
    };
    const { getByTestId } = render(
      <LayeredProcessView
        map={mapWithFactors}
        availableColumns={[]}
        onChange={() => {}}
        operationsBandContent={<div>X</div>}
      />
    );
    const outcome = getByTestId('band-outcome');
    expect(outcome.textContent).toMatch(/Mapped factors/i);
    expect(outcome.querySelector('[data-testid^="factor-chip-"]')).toBeTruthy();
  });

  it('renders filterStripContent above the Outcome band when provided', () => {
    render(
      <LayeredProcessView
        map={emptyMap}
        availableColumns={[]}
        onChange={() => {}}
        filterStripContent={<div data-testid="filter-strip">FILTER</div>}
      />
    );
    expect(screen.getByTestId('filter-strip')).toBeInTheDocument();
  });

  it('keeps Operations band default content (tributary chips) when slot props are absent', () => {
    const mapWithFactors: ProcessMap = {
      ...emptyMap,
      nodes: [
        { id: 'step-1', name: 'Mix', order: 0 },
        { id: 'step-2', name: 'Coat', order: 1 },
      ],
      tributaries: [
        { id: 't-1', stepId: 'step-1', column: 'Temperature' },
        { id: 't-2', stepId: 'step-2', column: 'Speed' },
      ],
    };
    const { getByTestId } = render(
      <LayeredProcessView map={mapWithFactors} availableColumns={[]} onChange={() => {}} />
    );
    const ops = getByTestId('band-operations');
    expect(ops.querySelector('[data-testid^="factor-chip-"]')).toBeTruthy();
  });

  it('renders all three band frames even when the map is fully empty', () => {
    render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

    // All three bands render with their headers regardless of content
    expect(screen.getByText('Outcome')).toBeInTheDocument();
    expect(screen.getByText('Process Flow')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();

    // Outcome and Operations show their placeholders
    expect(screen.getByTestId('band-outcome')).toHaveTextContent('No outcome target set');
    expect(screen.getByTestId('band-operations')).toHaveTextContent('No factors mapped yet');
  });
});
