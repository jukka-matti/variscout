import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FactorManagerPopover from '../FactorManagerPopover';

// Mock useColumnClassification hook
vi.mock('@variscout/hooks', () => ({
  useColumnClassification: () => ({
    numeric: ['Value'],
    categorical: ['Machine', 'Shift', 'Operator', 'Line', 'Product', 'Batch', 'Zone'],
  }),
}));

const defaultProps = {
  rawData: [
    {
      Value: 10,
      Machine: 'A',
      Shift: 'Day',
      Operator: 'Op1',
      Line: 'L1',
      Product: 'P1',
      Batch: 'B1',
      Zone: 'Z1',
    },
  ],
  outcome: 'Value',
  factors: ['Machine', 'Shift'],
  filters: { Machine: ['A'] },
  onFactorsChange: vi.fn(),
  onFiltersChange: vi.fn(),
};

describe('FactorManagerPopover', () => {
  it('renders the trigger button with factor count', () => {
    render(<FactorManagerPopover {...defaultProps} />);

    expect(screen.getByText('Factors')).toBeInTheDocument();
    expect(screen.getByText('(2/6)')).toBeInTheDocument();
  });

  it('opens popover on button click', () => {
    render(<FactorManagerPopover {...defaultProps} />);

    fireEvent.click(screen.getByText('Factors'));

    expect(screen.getByText('Manage Factors')).toBeInTheDocument();
    expect(screen.getByText('Machine')).toBeInTheDocument();
    expect(screen.getByText('Shift')).toBeInTheDocument();
    expect(screen.getByText('Operator')).toBeInTheDocument();
  });

  it('adds a new factor and calls onFactorsChange on apply', () => {
    const onFactorsChange = vi.fn();
    render(<FactorManagerPopover {...defaultProps} onFactorsChange={onFactorsChange} />);

    // Open popover
    fireEvent.click(screen.getByText('Factors'));

    // Click 'Operator' to add it
    fireEvent.click(screen.getByText('Operator'));

    // Click Apply
    fireEvent.click(screen.getByText('Apply'));

    expect(onFactorsChange).toHaveBeenCalledWith(['Machine', 'Shift', 'Operator']);
  });

  it('removes a factor and cleans up its filter', () => {
    const onFactorsChange = vi.fn();
    const onFiltersChange = vi.fn();
    render(
      <FactorManagerPopover
        {...defaultProps}
        onFactorsChange={onFactorsChange}
        onFiltersChange={onFiltersChange}
      />
    );

    // Open popover
    fireEvent.click(screen.getByText('Factors'));

    // Click 'Machine' to deselect it (currently selected)
    fireEvent.click(screen.getByText('Machine'));

    // Click Apply
    fireEvent.click(screen.getByText('Apply'));

    // Should remove Machine from factors
    expect(onFactorsChange).toHaveBeenCalledWith(['Shift']);
    // Should clean up Machine filter
    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  it('enforces max 6 factors', () => {
    const props = {
      ...defaultProps,
      factors: ['Machine', 'Shift', 'Operator', 'Line', 'Product', 'Batch'],
    };
    render(<FactorManagerPopover {...props} />);

    // Open popover
    fireEvent.click(screen.getByText('Factors'));

    // Zone should be disabled since we're at 6/6
    const zoneButton = screen.getByText('Zone').closest('button');
    expect(zoneButton).toBeDisabled();
  });

  it('cancel resets pending changes', () => {
    const onFactorsChange = vi.fn();
    render(<FactorManagerPopover {...defaultProps} onFactorsChange={onFactorsChange} />);

    // Open popover
    fireEvent.click(screen.getByText('Factors'));

    // Add Operator
    fireEvent.click(screen.getByText('Operator'));

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Should not call onFactorsChange
    expect(onFactorsChange).not.toHaveBeenCalled();
  });

  it('Apply button is disabled when no changes are made', () => {
    render(<FactorManagerPopover {...defaultProps} />);

    // Open popover
    fireEvent.click(screen.getByText('Factors'));

    const applyBtn = screen.getByText('Apply');
    expect(applyBtn).toBeDisabled();
  });
});
