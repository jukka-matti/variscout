import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HubCard } from '../HubCard';
import type { SuspectedCause, SuspectedCauseEvidence } from '@variscout/core/findings';
import type { HubProjection } from '@variscout/core/findings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHub(overrides: Partial<SuspectedCause> = {}): SuspectedCause {
  return {
    id: 'hub-1',
    name: 'Nozzle wear on night shift',
    synthesis: 'Night shift thermal stress causes wear',
    questionIds: ['q1', 'q2'],
    findingIds: ['f1'],
    status: 'suspected',
    createdAt: '2026-04-04T00:00:00Z',
    updatedAt: '2026-04-04T00:00:00Z',
    ...overrides,
  };
}

const defaultProps = () => ({
  hub: makeHub(),
  questionsCount: 2,
  findingsCount: 1,
  onEdit: vi.fn(),
  onToggleSelect: vi.fn(),
  onBrainstorm: vi.fn(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HubCard', () => {
  it('renders hub name and status badge', () => {
    render(<HubCard {...defaultProps()} />);

    expect(screen.getByText('Nozzle wear on night shift')).toBeInTheDocument();
  });

  it('shows evidence badge when evidence provided', () => {
    const evidence: SuspectedCauseEvidence = {
      mode: 'standard',
      contribution: {
        value: 0.52,
        label: 'R\u00b2adj',
        description: 'Explains 52% of variation',
      },
    };

    render(<HubCard {...defaultProps()} evidence={evidence} />);

    expect(screen.getByText('R\u00b2adj 52%')).toBeInTheDocument();
  });

  it('shows projection with hedged language when hubProjection provided', () => {
    const projection: HubProjection = {
      predictedMeanDelta: -1.3,
      predictedMean: 11.8,
      currentMean: 13.1,
      rSquaredAdj: 0.38,
      levelChanges: [],
      label: 'Model suggests',
    };

    render(<HubCard {...defaultProps()} projection={projection} />);

    expect(screen.getByText(/Model suggests/)).toBeInTheDocument();
    expect(screen.getByText(/-1\.3/)).toBeInTheDocument();
  });

  it('shows summary: "N questions . M findings"', () => {
    render(<HubCard {...defaultProps()} />);

    expect(screen.getByText(/2 questions/)).toBeInTheDocument();
    expect(screen.getByText(/1 finding/)).toBeInTheDocument();
  });

  it('shows branch next move when present', () => {
    render(<HubCard {...defaultProps()} hub={makeHub({ nextMove: 'Run a late-shift check.' })} />);

    expect(screen.getByText(/Next: Run a late-shift check/i)).toBeInTheDocument();
  });

  it('"Edit" button calls onEdit', () => {
    const props = defaultProps();
    render(<HubCard {...props} />);

    fireEvent.click(screen.getByTestId('hub-edit-hub-1'));
    expect(props.onEdit).toHaveBeenCalled();
  });

  it('"Select" toggle calls onToggleSelect', () => {
    const props = defaultProps();
    render(<HubCard {...props} />);

    fireEvent.click(screen.getByTestId('hub-select-hub-1'));
    expect(props.onToggleSelect).toHaveBeenCalled();
  });

  it('"Brainstorm" button calls onBrainstorm', () => {
    const props = defaultProps();
    render(<HubCard {...props} />);

    fireEvent.click(screen.getByTestId('hub-brainstorm-hub-1'));
    expect(props.onBrainstorm).toHaveBeenCalled();
  });

  it('clicking card body expands synthesis text', () => {
    render(<HubCard {...defaultProps()} />);

    // Synthesis should not be visible initially
    expect(screen.queryByText('Night shift thermal stress causes wear')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('Nozzle wear on night shift'));
    expect(screen.getByText('Night shift thermal stress causes wear')).toBeInTheDocument();
  });
});
