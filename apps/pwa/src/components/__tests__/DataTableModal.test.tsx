import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTableModal from '../DataTableModal';
import * as DataContextModule from '../../context/DataContext';

describe('DataTableModal', () => {
  const mockData = [
    { name: 'Item A', value: 10, category: 'Type 1' },
    { name: 'Item B', value: 20, category: 'Type 2' },
    { name: 'Item C', value: 15, category: 'Type 1' },
  ];

  const mockSetRawData = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockSetRawData.mockClear();

    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      rawData: mockData,
      outcome: 'value',
      specs: { usl: 25, lsl: 5 },
      setRawData: mockSetRawData,
    } as any);
  });

  it('renders nothing when isOpen is false', () => {
    render(<DataTableModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Data Table')).not.toBeInTheDocument();
  });

  it('renders table with columns from data', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Data Table')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('value')).toBeInTheDocument();
    expect(screen.getByText('category')).toBeInTheDocument();
  });

  it('renders correct number of rows', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('3 rows')).toBeInTheDocument();
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    expect(screen.getByText('Item C')).toBeInTheDocument();
  });

  it('allows cell editing on click', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    // Click on a cell to start editing
    const itemA = screen.getByText('Item A');
    fireEvent.click(itemA);

    // Should show an input field
    const input = screen.getByDisplayValue('Item A');
    expect(input).toBeInTheDocument();
  });

  it('updates cell value on blur', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    // Click to edit
    fireEvent.click(screen.getByText('Item A'));

    // Change value
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Item A Modified' } });
    fireEvent.blur(input);

    // Should show modified value
    expect(screen.getByText('Item A Modified')).toBeInTheDocument();
    expect(screen.getByText('(unsaved changes)')).toBeInTheDocument();
  });

  it('shows Add Row button and adds row on click', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    // Find and click Add Row button
    const addRowButton = screen.getByText('Add Row');
    expect(addRowButton).toBeInTheDocument();

    fireEvent.click(addRowButton);

    // Should show 4 rows now
    expect(screen.getByText('4 rows')).toBeInTheDocument();
  });

  it('shows delete button for each row', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    // Should have 3 delete buttons (one per row)
    const deleteButtons = screen.getAllByTitle('Delete row');
    expect(deleteButtons).toHaveLength(3);
  });

  it('deletes row on delete click', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    // Click first delete button
    const deleteButtons = screen.getAllByTitle('Delete row');
    fireEvent.click(deleteButtons[0]);

    // Should show 2 rows now
    expect(screen.getByText('2 rows')).toBeInTheDocument();
    expect(screen.queryByText('Item A')).not.toBeInTheDocument();
  });

  it('applies changes on Apply button click', () => {
    const mockOnClose = vi.fn();
    render(<DataTableModal isOpen={true} onClose={mockOnClose} />);

    // Make a change
    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    // Click Apply Changes
    const applyButton = screen.getByText('Apply Changes');
    fireEvent.click(applyButton);

    // Should call setRawData with modified data
    expect(mockSetRawData).toHaveBeenCalledTimes(1);
    expect(mockSetRawData).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Modified' })])
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('discards changes on Cancel click', () => {
    const mockOnClose = vi.fn();
    render(<DataTableModal isOpen={true} onClose={mockOnClose} />);

    // Make a change
    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    // Click Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Should call onClose but NOT setRawData
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockSetRawData).not.toHaveBeenCalled();
  });

  it('shows status badges for outcome column', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    // Should show Status column
    expect(screen.getByText('Status')).toBeInTheDocument();

    // All values (10, 20, 15) are within spec (5-25), so should be PASS
    const passBadges = screen.getAllByText('PASS');
    expect(passBadges.length).toBeGreaterThan(0);
  });

  it('Apply button is disabled when no changes', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    const applyButton = screen.getByText('Apply Changes');
    expect(applyButton).toBeDisabled();
  });

  it('shows empty state message when no data', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      rawData: [],
      outcome: 'value',
      specs: {},
      setRawData: mockSetRawData,
    } as any);

    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/No data loaded/i)).toBeInTheDocument();
  });
});
