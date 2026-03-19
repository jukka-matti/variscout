import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  const catalog: Record<string, string> = {
    'panel.dataTable': 'Data Table',
    'table.noData': 'No data to display',
    'table.page': 'Page {page} of {total}',
    'table.rowsPerPage': 'rows/page',
    'table.editHint': 'Click a cell to edit',
    'table.excluded': 'Excluded',
    'table.deleteRow': 'Delete row',
    'table.addRow': 'Add row',
    'table.unsavedChanges': 'Unsaved changes',
    'action.cancel': 'Cancel',
    'action.apply': 'Apply',
  };
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      tf: (key: string, params: Record<string, string | number>) => {
        let msg = catalog[key] ?? key;
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
        return msg;
      },
      formatStat: (n: number) => String(n),
      formatPct: (n: number) => `${n}%`,
      locale: 'en',
    }),
  };
});

import { DataTableModalBase } from '../index';

const mockData = [
  { name: 'Item A', value: 10, category: 'Type 1' },
  { name: 'Item B', value: 20, category: 'Type 2' },
  { name: 'Item C', value: 15, category: 'Type 1' },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onApply: vi.fn(),
  rawData: mockData,
  outcome: 'value' as string | null,
  specs: { usl: 25, lsl: 5 },
};

describe('DataTableModalBase', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    defaultProps.onClose = vi.fn();
    defaultProps.onApply = vi.fn();
  });

  it('renders nothing when isOpen is false', () => {
    render(<DataTableModalBase {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Data Table', { exact: true })).toBeNull();
  });

  it('renders table with columns from data', () => {
    render(<DataTableModalBase {...defaultProps} />);

    expect(screen.getByText('Data Table')).toBeTruthy();
    expect(screen.getByText('name')).toBeTruthy();
    expect(screen.getByText('value')).toBeTruthy();
    expect(screen.getByText('category')).toBeTruthy();
  });

  it('renders correct number of rows', () => {
    render(<DataTableModalBase {...defaultProps} />);

    expect(screen.getByText('3 rows')).toBeTruthy();
    expect(screen.getByText('Item A')).toBeTruthy();
    expect(screen.getByText('Item B')).toBeTruthy();
    expect(screen.getByText('Item C')).toBeTruthy();
  });

  it('Apply button is disabled when no changes', () => {
    render(<DataTableModalBase {...defaultProps} />);
    expect(screen.getByText('Apply').closest('button')!.disabled).toBe(true);
  });

  it('applies changes on Apply button click', () => {
    render(<DataTableModalBase {...defaultProps} />);

    // Make a change via cell edit
    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    fireEvent.click(screen.getByText('Apply'));

    expect(defaultProps.onApply).toHaveBeenCalledTimes(1);
    expect(defaultProps.onApply).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Modified' })])
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('discards changes on Cancel click', () => {
    render(<DataTableModalBase {...defaultProps} />);

    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);

    fireEvent.click(screen.getByText('Cancel'));

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(defaultProps.onApply).not.toHaveBeenCalled();
  });

  it('renders Paste button in header', () => {
    render(<DataTableModalBase {...defaultProps} />);

    expect(screen.getByText('Paste')).toBeTruthy();
    expect(screen.getByTitle('Paste tab-delimited data from clipboard')).toBeTruthy();
  });

  it('handleBulkPaste expands rows and parses numeric values', () => {
    render(<DataTableModalBase {...defaultProps} />);

    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');

    const pasteData = 'New1\t99\nNew2\t88\nNew3\t77\nNew4\t66';
    fireEvent.paste(input, {
      clipboardData: { getData: () => pasteData },
    });

    fireEvent.click(screen.getByText('Apply'));

    expect(defaultProps.onApply).toHaveBeenCalledTimes(1);
    const savedData = defaultProps.onApply.mock.calls[0][0];
    expect(savedData[0].name).toBe('New1');
    expect(savedData[0].value).toBe(99);
    expect(savedData[3]).toBeDefined();
    expect(savedData[3].name).toBe('New4');
    expect(savedData[3].value).toBe(66);
    expect(savedData).toHaveLength(4);
  });

  it('shows empty state when rawData is empty', () => {
    render(<DataTableModalBase {...defaultProps} rawData={[]} />);
    expect(screen.getByText('No data to display')).toBeTruthy();
  });

  it('passes columnAliases to DataTableBase', () => {
    render(<DataTableModalBase {...defaultProps} columnAliases={{ name: 'Product' }} />);
    expect(screen.getByText('Product')).toBeTruthy();
  });

  it('passes controlViolations to DataTableBase', () => {
    const violations = new Map([[0, ['Special Cause: Above UCL']]]);
    render(<DataTableModalBase {...defaultProps} controlViolations={violations} />);
    expect(screen.getByTitle('Special Cause: Above UCL')).toBeTruthy();
  });

  it('shows filter excluded toggle when excludedRowIndices provided', () => {
    render(<DataTableModalBase {...defaultProps} excludedRowIndices={new Set([0, 2])} />);
    expect(screen.getByText('Show Excluded (2)')).toBeTruthy();
  });

  it('initialFilterExcluded sets initial filter state', () => {
    render(
      <DataTableModalBase
        {...defaultProps}
        excludedRowIndices={new Set([0, 2])}
        initialFilterExcluded={true}
      />
    );
    expect(screen.getByText('2 excluded rows')).toBeTruthy();
    expect(screen.getByText('Show All')).toBeTruthy();
  });
});
