import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportQuestionSummary } from '../ReportQuestionSummary';
import type { Question } from '@variscout/core';

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'h1',
  text: 'Temperature causes defects',
  status: 'answered' as const,
  linkedFindingIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('ReportQuestionSummary', () => {
  it('renders question tree with parent/child', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'root', text: 'Root cause: temperature' }),
      makeQuestion({
        id: 'child',
        text: 'Sub: ambient temp',
        parentId: 'root',
        status: 'investigating',
      }),
    ];
    render(<ReportQuestionSummary questions={questions} />);
    expect(screen.getByTestId('report-question-summary')).toBeDefined();
    expect(screen.getByText('Root cause: temperature')).toBeDefined();
    expect(screen.getByText('Sub: ambient temp')).toBeDefined();
  });

  it('renders status badges', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'h1', text: 'Question A', status: 'answered' }),
      makeQuestion({ id: 'h2', text: 'Question B', status: 'ruled-out' }),
    ];
    render(<ReportQuestionSummary questions={questions} />);
    expect(screen.getByTestId('report-question-summary')).toBeDefined();
  });

  it('returns null for empty questions', () => {
    const { container } = render(<ReportQuestionSummary questions={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders cause role badge', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'h1', text: 'Suspected cause', causeRole: 'suspected-cause' }),
    ];
    render(<ReportQuestionSummary questions={questions} />);
    expect(screen.getByText('suspected-cause')).toBeDefined();
  });

  it('renders factor link', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'h1', text: 'Factor-linked', factor: 'Machine', level: 'Line A' }),
    ];
    render(<ReportQuestionSummary questions={questions} />);
    expect(screen.getByText('(Machine: Line A)')).toBeDefined();
  });
});
