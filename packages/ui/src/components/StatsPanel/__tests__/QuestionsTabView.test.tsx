import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionsTabView from '../QuestionsTabView';
import type { Hypothesis, Finding } from '@variscout/core/findings';
import type { SuspectedCause } from '../ConclusionCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h1',
    text: 'Does Operator affect the result?',
    factor: 'Operator',
    status: 'untested',
    linkedFindingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f1',
    text: 'Night shift shows higher spread',
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests: issue statement
// ---------------------------------------------------------------------------

describe('QuestionsTabView — issue statement', () => {
  it('renders issue statement when provided', () => {
    render(
      <QuestionsTabView
        questions={[]}
        findings={[]}
        issueStatement="Cpk below 1.33 on Line 3 since Feb"
      />
    );
    expect(screen.getByTestId('issue-statement')).toBeDefined();
    expect(screen.getByText('Cpk below 1.33 on Line 3 since Feb')).toBeDefined();
  });

  it('does not render issue statement when absent', () => {
    render(<QuestionsTabView questions={[]} findings={[]} />);
    expect(screen.queryByTestId('issue-statement')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: progress bar
// ---------------------------------------------------------------------------

describe('QuestionsTabView — progress bar', () => {
  it('renders progress bar with question count when questions exist', () => {
    const q1 = makeHypothesis({ id: 'h1', status: 'supported' }); // answered
    const q2 = makeHypothesis({ id: 'h2', status: 'partial' }); // investigating
    const q3 = makeHypothesis({ id: 'h3', status: 'untested' }); // open
    render(<QuestionsTabView questions={[q1, q2, q3]} findings={[]} />);
    expect(screen.getByTestId('progress-bar')).toBeDefined();
    // explored = answered(1) + investigating(1) + ruled-out(0) = 2
    expect(screen.getByTestId('progress-explored').textContent).toBe('2/3 explored');
  });

  it('shows finding count in progress bar', () => {
    const q = makeHypothesis();
    const f = makeFinding({ id: 'f1' });
    render(<QuestionsTabView questions={[q]} findings={[f]} />);
    expect(screen.getByTestId('progress-findings').textContent).toBe('1 finding');
  });

  it('pluralises findings label when more than one', () => {
    const q = makeHypothesis();
    const findings = [makeFinding({ id: 'f1' }), makeFinding({ id: 'f2' })];
    render(<QuestionsTabView questions={[q]} findings={findings} />);
    expect(screen.getByTestId('progress-findings').textContent).toBe('2 findings');
  });

  it('hides progress bar when no questions', () => {
    render(<QuestionsTabView questions={[]} findings={[]} />);
    expect(screen.queryByTestId('progress-bar')).toBeNull();
  });

  it('counts ruled-out questions in explored total', () => {
    const q1 = makeHypothesis({ id: 'h1', status: 'contradicted' }); // ruled-out
    const q2 = makeHypothesis({ id: 'h2', status: 'untested' }); // open
    render(<QuestionsTabView questions={[q1, q2]} findings={[]} />);
    expect(screen.getByTestId('progress-explored').textContent).toBe('1/2 explored');
  });
});

// ---------------------------------------------------------------------------
// Tests: question grouping
// ---------------------------------------------------------------------------

describe('QuestionsTabView — question grouping', () => {
  it('groups questions by display status into separate groups', () => {
    const answered = makeHypothesis({ id: 'h1', status: 'supported', factor: 'Operator' });
    const investigating = makeHypothesis({ id: 'h2', status: 'partial', factor: 'Machine' });
    const open = makeHypothesis({ id: 'h3', status: 'untested', factor: 'Material' });

    render(<QuestionsTabView questions={[answered, investigating, open]} findings={[]} />);

    expect(screen.getByTestId('question-group-answered')).toBeDefined();
    expect(screen.getByTestId('question-group-investigating')).toBeDefined();
    expect(screen.getByTestId('question-group-open')).toBeDefined();
  });

  it('does not render a group container for empty groups', () => {
    const open = makeHypothesis({ id: 'h1', status: 'untested' });
    render(<QuestionsTabView questions={[open]} findings={[]} />);
    // answered group should not be rendered
    expect(screen.queryByTestId('question-group-answered')).toBeNull();
  });

  it('renders ruled-out group with toggle collapsed by default', () => {
    const ruledOut = makeHypothesis({ id: 'h1', status: 'contradicted', factor: 'Speed' });
    render(<QuestionsTabView questions={[ruledOut]} findings={[]} />);
    expect(screen.getByTestId('question-group-ruled-out')).toBeDefined();
    // Toggle button present
    const toggle = screen.getByTestId('ruled-out-toggle');
    expect(toggle).toBeDefined();
    // The question row is hidden (collapsed)
    expect(screen.queryByTestId('question-row-h1')).toBeNull();
  });

  it('expands ruled-out group when toggle is clicked', () => {
    const ruledOut = makeHypothesis({ id: 'h1', status: 'contradicted', factor: 'Speed' });
    render(<QuestionsTabView questions={[ruledOut]} findings={[]} />);
    fireEvent.click(screen.getByTestId('ruled-out-toggle'));
    expect(screen.getByTestId('question-row-h1')).toBeDefined();
  });

  it('renders QuestionRow for each non-ruled-out question', () => {
    const q1 = makeHypothesis({ id: 'h1', status: 'untested' });
    const q2 = makeHypothesis({ id: 'h2', status: 'partial' });
    render(<QuestionsTabView questions={[q1, q2]} findings={[]} />);
    expect(screen.getByTestId('question-row-h1')).toBeDefined();
    expect(screen.getByTestId('question-row-h2')).toBeDefined();
  });

  it('highlights active question with isActive prop', () => {
    const q = makeHypothesis({ id: 'h1', status: 'untested' });
    render(<QuestionsTabView questions={[q]} findings={[]} activeQuestionId="h1" />);
    const row = screen.getByTestId('question-row-h1');
    expect(row.className).toContain('bg-surface-tertiary');
  });
});

// ---------------------------------------------------------------------------
// Tests: empty state
// ---------------------------------------------------------------------------

describe('QuestionsTabView — empty state', () => {
  it('shows empty state message when no questions', () => {
    render(<QuestionsTabView questions={[]} findings={[]} />);
    expect(screen.getByTestId('questions-empty-state')).toBeDefined();
    expect(screen.getByText('Select factors to generate questions')).toBeDefined();
  });

  it('does not show empty state when questions exist', () => {
    const q = makeHypothesis();
    render(<QuestionsTabView questions={[q]} findings={[]} />);
    expect(screen.queryByTestId('questions-empty-state')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: observations section
// ---------------------------------------------------------------------------

describe('QuestionsTabView — observations section', () => {
  it('renders observations section for unlinked findings', () => {
    // Finding f1 is unlinked (no question references it)
    const f = makeFinding({ id: 'f1', text: 'Night shift spread' });
    const q = makeHypothesis({ id: 'h1', linkedFindingIds: [] });
    render(<QuestionsTabView questions={[q]} findings={[f]} />);
    expect(screen.getByTestId('observations-section')).toBeDefined();
    expect(screen.getByTestId('observation-f1')).toBeDefined();
  });

  it('does not include linked findings in observations', () => {
    const f = makeFinding({ id: 'f1' });
    // Question links to f1, so f1 should NOT appear in observations
    const q = makeHypothesis({ id: 'h1', linkedFindingIds: ['f1'] });
    render(<QuestionsTabView questions={[q]} findings={[f]} />);
    expect(screen.queryByTestId('observation-f1')).toBeNull();
  });

  it('hides observations section when all findings are linked and no add callback', () => {
    const f = makeFinding({ id: 'f1' });
    const q = makeHypothesis({ id: 'h1', linkedFindingIds: ['f1'] });
    render(<QuestionsTabView questions={[q]} findings={[f]} />);
    expect(screen.queryByTestId('observations-section')).toBeNull();
  });

  it('shows add observation button when onAddObservation is provided', () => {
    const onAddObservation = vi.fn();
    render(<QuestionsTabView questions={[]} findings={[]} onAddObservation={onAddObservation} />);
    expect(screen.getByTestId('add-observation-button')).toBeDefined();
  });

  it('opens observation modal when add button is clicked', () => {
    const onAddObservation = vi.fn();
    render(<QuestionsTabView questions={[]} findings={[]} onAddObservation={onAddObservation} />);
    fireEvent.click(screen.getByTestId('add-observation-button'));
    // Modal opens — callback is invoked after modal submission, not on button click
    expect(onAddObservation).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: conclusion card
// ---------------------------------------------------------------------------

describe('QuestionsTabView — conclusion card', () => {
  it('renders conclusion card when suspected causes exist', () => {
    const causes: SuspectedCause[] = [{ factor: 'Operator', projectedCpk: 1.5 }];
    render(
      <QuestionsTabView questions={[]} findings={[]} suspectedCauses={causes} currentCpk={1.1} />
    );
    expect(screen.getByTestId('conclusion-card')).toBeDefined();
    expect(screen.getByTestId('cause-chip-Operator')).toBeDefined();
  });

  it('does not render conclusion card when no suspected causes', () => {
    render(<QuestionsTabView questions={[]} findings={[]} suspectedCauses={[]} />);
    expect(screen.queryByTestId('conclusion-card')).toBeNull();
  });

  it('shows combined projection footer when combinedProjectedCpk is provided', () => {
    const causes: SuspectedCause[] = [{ factor: 'Material' }];
    render(
      <QuestionsTabView
        questions={[]}
        findings={[]}
        suspectedCauses={causes}
        currentCpk={1.0}
        combinedProjectedCpk={1.45}
        targetCpk={1.33}
      />
    );
    expect(screen.getByTestId('conclusion-combined')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: vitals bar
// ---------------------------------------------------------------------------

describe('QuestionsTabView — vitals bar', () => {
  it('renders Cpk and target in vitals bar', () => {
    render(<QuestionsTabView questions={[]} findings={[]} currentCpk={1.25} targetCpk={1.33} />);
    expect(screen.getByTestId('vitals-cpk').textContent).toBe('1.25');
    expect(screen.getByTestId('vitals-target').textContent).toBe('1.33');
  });

  it('renders phase badge in vitals bar', () => {
    render(<QuestionsTabView questions={[]} findings={[]} phaseBadge="INVESTIGATE" />);
    expect(screen.getByTestId('vitals-phase-badge').textContent).toBe('INVESTIGATE');
  });
});
