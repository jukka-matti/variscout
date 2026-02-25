import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTableModal from '../data/DataTableModal';
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
    } as unknown as ReturnType<typeof DataContextModule.useData>);
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

  it('applies changes on Apply button click', () => {
    const mockOnClose = vi.fn();
    render(<DataTableModal isOpen={true} onClose={mockOnClose} />);

    // Make a change via cell edit
    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    // Click Apply Changes
    const applyButton = screen.getByText('Apply Changes');
    fireEvent.click(applyButton);

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

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockSetRawData).not.toHaveBeenCalled();
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
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/No data loaded/i)).toBeInTheDocument();
  });
});
