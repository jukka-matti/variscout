import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockListControlRecords = vi.fn();
const mockGetEasyAuthUser = vi.fn();

// vi.mock BEFORE component imports (testing.md invariant)
vi.mock('../../services/storage', () => ({
  useStorage: () => ({
    listControlRecords: mockListControlRecords,
  }),
}));

vi.mock('../../auth/easyAuth', () => ({
  getEasyAuthUser: (...args: unknown[]) => mockGetEasyAuthUser(...args),
}));

vi.mock('../../components/ControlRecordEditor', () => ({
  default: ({
    onSave,
    onCancel,
    existingRecord,
  }: {
    onSave: () => void;
    onCancel: () => void;
    existingRecord?: { id: string };
  }) => (
    <div data-testid="sustainment-record-editor">
      <span data-testid="editor-mode">
        {existingRecord ? `edit:${existingRecord.id}` : 'create'}
      </span>
      <select aria-label="Cadence">
        <option value="monthly">Monthly</option>
      </select>
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Import the component under test after mocks
import { ControlEntryRow } from '../Editor.control';

beforeEach(() => {
  mockListControlRecords.mockReset();
  mockListControlRecords.mockResolvedValue([]);
  mockGetEasyAuthUser.mockReset();
  mockGetEasyAuthUser.mockResolvedValue({
    name: 'Test User',
    email: 'test@variscout.test',
    userId: 'aad-test-001',
    roles: [],
  });
});

describe('ControlEntryRow', () => {
  it('renders the "Set up control cadence" button when investigationId is set and no record exists', async () => {
    render(<ControlEntryRow investigationId="inv-123" hubId="hub-1" />);
    expect(await screen.findByText('Set up control cadence')).toBeInTheDocument();
  });

  it('opens ControlRecordEditor when the button is clicked', async () => {
    render(<ControlEntryRow investigationId="inv-123" hubId="hub-1" />);
    fireEvent.click(await screen.findByText('Set up control cadence'));
    expect(screen.getByTestId('sustainment-record-editor')).toBeInTheDocument();
  });

  it('shows confirmation and hides editor after save', async () => {
    render(<ControlEntryRow investigationId="inv-123" hubId="hub-1" />);
    fireEvent.click(await screen.findByText('Set up control cadence'));
    fireEvent.click(screen.getByText('Save'));
    expect(screen.queryByTestId('sustainment-record-editor')).not.toBeInTheDocument();
    expect(screen.getByText('Control cadence saved.')).toBeInTheDocument();
  });

  it('hides editor when cancel is clicked', async () => {
    render(<ControlEntryRow investigationId="inv-123" hubId="hub-1" />);
    fireEvent.click(await screen.findByText('Set up control cadence'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('sustainment-record-editor')).not.toBeInTheDocument();
    expect(screen.getByText('Set up control cadence')).toBeInTheDocument();
  });

  it('renders disabled button with hint when investigationId is null', () => {
    render(<ControlEntryRow investigationId={null} hubId="hub-1" />);
    const btn = screen.getByRole('button', { name: 'Set up control cadence' });
    expect(btn).toBeDisabled();
    expect(screen.getByText('Save the investigation first.')).toBeInTheDocument();
  });

  it('shows "Edit" label and passes existingRecord when a live record matches the investigation', async () => {
    mockListControlRecords.mockResolvedValue([
      {
        id: 'rec-1',
        investigationId: 'inv-123',
        hubId: 'hub-1',
        cadence: 'monthly',
        createdAt: 1745625600000,
        updatedAt: 1745625600000,
        deletedAt: null,
      },
    ]);
    render(<ControlEntryRow investigationId="inv-123" hubId="hub-1" />);
    expect(await screen.findByText('Edit control cadence')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Edit control cadence'));
    expect(screen.getByTestId('editor-mode')).toHaveTextContent('edit:rec-1');
  });

  it('ignores soft-deleted records (deletedAt !== null) — shows "Set up" not "Edit"', async () => {
    mockListControlRecords.mockResolvedValue([
      {
        id: 'rec-old',
        investigationId: 'inv-123',
        hubId: 'hub-1',
        cadence: 'monthly',
        deletedAt: 1745107200000, // 2026-04-20T00:00:00.000Z
        createdAt: 1743465600000, // 2026-04-01T00:00:00.000Z
        updatedAt: 1745107200000, // 2026-04-20T00:00:00.000Z
      },
    ]);
    render(<ControlEntryRow investigationId="inv-123" hubId="hub-1" />);
    expect(await screen.findByText('Set up control cadence')).toBeInTheDocument();
  });

  it('uses "updated" confirmation copy when editing an existing record', async () => {
    mockListControlRecords.mockResolvedValue([
      {
        id: 'rec-1',
        investigationId: 'inv-123',
        hubId: 'hub-1',
        cadence: 'monthly',
        createdAt: 1745625600000,
        updatedAt: 1745625600000,
        deletedAt: null,
      },
    ]);
    render(<ControlEntryRow investigationId="inv-123" hubId="hub-1" />);
    fireEvent.click(await screen.findByText('Edit control cadence'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByText('Control cadence updated.')).toBeInTheDocument());
  });
});
