import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCardList } from '../MobileCardList';
import type { Hypothesis, Finding } from '@variscout/core';

const makeHub = (overrides: Partial<Hypothesis> = {}): Hypothesis => ({
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: '',
  findingIds: [],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-test',
  ...overrides,
});

const hubA: Hypothesis = makeHub({
  id: 'hA',
  name: 'Nozzle runs hot',
  findingIds: ['f1', 'f2', 'f3'],
  status: 'confirmed',
});

const hubB: Hypothesis = makeHub({
  id: 'hB',
  name: 'Operator variance',
  findingIds: [],
  status: 'proposed',
});

describe('MobileCardList', () => {
  it('renders one card per hub with a data-testid per hub id', () => {
    render(<MobileCardList hubs={[hubA, hubB]} findings={[]} />);
    expect(screen.getByTestId('wall-mobile-hub-hA')).toBeInTheDocument();
    expect(screen.getByTestId('wall-mobile-hub-hB')).toBeInTheDocument();
  });

  it('shows status label derived from hub.status (Confirmed)', () => {
    render(<MobileCardList hubs={[hubA]} findings={[]} />);
    const card = screen.getByTestId('wall-mobile-hub-hA');
    expect(card).toHaveAttribute('data-status', 'confirmed');
    expect(card.textContent).toMatch(/Confirmed/);
  });

  it('preserves canonical needs-disconfirmation status from hub.status', () => {
    const hub = makeHub({
      id: 'h-needs-disconfirmation',
      status: 'needs-disconfirmation',
    });

    render(<MobileCardList hubs={[hub]} findings={[]} />);

    const card = screen.getByTestId('wall-mobile-hub-h-needs-disconfirmation');
    expect(card).toHaveAttribute('data-status', 'needs-disconfirmation');
    expect(card.textContent).toMatch(/Needs disconfirmation/);
  });

  it('preserves canonical evidenced status from hub.status', () => {
    const findings: Finding[] = [
      {
        id: 'f1',
        text: 'SHIFT finding',
        createdAt: 1,
        deletedAt: null,
        investigationId: 'inv-test',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'observed',
        comments: [],
        statusChangedAt: 1,
        validationStatus: 'supports',
      } as unknown as Finding,
    ];
    const hub = makeHub({ id: 'h-ev', findingIds: ['f1'], status: 'evidenced' });
    render(<MobileCardList hubs={[hub]} findings={findings} />);
    expect(screen.getByTestId('wall-mobile-hub-h-ev')).toHaveAttribute('data-status', 'evidenced');
  });

  it('renders findings count via i18n', () => {
    render(<MobileCardList hubs={[hubA]} findings={[]} />);
    expect(screen.getByTestId('wall-mobile-hub-hA-findings')).toHaveTextContent('3 findings');
  });

  it('renders structured branch sections with clues, readiness, and next move', () => {
    const branchHub = makeHub({
      id: 'h-branch',
      findingIds: ['f1', 'f2'],
      nextMove: 'Run a late-shift temperature check.',
    });
    const findings: Finding[] = [
      {
        id: 'f1',
        text: 'Night shift has wider spread',
        createdAt: 1,
        deletedAt: null,
        investigationId: 'inv-test',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'analyzed',
        comments: [],
        statusChangedAt: 1,
        validationStatus: 'supports',
      },
      {
        id: 'f2',
        text: 'Day shift has one similar event',
        createdAt: 2,
        deletedAt: null,
        investigationId: 'inv-test',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'analyzed',
        comments: [],
        statusChangedAt: 2,
        validationStatus: 'contradicts',
      },
    ];

    render(<MobileCardList hubs={[branchHub]} findings={findings} />);

    expect(screen.getByText(/Mechanism Branch/i)).toBeInTheDocument();
    expect(screen.getByText(/1 supporting clue/i)).toBeInTheDocument();
    expect(screen.getByText(/1 counter-clue/i)).toBeInTheDocument();
    expect(screen.getByText(/Next: Run a late-shift temperature check/i)).toBeInTheDocument();
  });

  it('fires onSelectHub when a card is clicked', () => {
    const onSelectHub = vi.fn();
    render(<MobileCardList hubs={[hubA]} findings={[]} onSelectHub={onSelectHub} />);
    fireEvent.click(screen.getByTestId('wall-mobile-hub-hA'));
    expect(onSelectHub).toHaveBeenCalledWith('hA');
  });

  it('shows the EmptyState when hubs is empty', () => {
    render(<MobileCardList hubs={[]} findings={[]} />);
    expect(screen.queryByTestId('wall-mobile-card-list')).toBeNull();
    // EmptyState heading comes from the shared component
    expect(screen.getByText(/Start a Mechanism Branch/i)).toBeInTheDocument();
  });
});
