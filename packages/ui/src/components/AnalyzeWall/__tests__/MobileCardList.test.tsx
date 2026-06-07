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

  it('renders the stored analyst-set status, not the derivation (CS-10 de-automation)', () => {
    // Stored 'evidenced', but the linked findings (2 evidence types + a survived
    // attempt) would DERIVE 'evidence-survived-test'. The card must show STORED.
    const hub = makeHub({
      id: 'h-stored',
      findingIds: ['f-data', 'f-gemba'],
      status: 'evidenced',
      disconfirmationAttempts: [confirmedAttempt],
    });
    render(<MobileCardList hubs={[hub]} findings={[dataFinding, gembaFinding]} />);
    const card = screen.getByTestId('wall-mobile-hub-h-stored');
    // Displayed status = stored value (analyst-owned); the derivation is advisory only.
    expect(card).toHaveAttribute('data-status', 'evidenced');
    expect(card.textContent).toMatch(/Suspected/);
    expect(card.textContent).not.toMatch(/Evidenced/);
  });

  it('renders the stored needs-disconfirmation status', () => {
    const hub = makeHub({
      id: 'h-needs-disconfirmation',
      findingIds: ['f-data', 'f-gemba'],
      status: 'needs-disconfirmation',
    });
    render(<MobileCardList hubs={[hub]} findings={[dataFinding, gembaFinding]} />);
    const card = screen.getByTestId('wall-mobile-hub-h-needs-disconfirmation');
    expect(card).toHaveAttribute('data-status', 'needs-disconfirmation');
    expect(card.textContent).toMatch(/Suspected/);
    expect(card.textContent).not.toMatch(/Needs disconfirmation/);
  });

  it('renders the stored evidenced status', () => {
    const hub = makeHub({ id: 'h-ev', findingIds: ['f-data'], status: 'evidenced' });
    render(<MobileCardList hubs={[hub]} findings={[dataFinding]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-ev')).toHaveAttribute('data-status', 'evidenced');
  });

  it('renders the stored proposed status', () => {
    const hub = makeHub({ id: 'h-proposed', findingIds: [], status: 'proposed' });
    render(<MobileCardList hubs={[hub]} findings={[]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-proposed')).toHaveAttribute(
      'data-status',
      'proposed'
    );
  });

  it('renders the stored refuted status (even if the derivation would also say refuted)', () => {
    const refutingFinding = makeFinding({ id: 'f-refute', refutes: true });
    const hub = makeHub({ id: 'h-refuted', findingIds: ['f-refute'], status: 'refuted' });
    render(<MobileCardList hubs={[hub]} findings={[refutingFinding]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-refuted')).toHaveAttribute(
      'data-status',
      'refuted'
    );
  });

  /**
   * CS-10 de-automation: status is analyst-owned. Recording a survived
   * disconfirmation (which the derivation would read as `evidence-survived-test`)
   * must NOT auto-advance the displayed status — the card keeps showing whatever
   * the analyst stored until they explicitly change it.
   */
  it('recording a survived disconfirmation does NOT auto-advance the status (analyst-owned)', () => {
    // Stored 'evidenced'; ≥2 evidence types but no survived attempt yet.
    const hub = makeHub({
      id: 'h-na',
      findingIds: ['f-data', 'f-gemba'],
      status: 'evidenced',
    });
    const { rerender } = render(
      <MobileCardList hubs={[hub]} findings={[dataFinding, gembaFinding]} />
    );
    expect(screen.getByTestId('wall-mobile-hub-h-na')).toHaveAttribute('data-status', 'evidenced');

    // After a survived disconfirmation is recorded, the STORED status is unchanged
    // (the analyst has not promoted it) — the derivation never auto-applies.
    const hubAfter: Hypothesis = {
      ...hub,
      disconfirmationAttempts: [confirmedAttempt],
    };
    rerender(<MobileCardList hubs={[hubAfter]} findings={[dataFinding, gembaFinding]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-na')).toHaveAttribute('data-status', 'evidenced');
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
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'analyzed',
        comments: [],
        statusChangedAt: 2,
        validationStatus: 'contradicts',
      },
    ];

    render(<MobileCardList hubs={[branchHub]} findings={findings} />);

    expect(screen.getByText(/Suspected cause/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mechanism Branch/i)).not.toBeInTheDocument();
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
    expect(screen.getByText(/Start a suspected cause/i)).toBeInTheDocument();
  });

  it('shows findings-forward Wall arrival when findings exist but hubs is empty', () => {
    const finding = makeFinding({
      id: 'f-orphan',
      text: 'Step=2 wider',
      context: { activeFilters: { Step: [2] }, cumulativeScope: null },
    });
    render(
      <MobileCardList
        hubs={[]}
        findings={[finding]}
        onWriteHypothesis={vi.fn()}
        onSeedFromFactorIntel={vi.fn()}
        onProposeHypothesis={vi.fn()}
      />
    );

    expect(screen.queryByTestId('wall-mobile-card-list')).toBeNull();
    expect(screen.getByText(/You've observed:/i)).toBeInTheDocument();
    expect(screen.getByText(/Step=2 wider/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What might cause this\?/i })).toBeInTheDocument();
  });
});
