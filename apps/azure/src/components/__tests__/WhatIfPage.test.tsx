import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WhatIfPage from '../WhatIfPage';
import { useProjectStore } from '@variscout/stores';

// Mock @variscout/ui — WhatIfPageBase is what the wrapper renders
vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual<typeof import('@variscout/ui')>('@variscout/ui');
  return {
    ...actual,
    WhatIfPageBase: ({
      filteredData,
      rawData,
      outcome,
      specs,
      filterCount,
      onBack,
    }: {
      filteredData: Record<string, unknown>[];
      rawData: Record<string, unknown>[];
      outcome: string | null;
      specs: Record<string, unknown>;
      filterCount: number;
      onBack: () => void;
    }) => {
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
          <div data-testid="what-if-simulator">WhatIfSimulator</div>
        </div>
      );
    },
  };
});

describe('WhatIfPage', () => {
  const mockOnBack = vi.fn();

  const mockStoreState = {
    outcome: 'Weight',
    rawData: [
      { Weight: 10.2, Machine: 'A' },
      { Weight: 10.5, Machine: 'B' },
      { Weight: 9.8, Machine: 'A' },
    ],
    specs: { usl: 12, lsl: 8 },
    columnAliases: {},
    cpkTarget: undefined,
    viewState: null,
    filters: {},
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    useProjectStore.setState(
      mockStoreState as unknown as Partial<ReturnType<typeof useProjectStore.getState>>
    );
  });

  it('renders empty state when no data', () => {
    useProjectStore.setState({ outcome: null, rawData: [], filters: {} });

    render(<WhatIfPage onBack={mockOnBack} />);

    expect(screen.getByText('Load data and set specification limits first.')).toBeInTheDocument();
  });

  it('renders header with back button, beaker icon, and title', () => {
    render(<WhatIfPage onBack={mockOnBack} />);

    expect(screen.getByText('What-If Simulator')).toBeInTheDocument();
    expect(screen.getByTitle('Back to Dashboard')).toBeInTheDocument();
  });

  it('shows outcome name and sample count', () => {
    render(<WhatIfPage onBack={mockOnBack} />);

    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('n = 3')).toBeInTheDocument();
  });

  it('shows filter count badge when filters active', () => {
    render(<WhatIfPage onBack={mockOnBack} filterCount={2} />);

    expect(screen.getByText('2 filters')).toBeInTheDocument();
  });

  it('does not show filter badge when no filters', () => {
    render(<WhatIfPage onBack={mockOnBack} filterCount={0} />);

    expect(screen.queryByText(/filter/)).not.toBeInTheDocument();
  });

  it('shows singular "filter" for count of 1', () => {
    render(<WhatIfPage onBack={mockOnBack} filterCount={1} />);

    expect(screen.getByText('1 filter')).toBeInTheDocument();
  });

  it('shows specs warning when no USL/LSL', () => {
    useProjectStore.setState({ specs: {} });

    render(<WhatIfPage onBack={mockOnBack} />);

    expect(
      screen.getByText('Set specification limits (USL/LSL) to see Cpk and yield projections.')
    ).toBeInTheDocument();
  });

  it('does not show specs warning when specs are set', () => {
    render(<WhatIfPage onBack={mockOnBack} />);

    expect(
      screen.queryByText('Set specification limits (USL/LSL) to see Cpk and yield projections.')
    ).not.toBeInTheDocument();
  });

  it('back button calls onBack', () => {
    render(<WhatIfPage onBack={mockOnBack} />);

    fireEvent.click(screen.getByTitle('Back to Dashboard'));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  it('renders WhatIfSimulator when stats are available', () => {
    render(<WhatIfPage onBack={mockOnBack} />);

    expect(screen.getByTestId('what-if-simulator')).toBeInTheDocument();
  });
});
