import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const msgs: Record<string, string> = {
          'panel.dataTable': 'Data Table',
          'table.unsavedChanges': 'Unsaved changes',
          'table.addRow': 'Add row',
          'table.noData': 'No data to display',
          'table.editHint': 'Click a cell to edit',
          'table.deleteRow': 'Delete row',
          'table.rowsPerPage': 'Rows per page',
          'action.cancel': 'Cancel',
          'action.apply': 'Apply',
        };
        return msgs[key] ?? key;
      },
      tf: (key: string, params: Record<string, string | number>) => {
        let msg = key;
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
        return msg;
      },
      locale: 'en' as const,
      formatNumber: (v: number) => v.toFixed(2),
      formatStat: (v: number, d = 2) => v.toFixed(d),
      formatPct: (v: number) => `${(v * 100).toFixed(1)}%`,
    }),
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import DataTableModal from '../data/DataTableModal';
import * as DataContextModule from '../../context/DataContext';

describe('Azure DataTableModal wrapper', () => {
  const mockData = [{ name: 'Item A', value: 10, category: 'Type 1' }];
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

  it('bridges useData context including columnAliases', () => {
    render(<DataTableModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Data Table')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
  });

  it('wires setRawData to onApply', () => {
    const mockOnClose = vi.fn();
    render(<DataTableModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    fireEvent.click(screen.getByText('Apply'));

    expect(mockSetRawData).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('passes controlViolations through', () => {
    const violations = new Map([[0, ['Special Cause: Above UCL']]]);
    render(<DataTableModal isOpen={true} onClose={() => {}} controlViolations={violations} />);
    expect(screen.getByTitle('Special Cause: Above UCL')).toBeInTheDocument();
  });
});
