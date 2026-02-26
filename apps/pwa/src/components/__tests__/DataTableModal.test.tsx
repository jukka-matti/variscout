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

  it('renders Paste button in header', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Paste')).toBeInTheDocument();
    expect(screen.getByTitle('Paste tab-delimited data from clipboard')).toBeInTheDocument();
  });

  it('handleBulkPaste expands rows and parses numeric values', () => {
    const mockOnClose = vi.fn();
    render(<DataTableModal isOpen={true} onClose={mockOnClose} />);

    // Click cell to start editing, then paste multi-cell data
    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');

    // Paste a 4-row grid (extends beyond 3 existing rows)
    const pasteData = 'New1\t99\nNew2\t88\nNew3\t77\nNew4\t66';
    fireEvent.paste(input, {
      clipboardData: { getData: () => pasteData },
    });

    // Apply to check what setRawData receives
    fireEvent.click(screen.getByText('Apply Changes'));

    expect(mockSetRawData).toHaveBeenCalledTimes(1);
    const savedData = mockSetRawData.mock.calls[0][0];
    // Row 0 should have pasted values
    expect(savedData[0].name).toBe('New1');
    expect(savedData[0].value).toBe(99);
    // Row 3 should be auto-expanded
    expect(savedData[3]).toBeDefined();
    expect(savedData[3].name).toBe('New4');
    expect(savedData[3].value).toBe(66);
    expect(savedData).toHaveLength(4);
  });
});
