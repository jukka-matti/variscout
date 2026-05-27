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

describe('TimeAsFactorsModal — Step 2 dimensions', () => {
  const step2Props = {
    timeColumns: ['OrderDate'],
    sourceColumn: 'OrderDate',
    rows: [{ OrderDate: '2025-01-15T14:30:00Z' }],
    onSave: () => {},
    onClose: () => {},
  };

  it('renders all 6 dimension checkboxes in order', () => {
    render(<TimeAsFactorsModal {...step2Props} />);
    const checkboxes = screen.getAllByRole('checkbox');
    const labels = checkboxes.map(
      c => c.getAttribute('aria-label') || c.parentElement?.textContent || ''
    );
    expect(checkboxes).toHaveLength(6);
    // Order: Year, Quarter, Month, Week, Day of week, Hour
    expect(labels[0]).toMatch(/Year/i);
    expect(labels[1]).toMatch(/Quarter/i);
    expect(labels[2]).toMatch(/Month/i);
    expect(labels[3]).toMatch(/Week/i);
    expect(labels[4]).toMatch(/Day of week/i);
    expect(labels[5]).toMatch(/Hour/i);
  });

  it('Hour granularity picker is disabled when Hour is unchecked', () => {
    render(<TimeAsFactorsModal {...step2Props} />);
    const picker = screen.getByLabelText(/Hour granularity/i);
    expect(picker).toBeDisabled();
  });

  it('Hour granularity picker enables when Hour is checked', () => {
    render(<TimeAsFactorsModal {...step2Props} />);
    const hourCheckbox = screen.getByRole('checkbox', { name: /Hour/i });
    fireEvent.click(hourCheckbox);
    const picker = screen.getByLabelText(/Hour granularity/i);
    expect(picker).toBeEnabled();
  });

  it('Save button is disabled when no dimensions checked', () => {
    render(<TimeAsFactorsModal {...step2Props} />);
    expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
  });

  it('Save button enables after checking a dimension', () => {
    render(<TimeAsFactorsModal {...step2Props} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Year/i }));
    expect(screen.getByRole('button', { name: /Save/i })).toBeEnabled();
  });

  it('Save button label includes source column + dimension count', () => {
    render(<TimeAsFactorsModal {...step2Props} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Year/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Month/i }));
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    expect(saveBtn.textContent).toMatch(/OrderDate factors \(2\)/);
  });

  it('Save calls onSave with TimeDecompositionBinding matching state', () => {
    const onSave = vi.fn();
    render(<TimeAsFactorsModal {...step2Props} onSave={onSave} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Year/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Hour/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const binding = onSave.mock.calls[0][0];
    expect(binding.sourceColumn).toBe('OrderDate');
    expect(binding.dimensions).toEqual(['year', 'hour']);
    expect(binding.hourGranularityMinutes).toBe(60); // default
    expect(typeof binding.id).toBe('string');
    expect(binding.id.length).toBeGreaterThan(0);
  });

  it('Save omits hourGranularityMinutes when Hour is unchecked', () => {
    const onSave = vi.fn();
    render(<TimeAsFactorsModal {...step2Props} onSave={onSave} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Year/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));
    const binding = onSave.mock.calls[0][0];
    expect(binding.dimensions).toEqual(['year']);
    expect(binding.hourGranularityMinutes).toBeUndefined();
  });

  it('Save persists Hour granularity 15 when picker is changed', () => {
    const onSave = vi.fn();
    render(<TimeAsFactorsModal {...step2Props} onSave={onSave} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Hour/i }));
    fireEvent.change(screen.getByLabelText(/Hour granularity/i), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));
    const binding = onSave.mock.calls[0][0];
    expect(binding.hourGranularityMinutes).toBe(15);
  });
});

describe('TimeAsFactorsModal — Step 2 pre-fill from existingBinding', () => {
  it('pre-checks dimensions from existingBinding', () => {
    const binding = createTestTimeDecompositionBinding({
      sourceColumn: 'OrderDate',
      dimensions: ['year', 'quarter', 'hour'],
      hourGranularityMinutes: 15,
    });
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        sourceColumn="OrderDate"
        existingBinding={binding}
        rows={[{ OrderDate: '2025-01-15' }]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole('checkbox', { name: /Year/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Quarter/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Hour/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Month/i })).not.toBeChecked();
    expect((screen.getByLabelText(/Hour granularity/i) as HTMLSelectElement).value).toBe('15');
  });

  it('preserves the binding id when saving an edit', () => {
    const onSave = vi.fn();
    const binding = createTestTimeDecompositionBinding({
      id: 'existing-id-xyz',
      sourceColumn: 'OrderDate',
      dimensions: ['year'],
    });
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        sourceColumn="OrderDate"
        existingBinding={binding}
        rows={[{ OrderDate: '2025-01-15' }]}
        onSave={onSave}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));
    expect(onSave.mock.calls[0][0].id).toBe('existing-id-xyz');
  });
});

describe('TimeAsFactorsModal — Back button', () => {
  it('shows Back button when user reached Step 2 via Step 1', () => {
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        rows={[]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    // Advance from Step 1 to Step 2 manually
    fireEvent.click(screen.getByRole('radio', { name: 'OrderDate' }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
  });

  it('hides Back button when sourceColumn prop bypassed Step 1', () => {
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        sourceColumn="OrderDate"
        rows={[]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
  });

  it('hides Back button when existingBinding bypassed Step 1', () => {
    const binding = createTestTimeDecompositionBinding({ sourceColumn: 'OrderDate' });
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        sourceColumn="OrderDate"
        existingBinding={binding}
        rows={[{ OrderDate: '2025-01-15' }]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
  });

  it('Back button returns to Step 1', () => {
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate', 'ShipDate']}
        rows={[]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('radio', { name: 'OrderDate' }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByText(/Step 1 of 2/)).toBeInTheDocument();
  });
});

describe('TimeAsFactorsModal — live preview', () => {
  it('hides preview before any dimension is picked', () => {
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        sourceColumn="OrderDate"
        rows={[{ OrderDate: '2025-01-15' }]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.queryByText(/Sample/i)).not.toBeInTheDocument();
  });

  it('shows sample row after dimensions are picked', () => {
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        sourceColumn="OrderDate"
        rows={[{ OrderDate: '2025-01-15' }]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Year/i }));
    expect(screen.getByText(/Sample/i)).toBeInTheDocument();
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it('shows fallback copy when first row date is unparseable', () => {
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        sourceColumn="OrderDate"
        rows={[{ OrderDate: 'banana' }]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Year/i }));
    expect(screen.getByText(/couldn't be parsed|could not be parsed/i)).toBeInTheDocument();
  });

  it('hides preview entirely when rows is empty', () => {
    render(
      <TimeAsFactorsModal
        timeColumns={['OrderDate']}
        sourceColumn="OrderDate"
        rows={[]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Year/i }));
    expect(screen.queryByText(/Sample/i)).not.toBeInTheDocument();
  });
});
