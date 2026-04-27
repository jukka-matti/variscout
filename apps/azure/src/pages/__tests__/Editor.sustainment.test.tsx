import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// vi.mock BEFORE component imports (testing.md invariant)
vi.mock('../../components/SustainmentRecordEditor', () => ({
  default: ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div data-testid="sustainment-record-editor">
      <select aria-label="Cadence">
        <option value="monthly">Monthly</option>
      </select>
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Import the component under test after mocks
import { SustainmentEntryRow } from '../Editor.sustainment';

describe('SustainmentEntryRow', () => {
  it('renders the "Set up sustainment cadence" button when investigationId is set', () => {
    render(<SustainmentEntryRow investigationId="inv-123" hubId="hub-1" />);
    expect(screen.getByText('Set up sustainment cadence')).toBeInTheDocument();
  });

  it('opens SustainmentRecordEditor when the button is clicked', () => {
    render(<SustainmentEntryRow investigationId="inv-123" hubId="hub-1" />);
    fireEvent.click(screen.getByText('Set up sustainment cadence'));
    expect(screen.getByTestId('sustainment-record-editor')).toBeInTheDocument();
  });

  it('shows confirmation and hides editor after save', () => {
    render(<SustainmentEntryRow investigationId="inv-123" hubId="hub-1" />);
    fireEvent.click(screen.getByText('Set up sustainment cadence'));
    fireEvent.click(screen.getByText('Save'));
    expect(screen.queryByTestId('sustainment-record-editor')).not.toBeInTheDocument();
    expect(screen.getByText('Sustainment cadence saved.')).toBeInTheDocument();
  });

  it('hides editor when cancel is clicked', () => {
    render(<SustainmentEntryRow investigationId="inv-123" hubId="hub-1" />);
    fireEvent.click(screen.getByText('Set up sustainment cadence'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('sustainment-record-editor')).not.toBeInTheDocument();
    expect(screen.getByText('Set up sustainment cadence')).toBeInTheDocument();
  });

  it('renders disabled button with hint when investigationId is null', () => {
    render(<SustainmentEntryRow investigationId={null} hubId="hub-1" />);
    const btn = screen.getByRole('button', { name: 'Set up sustainment cadence' });
    expect(btn).toBeDisabled();
    expect(
      screen.getByText('Save the investigation first to set up sustainment cadence.')
    ).toBeInTheDocument();
  });
});
