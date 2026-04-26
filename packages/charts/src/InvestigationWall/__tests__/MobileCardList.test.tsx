import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCardList } from '../MobileCardList';
import type { SuspectedCause, Finding, Question } from '@variscout/core';

const makeHub = (overrides: Partial<SuspectedCause> = {}): SuspectedCause => ({
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: '',
  questionIds: [],
  findingIds: [],
  status: 'suspected',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const hubA: SuspectedCause = makeHub({
  id: 'hA',
  name: 'Nozzle runs hot',
  findingIds: ['f1', 'f2', 'f3'],
  questionIds: ['q1'],
  status: 'confirmed',
});

const hubB: SuspectedCause = makeHub({
  id: 'hB',
  name: 'Operator variance',
  findingIds: [],
  questionIds: [],
  status: 'suspected',
});

describe('MobileCardList', () => {
  it('renders one card per hub with a data-testid per hub id', () => {
    render(<MobileCardList hubs={[hubA, hubB]} findings={[]} questions={[]} />);
    expect(screen.getByTestId('wall-mobile-hub-hA')).toBeInTheDocument();
    expect(screen.getByTestId('wall-mobile-hub-hB')).toBeInTheDocument();
  });

  it('shows status label derived from hub.status (Confirmed)', () => {
    render(<MobileCardList hubs={[hubA]} findings={[]} questions={[]} />);
    const card = screen.getByTestId('wall-mobile-hub-hA');
    expect(card).toHaveAttribute('data-status', 'confirmed');
    expect(card.textContent).toMatch(/Confirmed/);
  });

  it('derives "evidenced" when supporting findings are present without contradictors', () => {
    const findings: Finding[] = [
      {
        id: 'f1',
        source: { kind: 'boxplot', column: 'SHIFT' },
        summary: 's',
        createdAt: '',
        validationStatus: 'supports',
      } as unknown as Finding,
    ];
    const hub = makeHub({ id: 'h-ev', findingIds: ['f1'], status: 'suspected' });
    render(<MobileCardList hubs={[hub]} findings={findings} questions={[]} />);
    expect(screen.getByTestId('wall-mobile-hub-h-ev')).toHaveAttribute('data-status', 'evidenced');
  });

  it('renders findings count via i18n', () => {
    render(<MobileCardList hubs={[hubA]} findings={[]} questions={[]} />);
    expect(screen.getByTestId('wall-mobile-hub-hA-findings')).toHaveTextContent('3 findings');
  });

  it('renders structured branch sections with clues, checks, readiness, and next move', () => {
    const branchHub = makeHub({
      id: 'h-branch',
      findingIds: ['f1', 'f2'],
      questionIds: ['q1'],
      nextMove: 'Run a late-shift temperature check.',
    });
    const findings: Finding[] = [
      {
        id: 'f1',
        text: 'Night shift has wider spread',
        createdAt: 1,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'analyzed',
        comments: [],
        statusChangedAt: 1,
        validationStatus: 'supports',
      },
      {
        id: 'f2',
        text: 'Day shift has one similar event',
        createdAt: 2,
        context: { activeFilters: {}, cumulativeScope: null },
        status: 'analyzed',
        comments: [],
        statusChangedAt: 2,
        validationStatus: 'contradicts',
      },
    ];
    const questions: Question[] = [
      {
        id: 'q1',
        text: 'Check nozzle temperature after four hours',
        status: 'open',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
    ];

    render(<MobileCardList hubs={[branchHub]} findings={findings} questions={questions} />);

    expect(screen.getByText(/Mechanism Branch/i)).toBeInTheDocument();
    expect(screen.getByText(/1 supporting clue/i)).toBeInTheDocument();
    expect(screen.getByText(/1 counter-clue/i)).toBeInTheDocument();
    expect(screen.getByText(/1 open check/i)).toBeInTheDocument();
    expect(screen.getByText(/Needs check/i)).toBeInTheDocument();
    expect(screen.getByText(/Next: Run a late-shift temperature check/i)).toBeInTheDocument();
  });

  it('renders linked question count from hub.questionIds.length', () => {
    render(<MobileCardList hubs={[hubA]} findings={[]} questions={[] as Question[]} />);
    // hubA has one linked question
    expect(screen.getByTestId('wall-mobile-hub-hA-questions')).toHaveTextContent('1 questions');
    // hubB has zero
    render(<MobileCardList hubs={[hubB]} findings={[]} questions={[] as Question[]} />);
    expect(screen.getByTestId('wall-mobile-hub-hB-questions')).toHaveTextContent('0 questions');
  });

  it('fires onSelectHub when a card is clicked', () => {
    const onSelectHub = vi.fn();
    render(<MobileCardList hubs={[hubA]} findings={[]} questions={[]} onSelectHub={onSelectHub} />);
    fireEvent.click(screen.getByTestId('wall-mobile-hub-hA'));
    expect(onSelectHub).toHaveBeenCalledWith('hA');
  });

  it('shows the EmptyState when hubs is empty', () => {
    render(<MobileCardList hubs={[]} findings={[]} questions={[]} />);
    expect(screen.queryByTestId('wall-mobile-card-list')).toBeNull();
    // EmptyState heading comes from the shared component
    expect(screen.getByText(/Start a Mechanism Branch/i)).toBeInTheDocument();
  });
});
