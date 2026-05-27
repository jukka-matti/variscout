import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeAsFactorsModal } from '../TimeAsFactorsModal';
import { createTestTimeDecompositionBinding } from '../../../../../test-utils/timeDecompositionBinding';

const noop = () => {};
const baseProps = {
  timeColumns: ['OrderDate', 'ShipDate'],
  rows: [{ OrderDate: '2025-01-15', ShipDate: '2025-01-20' }],
  onSave: noop,
  onClose: noop,
};

describe('TimeAsFactorsModal — shell + Step 1', () => {
  it('renders inside a dialog with the correct title and labelling', () => {
    render(<TimeAsFactorsModal {...baseProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'time-factors-modal-title');
    expect(screen.getByText('Use time as factors')).toBeInTheDocument();
  });

  it('shows Step 1 of 2 indicator by default', () => {
    render(<TimeAsFactorsModal {...baseProps} />);
    expect(screen.getByText(/Step 1 of 2/)).toBeInTheDocument();
  });

  it('shows column radio group on Step 1', () => {
    render(<TimeAsFactorsModal {...baseProps} />);
    expect(screen.getByText(/Pick a time column/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'OrderDate' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'ShipDate' })).toBeInTheDocument();
  });

  it('Next button is disabled until a column is picked', () => {
    render(<TimeAsFactorsModal {...baseProps} />);
    const next = screen.getByRole('button', { name: /Next/i });
    expect(next).toBeDisabled();
  });

  it('Next button enables after picking a column', () => {
    render(<TimeAsFactorsModal {...baseProps} />);
    fireEvent.click(screen.getByRole('radio', { name: 'OrderDate' }));
    expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
  });

  it('advances to Step 2 of 2 after clicking Next', () => {
    render(<TimeAsFactorsModal {...baseProps} />);
    fireEvent.click(screen.getByRole('radio', { name: 'OrderDate' }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/Step 2 of 2/)).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<TimeAsFactorsModal {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<TimeAsFactorsModal {...baseProps} onClose={onClose} />);
    const backdrop = screen.getByTestId('time-factors-modal-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('TimeAsFactorsModal — empty state', () => {
  it('shows empty state when no time columns detected', () => {
    render(<TimeAsFactorsModal {...baseProps} timeColumns={[]} />);
    expect(screen.getByText(/No time columns detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Parsing & format/i)).toBeInTheDocument();
  });

  it('hides Next button in empty state', () => {
    render(<TimeAsFactorsModal {...baseProps} timeColumns={[]} />);
    expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();
  });

  it('still shows a close button in empty state', () => {
    render(<TimeAsFactorsModal {...baseProps} timeColumns={[]} />);
    expect(screen.getByRole('button', { name: /Close|Cancel/i })).toBeInTheDocument();
  });
});

describe('TimeAsFactorsModal — sourceColumn prop bypasses Step 1', () => {
  it('opens at Step 2 when sourceColumn is in timeColumns', () => {
    render(<TimeAsFactorsModal {...baseProps} sourceColumn="OrderDate" />);
    expect(screen.getByText(/Step 2 of 2/)).toBeInTheDocument();
  });

  it('falls back to Step 1 when sourceColumn is NOT in timeColumns', () => {
    render(<TimeAsFactorsModal {...baseProps} sourceColumn="UnknownCol" />);
    expect(screen.getByText(/Step 1 of 2/)).toBeInTheDocument();
  });
});

describe('TimeAsFactorsModal — existingBinding starts at Step 2', () => {
  it('opens at Step 2 when existingBinding is provided', () => {
    const binding = createTestTimeDecompositionBinding({ sourceColumn: 'OrderDate' });
    render(
      <TimeAsFactorsModal {...baseProps} sourceColumn="OrderDate" existingBinding={binding} />
    );
    expect(screen.getByText(/Step 2 of 2/)).toBeInTheDocument();
  });
});
