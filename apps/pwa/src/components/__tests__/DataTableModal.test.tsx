import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTableModal from '../data/DataTableModal';
import * as DataContextModule from '../../context/DataContext';

describe('PWA DataTableModal wrapper', () => {
  const mockData = [{ name: 'Item A', value: 10, category: 'Type 1' }];
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

  it('bridges useData context to DataTableModalBase', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Data Table')).toBeInTheDocument();
    expect(screen.getByText('Item A')).toBeInTheDocument();
  });

  it('wires setRawData to onApply', () => {
    const mockOnClose = vi.fn();
    render(<DataTableModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    fireEvent.click(screen.getByText('Apply Changes'));

    expect(mockSetRawData).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('maps showExcludedOnly to initialFilterExcluded', () => {
    render(
      <DataTableModal
        isOpen={true}
        onClose={() => {}}
        showExcludedOnly={true}
        excludedRowIndices={new Set([0])}
      />
    );
    expect(screen.getByText('Show All')).toBeInTheDocument();
  });
});
