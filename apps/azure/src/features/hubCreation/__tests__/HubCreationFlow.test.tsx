/**
 * HubCreationFlow — Mode B routing tests.
 *
 * Verifies: Stage 1 gate, skip path, re-edit bypass, onHubCreated callback.
 * Word-style durability (FSJ-3a): hub creation is in-memory; no saveProcessHub.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// vi.mock BEFORE component/hook imports (anti-hang rule)
vi.mock('../../../auth/getCurrentUser', () => ({
  getCurrentUser: vi.fn(),
}));

// NOTE: useStorage is intentionally NOT mocked here — neither HubCreationFlow nor
// useNewHubProvision imports useStorage (eager-persist retired, spec §3).
// Eager-persist regression is guarded by Dashboard.processHub.test.tsx's
// load-bearing control (the page-level mock resolves the real storage seam).

vi.mock('@variscout/ui', () => ({
  HubGoalForm: ({
    onConfirm,
    onSkip,
  }: {
    onConfirm: (narrative: string) => void;
    onSkip: () => void;
  }) => (
    <div data-testid="hub-goal-form">
      <button onClick={() => onConfirm('We mold barrels for medical customers.')}>
        Confirm goal
      </button>
      <button onClick={onSkip}>Skip</button>
    </div>
  ),
  ColumnMapping: ({
    onConfirm,
    onCancel,
    goalContext,
  }: {
    onConfirm: (payload: {
      outcomes: Array<{ columnName: string; characteristicType: string }>;
      primaryScopeDimensions: string[];
      outcome: string;
      factors: string[];
    }) => void;
    onCancel: () => void;
    goalContext?: string;
  }) => (
    <div data-testid="column-mapping" data-goal-context={goalContext}>
      <button
        onClick={() =>
          onConfirm({
            outcomes: [{ columnName: 'Weight', characteristicType: 'nominalIsBest' }],
            primaryScopeDimensions: ['Machine'],
            outcome: 'Weight',
            factors: ['Machine'],
          })
        }
      >
        Confirm mapping
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

import { HubCreationFlow } from '../HubCreationFlow';
import { getCurrentUser } from '../../../auth/getCurrentUser';
import type { HubCreationFlowProps } from '../HubCreationFlow';
import { useUnsavedHubsStore } from '../../hubs/unsavedHubsStore';

beforeEach(() => {
  vi.clearAllMocks();
  useUnsavedHubsStore.setState(useUnsavedHubsStore.getInitialState(), true);
  (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
    name: 'Local Developer',
    email: 'dev@localhost',
  });
});

const baseProps: HubCreationFlowProps = {
  columnAnalysis: undefined,
  availableColumns: ['Weight', 'Machine'],
  previewRows: [{ Weight: 10, Machine: 'A' }],
  totalRows: 5,
  columnAliases: {},
  onColumnRename: vi.fn(),
  initialOutcome: null,
  initialFactors: [],
  datasetName: 'Test Dataset',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  isMappingReEdit: false,
};

describe('HubCreationFlow', () => {
  it('shows Stage 1 (HubGoalForm) for a new investigation', () => {
    render(<HubCreationFlow {...baseProps} />);
    expect(screen.getByTestId('hub-creation-stage1')).toBeInTheDocument();
    expect(screen.getByTestId('hub-goal-form')).toBeInTheDocument();
  });

  it('skips Stage 1 on re-edit and renders ColumnMapping directly', () => {
    render(<HubCreationFlow {...baseProps} isMappingReEdit={true} />);
    expect(screen.queryByTestId('hub-creation-stage1')).not.toBeInTheDocument();
    expect(screen.getByTestId('column-mapping')).toBeInTheDocument();
  });

  it('skips Stage 1 when processHubId is already set', () => {
    render(<HubCreationFlow {...baseProps} processHubId="existing-hub-id" />);
    expect(screen.queryByTestId('hub-creation-stage1')).not.toBeInTheDocument();
    expect(screen.getByTestId('column-mapping')).toBeInTheDocument();
  });

  it('advances to ColumnMapping after goal confirm', async () => {
    render(<HubCreationFlow {...baseProps} />);
    fireEvent.click(screen.getByText('Confirm goal'));
    await waitFor(() => expect(screen.getByTestId('column-mapping')).toBeInTheDocument());
    expect(screen.queryByTestId('hub-creation-stage1')).not.toBeInTheDocument();
  });

  it('passes goalContext to ColumnMapping after goal confirm', async () => {
    render(<HubCreationFlow {...baseProps} />);
    fireEvent.click(screen.getByText('Confirm goal'));
    await waitFor(() => expect(screen.getByTestId('column-mapping')).toBeInTheDocument());
    expect(screen.getByTestId('column-mapping')).toHaveAttribute(
      'data-goal-context',
      'We mold barrels for medical customers.'
    );
  });

  it('advances to ColumnMapping on skip without goal context', async () => {
    render(<HubCreationFlow {...baseProps} />);
    fireEvent.click(screen.getByText('Skip'));
    await waitFor(() => expect(screen.getByTestId('column-mapping')).toBeInTheDocument());
    // Skipped goal → no goalContext prop on ColumnMapping
    expect(screen.getByTestId('column-mapping')).not.toHaveAttribute('data-goal-context');
  });

  it('creates an in-memory hub on goal confirm (Word-style: hub lands in unsaved store)', async () => {
    render(<HubCreationFlow {...baseProps} />);
    fireEvent.click(screen.getByText('Confirm goal'));
    await waitFor(() => expect(useUnsavedHubsStore.getState().hubs).toHaveLength(1));
    const hub = useUnsavedHubsStore.getState().hubs[0];
    expect(hub.processGoal).toBe('We mold barrels for medical customers.');
  });

  it('creates an in-memory hub on skip (Word-style: bare Untitled hub lands in unsaved store)', async () => {
    render(<HubCreationFlow {...baseProps} />);
    fireEvent.click(screen.getByText('Skip'));
    await waitFor(() => expect(useUnsavedHubsStore.getState().hubs).toHaveLength(1));
    const hub = useUnsavedHubsStore.getState().hubs[0];
    expect(hub.processGoal).toBeUndefined();
    expect(hub.name).toBe('Untitled hub');
  });

  it('fires onHubCreated callback after Stage 1', async () => {
    const onHubCreated = vi.fn();
    render(<HubCreationFlow {...baseProps} onHubCreated={onHubCreated} />);
    fireEvent.click(screen.getByText('Confirm goal'));
    await waitFor(() => expect(onHubCreated).toHaveBeenCalledOnce());
    const hub = onHubCreated.mock.calls[0][0];
    expect(hub.processGoal).toBe('We mold barrels for medical customers.');
  });

  it('calls onConfirm when ColumnMapping confirms', async () => {
    const onConfirm = vi.fn();
    render(<HubCreationFlow {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Confirm goal'));
    await waitFor(() => expect(screen.getByTestId('column-mapping')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Confirm mapping'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
