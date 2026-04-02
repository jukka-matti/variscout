import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileChartCarousel from '../MobileChartCarousel';

// Mock chart components (they depend on DataContext)
vi.mock('../charts/IChart', () => ({
  default: () => <div data-testid="ichart-mock">I-Chart</div>,
}));
vi.mock('../charts/Boxplot', () => ({
  default: ({
    factor,
    onDrillDown,
  }: {
    factor: string;
    onDrillDown?: (factor: string, value: string) => void;
  }) => (
    <div data-testid="boxplot-mock">
      Boxplot: {factor}
      {onDrillDown && (
        <button data-testid="boxplot-tap" onClick={() => onDrillDown(factor, 'A')}>
          Tap A
        </button>
      )}
    </div>
  ),
}));
vi.mock('../charts/ParetoChart', () => ({
  default: ({
    factor,
    onDrillDown,
  }: {
    factor: string;
    onDrillDown?: (factor: string, value: string) => void;
  }) => (
    <div data-testid="pareto-mock">
      Pareto: {factor}
      {onDrillDown && (
        <button data-testid="pareto-tap" onClick={() => onDrillDown(factor, 'X')}>
          Tap X
        </button>
      )}
    </div>
  ),
}));
vi.mock('../ProcessIntelligencePanel', () => ({
  default: () => <div data-testid="stats-mock">Process Intelligence Panel</div>,
}));
vi.mock('../PeoplePicker', () => ({
  default: ({
    onSelect,
  }: {
    onSelect: (assignee: { upn: string; displayName: string; userId: string }) => void;
  }) => (
    <button
      data-testid="people-picker-mock"
      onClick={() => onSelect({ upn: 'jane@co.com', displayName: 'Jane', userId: 'u-1' })}
    >
      Pick person
    </button>
  ),
}));
// Mock @variscout/ui components
vi.mock('@variscout/ui', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FilterBreadcrumb: () => <div data-testid="filter-breadcrumb-mock">Breadcrumb</div>,
  AnovaResults: () => <div data-testid="anova-mock">ANOVA</div>,
  FactorSelector: ({
    factors,
    selected,
    onChange,
  }: {
    factors: string[];
    selected: string;
    onChange: (v: string) => void;
  }) => (
    <select
      data-testid="factor-selector-mock"
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      {factors.map(f => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  ),
  MobileCategorySheet: ({
    data,
    onDrillDown,
    onSetHighlight,
    onPinFinding,
    onClose,
    currentHighlight,
    renderExtra,
  }: {
    data: { categoryKey: string; chartType: string } | null;
    onDrillDown: () => void;
    onSetHighlight: (color: string | undefined) => void;
    onPinFinding?: (note: string) => void;
    onClose: () => void;
    currentHighlight?: string;
    renderExtra?: () => React.ReactNode;
  }) =>
    data ? (
      <div data-testid="mobile-category-sheet">
        <span data-testid="sheet-category">{data.categoryKey}</span>
        <span data-testid="sheet-chart-type">{data.chartType}</span>
        <span data-testid="sheet-highlight">{currentHighlight || 'none'}</span>
        <button data-testid="sheet-drill-down" onClick={onDrillDown}>
          Drill down
        </button>
        <button data-testid="sheet-highlight-red" onClick={() => onSetHighlight('red')}>
          Red
        </button>
        <button data-testid="sheet-highlight-clear" onClick={() => onSetHighlight(undefined)}>
          Clear
        </button>
        {onPinFinding && (
          <button data-testid="sheet-pin-finding" onClick={() => onPinFinding('test note')}>
            Pin
          </button>
        )}
        <button data-testid="sheet-close" onClick={onClose}>
          Close
        </button>
        {renderExtra && <div data-testid="sheet-extra">{renderExtra()}</div>}
      </div>
    ) : null,
}));

const defaultProps = {
  factorState: {
    boxplotFactor: 'Machine',
    paretoFactor: 'Operator',
    factors: ['Machine', 'Operator', 'Shift'],
    onSetBoxplotFactor: vi.fn(),
    onSetParetoFactor: vi.fn(),
  },
  filterContext: {
    filters: {},
    columnAliases: {},
    filterChipData: [] as {
      factor: string;
      values: (string | number)[];
      contributionPct: number;
      availableValues: { value: string | number; contributionPct: number; isSelected: boolean }[];
    }[],
    cumulativeVariationPct: 0,
    onUpdateFilterValues: vi.fn(),
    onRemoveFilter: vi.fn(),
    onClearAllFilters: vi.fn(),
  },
  paretoOptions: {
    paretoAggregation: 'count' as const,
    onToggleParetoAggregation: vi.fn(),
    showParetoComparison: false,
    onToggleParetoComparison: vi.fn(),
  },
  highlights: {
    boxplotHighlights: {} as Record<string, 'red' | 'amber' | 'green'>,
    paretoHighlights: {} as Record<string, 'red' | 'amber' | 'green'>,
    onSetHighlight: vi.fn(),
  },
  onDrillDown: vi.fn(),
  factorVariations: new Map<string, number>(),
  stats: null,
  specs: {},
  filteredData: [],
  outcome: 'Weight',
  onSaveSpecs: vi.fn(),
  showCpk: true,
  anovaResult: null,
  boxplotData: [
    {
      key: 'A',
      values: [10, 11, 12],
      min: 10,
      max: 12,
      q1: 10.5,
      median: 11,
      mean: 11,
      q3: 11.5,
      outliers: [],
      stdDev: 1,
    },
    {
      key: 'B',
      values: [13, 14, 15],
      min: 13,
      max: 15,
      q1: 13.5,
      median: 14,
      mean: 14,
      q3: 14.5,
      outliers: [],
      stdDev: 1,
    },
  ],
};

describe('MobileChartCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders I-Chart view by default', () => {
    render(<MobileChartCarousel {...defaultProps} />);
    expect(screen.getByTestId('ichart-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('boxplot-mock')).not.toBeInTheDocument();
  });

  it('switches to Boxplot via pill navigation', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    // Click the second pill button (Boxplot)
    const pillButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.classList.contains('rounded-full'));
    fireEvent.click(pillButtons[1]); // Boxplot is second pill

    expect(screen.getByTestId('boxplot-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('ichart-mock')).not.toBeInTheDocument();
  });

  it('switches to next view via chevron right', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    const nextBtn = screen.getByLabelText('Next chart');
    fireEvent.click(nextBtn);

    // Should now show Boxplot (second view)
    expect(screen.getByTestId('boxplot-mock')).toBeInTheDocument();
  });

  it('switches to previous view via chevron left', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    const prevBtn = screen.getByLabelText('Previous chart');
    fireEvent.click(prevBtn);

    // Should wrap around to Stats (last view)
    expect(screen.getByTestId('stats-mock')).toBeInTheDocument();
  });

  it('cycles through all 4 views', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    const nextBtn = screen.getByLabelText('Next chart');

    // Start at ichart
    expect(screen.getByTestId('ichart-mock')).toBeInTheDocument();

    // Next → boxplot
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('boxplot-mock')).toBeInTheDocument();

    // Next → pareto
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('pareto-mock')).toBeInTheDocument();

    // Next → stats
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('stats-mock')).toBeInTheDocument();

    // Next → wraps to ichart
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('ichart-mock')).toBeInTheDocument();
  });

  it('shows FactorSelector for boxplot view', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    // Navigate to boxplot
    const nextBtn = screen.getByLabelText('Next chart');
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('factor-selector-mock')).toBeInTheDocument();
  });

  it('shows FactorSelector for pareto view', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    // Navigate to pareto (2 clicks)
    const nextBtn = screen.getByLabelText('Next chart');
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('factor-selector-mock')).toBeInTheDocument();
  });

  it('does not show FactorSelector for ichart view', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    expect(screen.queryByTestId('factor-selector-mock')).not.toBeInTheDocument();
  });

  it('shows FilterBreadcrumb when filters are active', () => {
    const filterChipData = [
      {
        factor: 'Machine',
        values: ['A'] as (string | number)[],
        contributionPct: 45,
        availableValues: [
          { value: 'A', contributionPct: 45, isSelected: true },
          { value: 'B', contributionPct: 30, isSelected: false },
        ],
      },
    ];

    render(
      <MobileChartCarousel
        {...defaultProps}
        filterContext={{ ...defaultProps.filterContext, filterChipData }}
      />
    );
    expect(screen.getByTestId('filter-breadcrumb-mock')).toBeInTheDocument();
  });

  it('does not show FilterBreadcrumb when no filters', () => {
    render(
      <MobileChartCarousel
        {...defaultProps}
        filterContext={{ ...defaultProps.filterContext, filterChipData: [] }}
      />
    );
    expect(screen.queryByTestId('filter-breadcrumb-mock')).not.toBeInTheDocument();
  });

  it('renders dot indicators for all 4 views', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    const dots = screen
      .getAllByRole('button')
      .filter(btn => btn.classList.contains('rounded-full') && btn.classList.contains('w-2'));
    expect(dots).toHaveLength(4);
  });

  it('handles swipe left to go to next view', () => {
    const { container } = render(<MobileChartCarousel {...defaultProps} />);

    const carousel = container.firstChild as HTMLElement;

    // Simulate swipe left (finger moves from right to left)
    fireEvent.touchStart(carousel, {
      targetTouches: [{ clientX: 300 }],
    });
    fireEvent.touchMove(carousel, {
      targetTouches: [{ clientX: 100 }],
    });
    fireEvent.touchEnd(carousel);

    // Should now show Boxplot
    expect(screen.getByTestId('boxplot-mock')).toBeInTheDocument();
  });

  it('handles swipe right to go to previous view', () => {
    const { container } = render(<MobileChartCarousel {...defaultProps} />);

    const carousel = container.firstChild as HTMLElement;

    // Simulate swipe right (finger moves from left to right)
    fireEvent.touchStart(carousel, {
      targetTouches: [{ clientX: 100 }],
    });
    fireEvent.touchMove(carousel, {
      targetTouches: [{ clientX: 300 }],
    });
    fireEvent.touchEnd(carousel);

    // Should wrap to Stats (last view)
    expect(screen.getByTestId('stats-mock')).toBeInTheDocument();
  });

  it('ignores swipe below minimum distance', () => {
    const { container } = render(<MobileChartCarousel {...defaultProps} />);

    const carousel = container.firstChild as HTMLElement;

    // Swipe less than 50px
    fireEvent.touchStart(carousel, {
      targetTouches: [{ clientX: 200 }],
    });
    fireEvent.touchMove(carousel, {
      targetTouches: [{ clientX: 180 }],
    });
    fireEvent.touchEnd(carousel);

    // Should stay on I-Chart
    expect(screen.getByTestId('ichart-mock')).toBeInTheDocument();
  });

  it('shows ANOVA results on boxplot view when available', () => {
    const anovaResult = {
      groups: [
        { name: 'A', n: 50, mean: 10, stdDev: 2 },
        { name: 'B', n: 50, mean: 12, stdDev: 2 },
      ],
      ssb: 150,
      ssw: 430,
      dfBetween: 2,
      dfWithin: 97,
      msb: 75,
      msw: 4.43,
      fStatistic: 15.2,
      pValue: 0.001,
      isSignificant: true,
      etaSquared: 0.35,
      insight: 'Significant difference between groups',
    };

    render(<MobileChartCarousel {...defaultProps} anovaResult={anovaResult} />);

    // Navigate to boxplot
    const nextBtn = screen.getByLabelText('Next chart');
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('anova-mock')).toBeInTheDocument();
  });

  // --- Category Sheet Interceptor Tests ---

  it('opens category sheet when tapping a boxplot category', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    // Navigate to boxplot
    fireEvent.click(screen.getByLabelText('Next chart'));
    expect(screen.getByTestId('boxplot-mock')).toBeInTheDocument();

    // Tap a category
    fireEvent.click(screen.getByTestId('boxplot-tap'));

    // Sheet should appear
    expect(screen.getByTestId('mobile-category-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-category')).toHaveTextContent('A');
    expect(screen.getByTestId('sheet-chart-type')).toHaveTextContent('boxplot');
  });

  it('opens category sheet when tapping a pareto bar', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    // Navigate to pareto (2 clicks)
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByLabelText('Next chart'));
    expect(screen.getByTestId('pareto-mock')).toBeInTheDocument();

    // Tap a bar
    fireEvent.click(screen.getByTestId('pareto-tap'));

    // Sheet should appear
    expect(screen.getByTestId('mobile-category-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-category')).toHaveTextContent('X');
    expect(screen.getByTestId('sheet-chart-type')).toHaveTextContent('pareto');
  });

  it('performs drill-down via category sheet', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    // Navigate to boxplot and tap
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));

    // Should NOT have called onDrillDown yet (intercepted)
    expect(defaultProps.onDrillDown).not.toHaveBeenCalled();

    // Click drill-down in sheet
    fireEvent.click(screen.getByTestId('sheet-drill-down'));

    // Now onDrillDown should fire with the category
    expect(defaultProps.onDrillDown).toHaveBeenCalledWith('Machine', 'A');
  });

  it('closes category sheet via close button', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    // Navigate to boxplot and tap
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));
    expect(screen.getByTestId('mobile-category-sheet')).toBeInTheDocument();

    // Close the sheet
    fireEvent.click(screen.getByTestId('sheet-close'));
    expect(screen.queryByTestId('mobile-category-sheet')).not.toBeInTheDocument();
  });

  it('delegates highlight to onSetHighlight with correct chart type', () => {
    render(<MobileChartCarousel {...defaultProps} />);

    // Navigate to boxplot and tap
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));

    // Set highlight via sheet
    fireEvent.click(screen.getByTestId('sheet-highlight-red'));

    expect(defaultProps.highlights.onSetHighlight).toHaveBeenCalledWith('boxplot', 'A', 'red');
  });

  it('delegates pin finding with note text (no chart observation)', () => {
    const onPinFinding = vi.fn();
    render(<MobileChartCarousel {...defaultProps} onPinFinding={onPinFinding} />);

    // Navigate to boxplot and tap
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));

    // Pin finding via sheet
    fireEvent.click(screen.getByTestId('sheet-pin-finding'));

    expect(onPinFinding).toHaveBeenCalledWith('test note');
  });

  it('passes noteText through to onAddChartObservation (bug fix)', () => {
    const onAddChartObservation = vi.fn();
    const onPinFinding = vi.fn();
    render(
      <MobileChartCarousel
        {...defaultProps}
        onPinFinding={onPinFinding}
        findingsCallbacks={{ onAddChartObservation }}
      />
    );

    // Navigate to boxplot and tap
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));

    // Pin finding via sheet (mock sends 'test note')
    fireEvent.click(screen.getByTestId('sheet-pin-finding'));

    // Should call onAddChartObservation WITH the note text
    expect(onAddChartObservation).toHaveBeenCalledWith('boxplot', 'A', 'test note');
    // Should NOT fall through to onPinFinding
    expect(onPinFinding).not.toHaveBeenCalled();
  });

  it('shows highlights on boxplot categories', () => {
    const boxplotHighlights = { A: 'red' as const };
    render(
      <MobileChartCarousel
        {...defaultProps}
        highlights={{ ...defaultProps.highlights, boxplotHighlights }}
      />
    );

    // Navigate to boxplot and tap A
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));

    // Sheet should show current highlight
    expect(screen.getByTestId('sheet-highlight')).toHaveTextContent('red');
  });

  // --- Channel @mention share flow tests ---

  it('transitions to confirm phase when canMentionInChannel=true and finding returned', () => {
    const mockFinding = {
      id: 'f-new',
      text: 'test note',
      createdAt: Date.now(),
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed' as const,
      comments: [],
      statusChangedAt: Date.now(),
    };
    const onAddChartObservation = vi.fn().mockReturnValue(mockFinding);
    const onPinFinding = vi.fn();

    render(
      <MobileChartCarousel
        {...defaultProps}
        onPinFinding={onPinFinding}
        findingsCallbacks={{
          onAddChartObservation,
          canMentionInChannel: true,
          onShareFinding: vi.fn(),
        }}
      />
    );

    // Navigate to boxplot and tap
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));
    fireEvent.click(screen.getByTestId('sheet-pin-finding'));

    // Should show confirm phase (post-pin flow)
    expect(screen.getByTestId('post-pin-flow')).toBeInTheDocument();
    expect(screen.getByTestId('share-to-channel')).toBeInTheDocument();
  });

  it('"Share to Channel" calls onShareFinding with finding and assignee', async () => {
    const mockFinding = {
      id: 'f-new',
      text: 'test note',
      createdAt: Date.now(),
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed' as const,
      comments: [],
      statusChangedAt: Date.now(),
    };
    const onAddChartObservation = vi.fn().mockReturnValue(mockFinding);
    const onShareFinding = vi.fn().mockResolvedValue(true);
    const onSetFindingAssignee = vi.fn();

    render(
      <MobileChartCarousel
        {...defaultProps}
        onPinFinding={vi.fn()}
        findingsCallbacks={{
          onAddChartObservation,
          canMentionInChannel: true,
          onShareFinding,
          onSetFindingAssignee,
        }}
      />
    );

    // Navigate to boxplot, tap, pin
    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));
    fireEvent.click(screen.getByTestId('sheet-pin-finding'));

    // Select a person via mock PeoplePicker
    fireEvent.click(screen.getByTestId('people-picker-mock'));

    // Click share
    fireEvent.click(screen.getByTestId('share-to-channel'));

    // Wait for async
    await vi.waitFor(() => {
      expect(onShareFinding).toHaveBeenCalledWith(mockFinding, {
        upn: 'jane@co.com',
        displayName: 'Jane',
        userId: 'u-1',
      });
    });
  });

  it('shows success state after successful share', async () => {
    const mockFinding = {
      id: 'f-new',
      text: 'test note',
      createdAt: Date.now(),
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed' as const,
      comments: [],
      statusChangedAt: Date.now(),
    };
    const onAddChartObservation = vi.fn().mockReturnValue(mockFinding);
    const onShareFinding = vi.fn().mockResolvedValue(true);

    render(
      <MobileChartCarousel
        {...defaultProps}
        onPinFinding={vi.fn()}
        findingsCallbacks={{ onAddChartObservation, canMentionInChannel: true, onShareFinding }}
      />
    );

    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));
    fireEvent.click(screen.getByTestId('sheet-pin-finding'));
    fireEvent.click(screen.getByTestId('share-to-channel'));

    await vi.waitFor(() => {
      expect(screen.getByTestId('share-success')).toBeInTheDocument();
      expect(screen.getByText('Shared to channel')).toBeInTheDocument();
    });
  });

  it('shows error state on share promise rejection', async () => {
    const mockFinding = {
      id: 'f-new',
      text: 'test note',
      createdAt: Date.now(),
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed' as const,
      comments: [],
      statusChangedAt: Date.now(),
    };
    const onAddChartObservation = vi.fn().mockReturnValue(mockFinding);
    const onShareFinding = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <MobileChartCarousel
        {...defaultProps}
        onPinFinding={vi.fn()}
        findingsCallbacks={{ onAddChartObservation, canMentionInChannel: true, onShareFinding }}
      />
    );

    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));
    fireEvent.click(screen.getByTestId('sheet-pin-finding'));
    fireEvent.click(screen.getByTestId('share-to-channel'));

    await vi.waitFor(() => {
      expect(screen.getByTestId('share-error')).toBeInTheDocument();
    });
  });

  it('"Done" closes sheet without sharing', () => {
    const mockFinding = {
      id: 'f-new',
      text: 'test note',
      createdAt: Date.now(),
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed' as const,
      comments: [],
      statusChangedAt: Date.now(),
    };
    const onAddChartObservation = vi.fn().mockReturnValue(mockFinding);
    const onShareFinding = vi.fn();

    render(
      <MobileChartCarousel
        {...defaultProps}
        onPinFinding={vi.fn()}
        findingsCallbacks={{ onAddChartObservation, canMentionInChannel: true, onShareFinding }}
      />
    );

    fireEvent.click(screen.getByLabelText('Next chart'));
    fireEvent.click(screen.getByTestId('boxplot-tap'));
    fireEvent.click(screen.getByTestId('sheet-pin-finding'));

    // Confirm phase shown
    expect(screen.getByTestId('post-pin-flow')).toBeInTheDocument();

    // Click Done instead of sharing
    fireEvent.click(screen.getByTestId('post-pin-done'));

    // Sheet should close
    expect(screen.queryByTestId('mobile-category-sheet')).not.toBeInTheDocument();
    // onShareFinding should NOT have been called
    expect(onShareFinding).not.toHaveBeenCalled();
  });
});
