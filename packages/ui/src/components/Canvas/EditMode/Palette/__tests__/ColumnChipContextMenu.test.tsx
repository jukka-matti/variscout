import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnChipContextMenu } from '../ColumnChipContextMenu';

const baseProps = {
  columnName: 'Speed',
  kind: 'numeric' as const,
  anchor: { x: 100, y: 200 },
  onItemSelect: vi.fn(),
  onClose: vi.fn(),
};

describe('ColumnChipContextMenu', () => {
  it('renders the spec items for the given kind', () => {
    render(<ColumnChipContextMenu {...baseProps} />);
    expect(screen.getByText('Use as continuous factor')).toBeInTheDocument();
    expect(screen.getByText('Bin into categorical…')).toBeInTheDocument();
    expect(screen.getByText('View distribution in Explore →')).toBeInTheDocument();
    expect(screen.getByText('Calculate from this column…')).toBeInTheDocument();
    expect(screen.getByText('Parsing & format')).toBeInTheDocument();
    expect(screen.getByText('Rename column…')).toBeInTheDocument();
  });

  it('fires onItemSelect with columnName + itemId on click', () => {
    const onItemSelect = vi.fn();
    render(<ColumnChipContextMenu {...baseProps} onItemSelect={onItemSelect} />);
    fireEvent.click(screen.getByText('Bin into categorical…'));
    expect(onItemSelect).toHaveBeenCalledWith('Speed', 'bin-into-categorical');
  });

  it('fires onClose after item click', () => {
    const onClose = vi.fn();
    render(<ColumnChipContextMenu {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Parsing & format'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ColumnChipContextMenu {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    render(<ColumnChipContextMenu {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('column-chip-menu-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the kind-specific item set for categorical', () => {
    render(<ColumnChipContextMenu {...baseProps} kind="categorical" />);
    expect(screen.getByText('Use as process step')).toBeInTheDocument();
    expect(screen.getByText('Combine levels…')).toBeInTheDocument();
  });
});
