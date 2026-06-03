import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCardList } from '../MobileCardList';
import type { Hypothesis, Finding, DisconfirmationAttempt } from '@variscout/core';

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

/** Build a minimal Finding for test fixtures. */
const makeFinding = (overrides: Partial<Finding>): Finding =>
  ({
    id: 'f-default',
    text: 'A finding',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    investigationId: 'inv-test',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
    validationStatus: 'supports',
    refutes: false,
    ...overrides,
  }) as unknown as Finding;

/**
 * Findings that satisfy the ≥2 distinct evidence types prerequisite for
 * `needs-disconfirmation` / `evidence-survived-test` status derivation.
 */
const dataFinding = makeFinding({ id: 'f-data', evidenceType: 'data' });
const gembaFinding = makeFinding({ id: 'f-gemba', evidenceType: 'gemba' });

/** Hub fully wired to derive `evidence-survived-test` (≥2 types + survived attempt). */
const confirmedAttempt: DisconfirmationAttempt = {
  id: 'da-survived',
  attemptedAt: '2026-05-30T00:00:00Z',
  attemptedBy: { displayName: 'Analyst', upn: 'analyst@example.com' },
  description: 'Ran a coolant check — vibration persisted',
  verdict: 'survived',
  linkedFindingIds: [],
};

const hubConfirmed: Hypothesis = makeHub({
  id: 'hA',
  name: 'Nozzle runs hot',
  findingIds: ['f-data', 'f-gemba'],
  status: 'evidence-survived-test', // stored; derived independently by MobileCardList
  disconfirmationAttempts: [confirmedAttempt],
});

const hubB: Hypothesis = makeHub({
  id: 'hB',
  name: 'Operator variance',
  findingIds: [],
  status: 'proposed',
});

describe('MobileCardList', () => {
  it('renders one card per hub with a data-testid per hub id', () => {
    render(<MobileCardList hubs={[hubConfirmed, hubB]} findings={[dataFinding, gembaFinding]} />);
    expect(screen.getByTestId('wall-mobile-hub-hA')).toBeInTheDocument();
    expect(screen.getByTestId('wall-mobile-hub-hB')).toBeInTheDocument();
  });

  it('derives evidence-survived-test status via deriveHypothesisStatus (not hub.status)', () => {
    // hubConfirmed has ≥2 distinct evidence types + survived attempt → evidence-survived-test
    render(<MobileCardList hubs={[hubConfirmed]} findings={[dataFinding, gembaFinding]} />);
    const card = screen.getByTestId('wall-mobile-hub-hA');
    expect(card).toHaveAttribute('data-status', 'evidence-survived-test'); // status code (CS-10)
    expect(card.textContent).toMatch(/Supported/); // user-facing label relabeled
  });

  it('derives needs-disconfirmation (≥2 evidence types, no survived attempt)', () => {
    // Same findings but no disconfirmationAttempts → needs-disconfirmation
    const hub = makeHub({
      id: 'h-needs-disconfirmation',
      findingIds: ['f-data', 'f-gemba'],
      status: 'needs-disconfirmation',
    });
    render(<MobileCardList hubs={[hub]} findings={[dataFinding, gembaFinding]} />);
    const card = screen.getByTestId('wall-mobile-hub-h-needs-disconfirmation');
    expect(card).toHaveAttribute('data-status', 'needs-disconfirmation');
    expect(card.textContent).toMatch(/Needs disconfirmation/);
  });

  it('derives evidenced status (1 evidence type, single linked finding)', () => {
    // One finding linked → evidenced (findingIds > 0, distinctTypes < 2)
    const hub = makeHub({ id: 'h-ev', findingIds: ['f-data'], status: 'evidenced' });
    render(<MobileCardList hubs={[hub]} findings={[dataFinding]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-ev')).toHaveAttribute('data-status', 'evidenced');
  });

  it('derives proposed when no findings are linked', () => {
    const hub = makeHub({ id: 'h-proposed', findingIds: [] });
    render(<MobileCardList hubs={[hub]} findings={[]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-proposed')).toHaveAttribute(
      'data-status',
      'proposed'
    );
  });

  it('derives refuted when any linked finding has refutes:true', () => {
    const refutingFinding = makeFinding({ id: 'f-refute', refutes: true });
    const hub = makeHub({ id: 'h-refuted', findingIds: ['f-refute'] });
    render(<MobileCardList hubs={[hub]} findings={[refutingFinding]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-refuted')).toHaveAttribute(
      'data-status',
      'refuted'
    );
  });

  /**
   * Mobile-breakpoint status-derivation test (MAJOR 1 adversarial review):
   * MobileCardList must derive the same status as WallCanvas (both call
   * `deriveHypothesisStatus`). A hub that moves from `needs-disconfirmation`
   * to `evidence-survived-test` after a survived attempt must show
   * `evidence-survived-test` at mobile widths without requiring a store reload.
   */
  it('mobile: survived disconfirmation advances data-status to evidence-survived-test without reload', () => {
    // Pre-attempt: hub has ≥2 evidence types but no survived attempt → needs-disconfirmation
    const hub = makeHub({
      id: 'h-mobile-gate',
      findingIds: ['f-data', 'f-gemba'],
    });
    const { rerender } = render(
      <MobileCardList hubs={[hub]} findings={[dataFinding, gembaFinding]} />
    );
    expect(screen.getByTestId('wall-mobile-hub-h-mobile-gate')).toHaveAttribute(
      'data-status',
      'needs-disconfirmation'
    );

    // After attempt: hub now has a survived disconfirmation → evidence-survived-test
    const hubAfter: Hypothesis = {
      ...hub,
      disconfirmationAttempts: [confirmedAttempt],
    };
    rerender(<MobileCardList hubs={[hubAfter]} findings={[dataFinding, gembaFinding]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-mobile-gate')).toHaveAttribute(
      'data-status',
      'evidence-survived-test'
    );
  });

  it('renders findings count via i18n', () => {
    // hubConfirmed has findingIds: ['f-data', 'f-gemba'] = 2 findings
    render(<MobileCardList hubs={[hubConfirmed]} findings={[dataFinding, gembaFinding]} />);
    expect(screen.getByTestId('wall-mobile-hub-hA-findings')).toHaveTextContent('2 findings');
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
    render(
      <MobileCardList
        hubs={[hubConfirmed]}
        findings={[dataFinding, gembaFinding]}
        onSelectHub={onSelectHub}
      />
    );
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
