import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionChecklist } from '../QuestionChecklist';
import type { Hypothesis } from '@variscout/core';

const makeQuestion = (overrides: Partial<Hypothesis> = {}): Hypothesis => ({
  id: 'q1',
  text: 'Is Shift a significant factor?',
  status: 'untested' as const,
  linkedFindingIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questionSource: 'factor-intel',
  ...overrides,
});

describe('QuestionChecklist', () => {
  it('renders with empty questions array', () => {
    render(<QuestionChecklist questions={[]} />);
    expect(screen.getByText('No investigation questions yet.')).toBeDefined();
  });

  it('renders questions sorted by R2adj', () => {
    const questions: Hypothesis[] = [
      makeQuestion({ id: 'q1', text: 'Low evidence', evidence: { rSquaredAdj: 0.1 } }),
      makeQuestion({ id: 'q2', text: 'High evidence', evidence: { rSquaredAdj: 0.8 } }),
      makeQuestion({ id: 'q3', text: 'Mid evidence', evidence: { rSquaredAdj: 0.4 } }),
    ];
    render(<QuestionChecklist questions={questions} />);

    const buttons = screen.getAllByRole('button');
    // Questions should be ordered: High (80%), Mid (40%), Low (10%)
    expect(buttons[0].textContent).toContain('High evidence');
    expect(buttons[1].textContent).toContain('Mid evidence');
    expect(buttons[2].textContent).toContain('Low evidence');
  });

  it('shows auto-answered badge for factor-intel ruled-out questions', () => {
    const questions: Hypothesis[] = [
      makeQuestion({
        id: 'q1',
        text: 'Operator is not significant',
        status: 'contradicted',
        questionSource: 'factor-intel',
        evidence: { rSquaredAdj: 0.02 },
      }),
    ];
    render(<QuestionChecklist questions={questions} />);
    // Contradicted questions are in the "Answered" section, collapsed by default
    fireEvent.click(screen.getByTestId('answered-toggle'));
    expect(screen.getByText('(auto)')).toBeDefined();
  });

  it('shows issue statement textarea when onIssueStatementChange provided', () => {
    const noop = () => {};
    render(
      <QuestionChecklist
        questions={[]}
        issueStatement="Fill weight too high"
        onIssueStatementChange={noop}
      />
    );
    expect(screen.getByTestId('issue-statement')).toBeDefined();
    expect(screen.getByDisplayValue('Fill weight too high')).toBeDefined();
  });

  it('does not show issue statement textarea when onIssueStatementChange not provided', () => {
    render(<QuestionChecklist questions={[]} issueStatement="Fill weight too high" />);
    expect(screen.queryByTestId('issue-statement')).toBeNull();
  });

  it('renders problem statement when provided', () => {
    render(
      <QuestionChecklist
        questions={[]}
        problemStatement="Mean fill weight increased 3g since January across all lines"
        isProblemStatementComplete
      />
    );
    expect(screen.getByTestId('problem-statement')).toBeDefined();
    expect(screen.getByText(/Mean fill weight increased/)).toBeDefined();
  });
});
