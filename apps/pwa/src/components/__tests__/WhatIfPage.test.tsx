import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WhatIfPage from '../WhatIfPage';
import { useProjectStore } from '@variscout/stores';

// Default store state
const defaultStoreState = {
  rawData: [
    { Machine: 'A', Value: 10 },
    { Machine: 'A', Value: 11 },
    { Machine: 'B', Value: 20 },
    { Machine: 'B', Value: 19 },
  ],
  outcome: 'Value',
  specs: { usl: 25, lsl: 5 } as { usl?: number; lsl?: number; target?: number },
  filters: {} as Record<string, (string | number)[]>,
  factors: ['Machine'],
  cpkTarget: 1.33,
};

// Mock calculateStats
vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    calculateStats: vi.fn(() => ({
      mean: 15,
      stdDev: 5,
      cpk: 0.67,
      n: 4,
    })),
  };
});

// Mock WhatIfExplorerPage from @variscout/ui
vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual<typeof import('@variscout/ui')>('@variscout/ui');
  return {
    ...actual,
    WhatIfExplorerPage: ({
      filteredData,
      rawData,
      outcome,
      specs,
      filterCount,
      onBack,
    }: {
      filteredData: Record<string, unknown>[];
      rawData: Record<string, unknown>[];
      outcome: string;
      specs: Record<string, unknown>;
      filterCount: number;
      onBack: () => void;
    }) => {
      // Simplified rendering that mirrors the real WhatIfExplorerPage behavior
      if (!outcome || rawData.length === 0) {
        return (
          <div>
            <button onClick={onBack}>Back</button>
            <p>Load data and set specification limits first.</p>
          </div>
        );
      }
      const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
      return (
        <div>
          <button onClick={onBack} title="Back to Dashboard">
            Back
          </button>
          <h1>What-If Simulator</h1>
          <span>{outcome}</span>
          <span>n = {filteredData.length}</span>
          {filterCount > 0 && (
            <span>
              {filterCount} filter{filterCount !== 1 ? 's' : ''}
            </span>
          )}
          {!hasSpecs && <p>Set specification limits (USL/LSL) to see Cpk and yield projections.</p>}
          <div data-testid="simulator">WhatIfSimulator</div>
        </div>
      );
    },
  };
});

describe('WhatIfPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectStore.setState(
      defaultStoreState as unknown as Partial<ReturnType<typeof useProjectStore.getState>>
    );
  });

  it('shows empty state when no outcome set', () => {
    useProjectStore.setState({ outcome: null });
    render(<WhatIfPage onBack={() => {}} />);
    expect(screen.getByText('Load data and set specification limits first.')).toBeInTheDocument();
  });

  it('shows empty state when rawData is empty', () => {
    useProjectStore.setState({ rawData: [], outcome: null });
    render(<WhatIfPage onBack={() => {}} />);
    expect(screen.getByText('Load data and set specification limits first.')).toBeInTheDocument();
  });

  it('shows back button that calls onBack', () => {
    const onBack = vi.fn();
    render(<WhatIfPage onBack={onBack} />);

    const backButton = screen.getByTitle('Back to Dashboard');
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows specs warning when no USL/LSL set', () => {
    useProjectStore.setState({ specs: {} });
    render(<WhatIfPage onBack={() => {}} />);
    expect(
      screen.getByText('Set specification limits (USL/LSL) to see Cpk and yield projections.')
    ).toBeInTheDocument();
  });

  it('does not show specs warning when specs are set', () => {
    render(<WhatIfPage onBack={() => {}} />);
    expect(
      screen.queryByText('Set specification limits (USL/LSL) to see Cpk and yield projections.')
    ).not.toBeInTheDocument();
  });

  it('renders WhatIfSimulator when data and stats available', () => {
    render(<WhatIfPage onBack={() => {}} />);
    expect(screen.getByTestId('simulator')).toBeInTheDocument();
  });

  it('shows outcome name and sample count in header', () => {
    render(<WhatIfPage onBack={() => {}} />);
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('n = 4')).toBeInTheDocument();
  });

  it('shows filter count when filters active', () => {
    useProjectStore.setState({ filters: { Machine: ['A'] } });
    render(<WhatIfPage onBack={() => {}} />);
    expect(screen.getByText('1 filter')).toBeInTheDocument();
  });

  it('shows plural filters label for multiple filters', () => {
    useProjectStore.setState({ filters: { Machine: ['A'], Shift: ['Morning'] } });
    render(<WhatIfPage onBack={() => {}} />);
    expect(screen.getByText('2 filters')).toBeInTheDocument();
  });

  it('shows What-If Simulator heading', () => {
    render(<WhatIfPage onBack={() => {}} />);
    const headings = screen.getAllByText('What-If Simulator');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('back button works in empty state too', () => {
    useProjectStore.setState({ outcome: null });
    const onBack = vi.fn();
    render(<WhatIfPage onBack={onBack} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onBack).toHaveBeenCalledOnce();
  });
});
