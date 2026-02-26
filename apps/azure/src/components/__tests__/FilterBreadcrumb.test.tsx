import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBreadcrumb from '../FilterBreadcrumb';
import type { FilterChipData } from '@variscout/hooks';

// Capture props passed to the base FilterBreadcrumb from @variscout/ui
let capturedProps: Record<string, unknown> = {};

vi.mock('@variscout/ui', () => {
  return {
    FilterBreadcrumb: (props: Record<string, unknown>) => {
      capturedProps = props;
      const chipData = props.filterChipData as FilterChipData[];
      const aliases = (props.columnAliases || {}) as Record<string, string>;

      if (!chipData || chipData.length === 0) {
        return null;
      }

      return (
        <div data-testid="filter-breadcrumb-base">
          {chipData.map((chip: FilterChipData) => (
            <div key={chip.factor} data-testid={`chip-${chip.factor}`}>
              <span data-testid={`chip-label-${chip.factor}`}>
                {aliases[chip.factor] || chip.factor}: {chip.values.join(', ')}
              </span>
              <span data-testid={`chip-contribution-${chip.factor}`}>
                {Math.round(chip.contributionPct)}%
              </span>
              <button
                data-testid={`chip-remove-${chip.factor}`}
                onClick={() => (props.onRemoveFilter as (factor: string) => void)(chip.factor)}
              >
                Remove
              </button>
              <button
                data-testid={`chip-update-${chip.factor}`}
                onClick={() =>
                  (
                    props.onUpdateFilterValues as (
                      factor: string,
                      values: (string | number)[]
                    ) => void
                  )(chip.factor, ['NewValue'])
                }
              >
                Update
              </button>
            </div>
          ))}
          {typeof props.onClearAll === 'function' && (
            <button data-testid="clear-all" onClick={props.onClearAll as () => void}>
              Clear All
            </button>
          )}
          {props.cumulativeVariationPct != null && (
            <span data-testid="cumulative-variation">
              {props.cumulativeVariationPct as number}% variation
            </span>
          )}
        </div>
      );
    },
  };
});

describe('FilterBreadcrumb (Azure wrapper)', () => {
  const mockOnRemoveFilter = vi.fn();
  const mockOnClearAll = vi.fn();
  const mockOnUpdateFilterValues = vi.fn();

  const sampleChipData: FilterChipData[] = [
    {
      factor: 'Machine',
      values: ['A', 'B'],
      contributionPct: 45,
      availableValues: [
        { value: 'A', contributionPct: 25, isSelected: true },
        { value: 'B', contributionPct: 20, isSelected: true },
        { value: 'C', contributionPct: 10, isSelected: false },
      ],
    },
    {
      factor: 'Shift',
      values: ['Night'],
      contributionPct: 30,
      availableValues: [
        { value: 'Day', contributionPct: 8, isSelected: false },
        { value: 'Night', contributionPct: 30, isSelected: true },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps = {};
  });

  it('renders nothing when filterChipData is empty', () => {
    const { container } = render(
      <FilterBreadcrumb
        filterChipData={[]}
        onRemoveFilter={mockOnRemoveFilter}
        onUpdateFilterValues={mockOnUpdateFilterValues}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders filter chips when filterChipData has entries', () => {
    render(
      <FilterBreadcrumb
        filterChipData={sampleChipData}
        onRemoveFilter={mockOnRemoveFilter}
        onUpdateFilterValues={mockOnUpdateFilterValues}
      />
    );

    expect(screen.getByTestId('filter-breadcrumb-base')).toBeInTheDocument();
    expect(screen.getByTestId('chip-Machine')).toBeInTheDocument();
    expect(screen.getByTestId('chip-Shift')).toBeInTheDocument();
    expect(screen.getByText(/Machine: A, B/)).toBeInTheDocument();
    expect(screen.getByText(/Shift: Night/)).toBeInTheDocument();
  });

  it('does not pass a custom color scheme (uses default semantic tokens)', () => {
    render(
      <FilterBreadcrumb
        filterChipData={sampleChipData}
        onRemoveFilter={mockOnRemoveFilter}
        onUpdateFilterValues={mockOnUpdateFilterValues}
      />
    );

    expect(capturedProps.colorScheme).toBeUndefined();
  });

  it('calls onRemoveFilter when a chip remove button is clicked', () => {
    render(
      <FilterBreadcrumb
        filterChipData={sampleChipData}
        onRemoveFilter={mockOnRemoveFilter}
        onUpdateFilterValues={mockOnUpdateFilterValues}
      />
    );

    fireEvent.click(screen.getByTestId('chip-remove-Machine'));

    expect(mockOnRemoveFilter).toHaveBeenCalledTimes(1);
    expect(mockOnRemoveFilter).toHaveBeenCalledWith('Machine');
  });

  it('calls onClearAll when clear button is clicked', () => {
    render(
      <FilterBreadcrumb
        filterChipData={sampleChipData}
        onRemoveFilter={mockOnRemoveFilter}
        onUpdateFilterValues={mockOnUpdateFilterValues}
        onClearAll={mockOnClearAll}
      />
    );

    fireEvent.click(screen.getByTestId('clear-all'));

    expect(mockOnClearAll).toHaveBeenCalledTimes(1);
  });

  it('shows cumulative variation percentage', () => {
    render(
      <FilterBreadcrumb
        filterChipData={sampleChipData}
        onRemoveFilter={mockOnRemoveFilter}
        onUpdateFilterValues={mockOnUpdateFilterValues}
        cumulativeVariationPct={62}
      />
    );

    expect(screen.getByTestId('cumulative-variation')).toHaveTextContent('62% variation');
  });

  it('calls onUpdateFilterValues when chip dropdown changes', () => {
    render(
      <FilterBreadcrumb
        filterChipData={sampleChipData}
        onRemoveFilter={mockOnRemoveFilter}
        onUpdateFilterValues={mockOnUpdateFilterValues}
      />
    );

    fireEvent.click(screen.getByTestId('chip-update-Shift'));

    expect(mockOnUpdateFilterValues).toHaveBeenCalledTimes(1);
    expect(mockOnUpdateFilterValues).toHaveBeenCalledWith('Shift', ['NewValue']);
  });

  it('handles column aliases correctly', () => {
    const aliases = {
      Machine: 'Equipment',
      Shift: 'Work Period',
    };

    render(
      <FilterBreadcrumb
        filterChipData={sampleChipData}
        columnAliases={aliases}
        onRemoveFilter={mockOnRemoveFilter}
        onUpdateFilterValues={mockOnUpdateFilterValues}
      />
    );

    expect(screen.getByTestId('chip-label-Machine')).toHaveTextContent('Equipment: A, B');
    expect(screen.getByTestId('chip-label-Shift')).toHaveTextContent('Work Period: Night');
    // Also verify aliases are forwarded to the base component
    expect(capturedProps.columnAliases).toEqual(aliases);
  });
});
