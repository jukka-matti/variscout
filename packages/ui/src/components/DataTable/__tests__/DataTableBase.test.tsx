import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTableBase } from '../index';

const mockData = [
  { name: 'Item A', value: 10, category: 'Type 1' },
  { name: 'Item B', value: 20, category: 'Type 2' },
  { name: 'Item C', value: 15, category: 'Type 1' },
];

const columns = ['name', 'value', 'category'];

describe('DataTableBase', () => {
  it('renders column headers and data rows', () => {
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{ usl: 25, lsl: 5 }}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    expect(screen.getByText('name')).toBeTruthy();
    expect(screen.getByText('category')).toBeTruthy();
    expect(screen.getByText('Item A')).toBeTruthy();
    expect(screen.getByText('Item B')).toBeTruthy();
    expect(screen.getByText('Item C')).toBeTruthy();
  });

  it('highlights outcome column header with (Y) marker', () => {
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    const valueHeader = screen.getByText('value');
    expect(valueHeader.closest('th')?.className).toContain('text-blue-400');
    expect(screen.getByText('(Y)')).toBeTruthy();
  });

  it('shows spec status badges when outcome and specs provided', () => {
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{ usl: 25, lsl: 5 }}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    expect(screen.getByText('Status')).toBeTruthy();
    // All values (10, 20, 15) are within 5-25 => PASS
    expect(screen.getAllByText('PASS')).toHaveLength(3);
  });

  it('shows USL badge for values above upper spec limit', () => {
    const data = [{ value: 30 }];
    render(
      <DataTableBase
        data={data}
        columns={['value']}
        outcome="value"
        specs={{ usl: 25, lsl: 5 }}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    expect(screen.getByText('USL')).toBeTruthy();
  });

  it('shows LSL badge for values below lower spec limit', () => {
    const data = [{ value: 2 }];
    render(
      <DataTableBase
        data={data}
        columns={['value']}
        outcome="value"
        specs={{ usl: 25, lsl: 5 }}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    expect(screen.getByText('LSL')).toBeTruthy();
  });

  it('allows cell editing on click and calls onCellChange on blur', () => {
    const onCellChange = vi.fn();
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{}}
        onCellChange={onCellChange}
        onDeleteRow={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: 'Item A Modified' } });
    fireEvent.blur(input);

    expect(onCellChange).toHaveBeenCalledWith(0, 'name', 'Item A Modified');
  });

  it('saves numeric values as numbers', () => {
    const onCellChange = vi.fn();
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{}}
        onCellChange={onCellChange}
        onDeleteRow={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('10'));
    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.blur(input);

    expect(onCellChange).toHaveBeenCalledWith(0, 'value', 42);
  });

  it('handles Enter key: saves current cell', () => {
    const onCellChange = vi.fn();
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{}}
        onCellChange={onCellChange}
        onDeleteRow={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onCellChange).toHaveBeenCalledWith(0, 'name', 'Item A');
  });

  it('handles Escape key: cancels editing without saving', () => {
    const onCellChange = vi.fn();
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{}}
        onCellChange={onCellChange}
        onDeleteRow={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Item A'));
    const input = screen.getByDisplayValue('Item A');
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCellChange).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Changed')).toBeNull();
  });

  it('calls onDeleteRow when delete button is clicked', () => {
    const onDeleteRow = vi.fn();
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={onDeleteRow}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete row');
    expect(deleteButtons).toHaveLength(3);

    fireEvent.click(deleteButtons[0]);
    expect(onDeleteRow).toHaveBeenCalledWith(0);
  });

  it('shows excluded row indicators', () => {
    const excludedSet = new Set([1]);
    const reasonsMap = new Map([[1, [{ type: 'missing' as const, column: 'value' }]]]);

    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{ usl: 25, lsl: 5 }}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
        excludedRowIndices={excludedSet}
        excludedReasons={reasonsMap}
      />
    );

    expect(screen.getByText('EXCL')).toBeTruthy();
  });

  it('shows control violation indicators', () => {
    const violations = new Map([[0, ['Special Cause: Above UCL']]]);

    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
        controlViolations={violations}
      />
    );

    expect(screen.getByTitle('Special Cause: Above UCL')).toBeTruthy();
  });

  it('displays column aliases when provided', () => {
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome="value"
        specs={{}}
        columnAliases={{ name: 'Product Name', category: 'Type' }}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    expect(screen.getByText('Product Name')).toBeTruthy();
    expect(screen.getByText('Type')).toBeTruthy();
  });

  it('shows empty state when data is empty', () => {
    render(
      <DataTableBase
        data={[]}
        columns={[]}
        outcome="value"
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    expect(screen.getByText(/No data loaded/i)).toBeTruthy();
  });

  it('does not show Status column when no outcome', () => {
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome={null}
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    expect(screen.queryByText('Status')).toBeNull();
    expect(screen.queryByText('(Y)')).toBeNull();
  });

  it('shows help text', () => {
    render(
      <DataTableBase
        data={mockData}
        columns={columns}
        outcome={null}
        specs={{}}
        onCellChange={vi.fn()}
        onDeleteRow={vi.fn()}
      />
    );

    expect(screen.getByText(/Click a cell to edit/)).toBeTruthy();
  });

  describe('ArrowDown/ArrowUp navigation', () => {
    it('ArrowDown saves cell and moves to next row', () => {
      const onCellChange = vi.fn();
      render(
        <DataTableBase
          data={mockData}
          columns={columns}
          outcome={null}
          specs={{}}
          onCellChange={onCellChange}
          onDeleteRow={vi.fn()}
        />
      );

      // Click first row, name column
      fireEvent.click(screen.getByText('Item A'));
      const input = screen.getByDisplayValue('Item A');
      fireEvent.change(input, { target: { value: 'Edited' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(onCellChange).toHaveBeenCalledWith(0, 'name', 'Edited');
    });

    it('ArrowUp saves cell and moves to previous row', () => {
      const onCellChange = vi.fn();
      render(
        <DataTableBase
          data={mockData}
          columns={columns}
          outcome={null}
          specs={{}}
          onCellChange={onCellChange}
          onDeleteRow={vi.fn()}
        />
      );

      // Click second row, name column
      fireEvent.click(screen.getByText('Item B'));
      const input = screen.getByDisplayValue('Item B');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(onCellChange).toHaveBeenCalledWith(1, 'name', 'Item B');
    });

    it('ArrowUp on first row does not crash', () => {
      const onCellChange = vi.fn();
      render(
        <DataTableBase
          data={mockData}
          columns={columns}
          outcome={null}
          specs={{}}
          onCellChange={onCellChange}
          onDeleteRow={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Item A'));
      const input = screen.getByDisplayValue('Item A');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(onCellChange).toHaveBeenCalledWith(0, 'name', 'Item A');
    });

    it('ArrowDown on last row does not crash', () => {
      const onCellChange = vi.fn();
      render(
        <DataTableBase
          data={mockData}
          columns={columns}
          outcome={null}
          specs={{}}
          onCellChange={onCellChange}
          onDeleteRow={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Item C'));
      const input = screen.getByDisplayValue('Item C');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(onCellChange).toHaveBeenCalledWith(2, 'name', 'Item C');
    });
  });

  describe('multi-cell paste', () => {
    it('calls onBulkPaste with parsed grid for multi-cell paste', () => {
      const onBulkPaste = vi.fn();
      render(
        <DataTableBase
          data={mockData}
          columns={columns}
          outcome={null}
          specs={{}}
          onCellChange={vi.fn()}
          onDeleteRow={vi.fn()}
          onBulkPaste={onBulkPaste}
        />
      );

      fireEvent.click(screen.getByText('Item A'));
      const input = screen.getByDisplayValue('Item A');

      // Simulate pasting a 2x2 grid
      const pasteData = 'Alpha\tBeta\nGamma\tDelta';
      fireEvent.paste(input, {
        clipboardData: { getData: () => pasteData },
      });

      expect(onBulkPaste).toHaveBeenCalledWith(0, 'name', [
        ['Alpha', 'Beta'],
        ['Gamma', 'Delta'],
      ]);
    });

    it('does NOT call onBulkPaste for single-cell paste', () => {
      const onBulkPaste = vi.fn();
      render(
        <DataTableBase
          data={mockData}
          columns={columns}
          outcome={null}
          specs={{}}
          onCellChange={vi.fn()}
          onDeleteRow={vi.fn()}
          onBulkPaste={onBulkPaste}
        />
      );

      fireEvent.click(screen.getByText('Item A'));
      const input = screen.getByDisplayValue('Item A');

      fireEvent.paste(input, {
        clipboardData: { getData: () => 'SingleValue' },
      });

      expect(onBulkPaste).not.toHaveBeenCalled();
    });

    it('strips trailing empty line from paste data', () => {
      const onBulkPaste = vi.fn();
      render(
        <DataTableBase
          data={mockData}
          columns={columns}
          outcome={null}
          specs={{}}
          onCellChange={vi.fn()}
          onDeleteRow={vi.fn()}
          onBulkPaste={onBulkPaste}
        />
      );

      fireEvent.click(screen.getByText('Item A'));
      const input = screen.getByDisplayValue('Item A');

      // Excel adds trailing newline
      const pasteData = 'X\tY\nZ\tW\n';
      fireEvent.paste(input, {
        clipboardData: { getData: () => pasteData },
      });

      expect(onBulkPaste).toHaveBeenCalledWith(0, 'name', [
        ['X', 'Y'],
        ['Z', 'W'],
      ]);
    });

    it('does not call onBulkPaste when prop is not provided', () => {
      render(
        <DataTableBase
          data={mockData}
          columns={columns}
          outcome={null}
          specs={{}}
          onCellChange={vi.fn()}
          onDeleteRow={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Item A'));
      const input = screen.getByDisplayValue('Item A');

      // Should not throw
      fireEvent.paste(input, {
        clipboardData: { getData: () => 'A\tB\nC\tD' },
      });
    });
  });
});
