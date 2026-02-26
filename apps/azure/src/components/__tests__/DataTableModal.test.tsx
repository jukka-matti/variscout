import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTableModal from '../data/DataTableModal';
import * as DataContextModule from '../../context/DataContext';

describe('Azure DataTableModal', () => {
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
      columnAliases: { name: 'Product' },
      setRawData: mockSetRawData,
    } as unknown as ReturnType<typeof DataContextModule.useData>);
  });

  it('renders nothing when isOpen is false', () => {
    render(<DataTableModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Data Table')).not.toBeInTheDocument();
  });

  it('renders table with data when open', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Data Table')).toBeInTheDocument();
    expect(screen.getByText('3 rows')).toBeInTheDocument();
    // Column aliases are passed through
    expect(screen.getByText('Product')).toBeInTheDocument();
  });

  it('applies changes and calls setRawData', () => {
    const mockOnClose = vi.fn();
    render(<DataTableModal isOpen={true} onClose={mockOnClose} />);

    // Edit a cell
    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    // Apply
    fireEvent.click(screen.getByText('Apply Changes'));

    expect(mockSetRawData).toHaveBeenCalledTimes(1);
    expect(mockSetRawData).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Modified' })])
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('discards changes on Cancel', () => {
    const mockOnClose = vi.fn();
    render(<DataTableModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockSetRawData).not.toHaveBeenCalled();
  });

  it('Apply button is disabled when no changes', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Apply Changes')).toBeDisabled();
  });

  it('passes control violations to DataTableBase', () => {
    const violations = new Map([[0, ['Special Cause: Above UCL']]]);

    render(<DataTableModal isOpen={true} onClose={() => {}} controlViolations={violations} />);

    expect(screen.getByTitle('Special Cause: Above UCL')).toBeInTheDocument();
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
