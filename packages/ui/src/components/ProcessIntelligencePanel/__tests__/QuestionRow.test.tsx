import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionRow from '../QuestionRow';
import type { Question, Finding } from '@variscout/core/findings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'h1',
    text: 'Does Operator affect the result?',
    factor: 'Operator',
    status: 'open',
    linkedFindingIds: [],
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'general-unassigned',
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f1',
    text: 'Night shift shows higher spread',
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'general-unassigned',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('QuestionRow', () => {
  it('renders question text as factor name + "?"', () => {
    render(<QuestionRow question={makeQuestion()} findings={[]} />);
    expect(screen.getByText('Operator?')).toBeDefined();
  });

  it('falls back to question text when factor is absent', () => {
    const q = makeQuestion({ factor: undefined, text: 'Is temperature relevant?' });
    render(<QuestionRow question={q} findings={[]} />);
    expect(screen.getByText('Is temperature relevant?')).toBeDefined();
  });

  it('shows evidence percentage when rSquaredAdj is present', () => {
    const q = makeQuestion({ evidence: { rSquaredAdj: 0.72 } });
    render(<QuestionRow question={q} findings={[]} />);
    expect(screen.getByText('72%')).toBeDefined();
  });

  it('does not render evidence percentage when evidence is absent', () => {
    render(<QuestionRow question={makeQuestion()} findings={[]} />);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('shows finding count badge when there are findings', () => {
    const findings = [makeFinding({ id: 'f1' }), makeFinding({ id: 'f2' })];
    render(<QuestionRow question={makeQuestion()} findings={findings} />);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('does not render finding count badge when findings is empty', () => {
    render(<QuestionRow question={makeQuestion()} findings={[]} />);
    // The badge text "0" should not appear — we look for digit-only text
    expect(screen.queryByText('0')).toBeNull();
  });

  it('calls onClick with the question when the factor label is clicked', () => {
    const onClick = vi.fn();
    const q = makeQuestion();
    render(<QuestionRow question={q} findings={[]} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /Operator\?/i }));
    expect(onClick).toHaveBeenCalledWith(q);
  });

  it('calls onClick on Enter key press on factor label', () => {
    const onClick = vi.fn();
    const q = makeQuestion();
    render(<QuestionRow question={q} findings={[]} onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /Operator\?/i }), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith(q);
  });

  it('shows green evidence color for answered questions (supported status)', () => {
    const q = makeQuestion({ status: 'answered', evidence: { rSquaredAdj: 0.85 } });
    render(<QuestionRow question={q} findings={[]} />);
    const pctEl = screen.getByText('85%');
    expect(pctEl.className).toContain('text-green-500');
  });

  it('shows amber evidence color for open questions (untested status)', () => {
    const q = makeQuestion({ status: 'open', evidence: { rSquaredAdj: 0.45 } });
    render(<QuestionRow question={q} findings={[]} />);
    const pctEl = screen.getByText('45%');
    expect(pctEl.className).toContain('text-amber-500');
  });

  it('applies line-through style for ruled-out questions (contradicted status)', () => {
    const q = makeQuestion({ status: 'ruled-out' });
    render(<QuestionRow question={q} findings={[]} />);
    const label = screen.getByText('Operator?');
    expect(label.className).toContain('line-through');
  });

  it('applies reduced opacity for ruled-out questions', () => {
    const q = makeQuestion({ status: 'ruled-out' });
    render(<QuestionRow question={q} findings={[]} />);
    const row = screen.getByTestId('question-row-h1');
    expect(row.className).toContain('opacity-40');
  });

  it('highlights with bg-surface-tertiary when isActive is true', () => {
    render(<QuestionRow question={makeQuestion()} findings={[]} isActive />);
    const row = screen.getByTestId('question-row-h1');
    expect(row.className).toContain('bg-surface-tertiary');
  });

  it('shows ◀ active indicator when isActive is true', () => {
    render(<QuestionRow question={makeQuestion()} findings={[]} isActive />);
    expect(screen.getByText('◀')).toBeDefined();
  });

  it('does not show active indicator when isActive is false', () => {
    render(<QuestionRow question={makeQuestion()} findings={[]} isActive={false} />);
    expect(screen.queryByText('◀')).toBeNull();
  });

  it('calls onToggleExpand with question id when expand chevron is clicked', () => {
    const onToggleExpand = vi.fn();
    render(<QuestionRow question={makeQuestion()} findings={[]} onToggleExpand={onToggleExpand} />);
    fireEvent.click(screen.getByRole('button', { name: /expand findings/i }));
    expect(onToggleExpand).toHaveBeenCalledWith('h1');
  });

  it('expand click does not bubble up to row onClick', () => {
    const onClick = vi.fn();
    const onToggleExpand = vi.fn();
    render(
      <QuestionRow
        question={makeQuestion()}
        findings={[]}
        onClick={onClick}
        onToggleExpand={onToggleExpand}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /expand findings/i }));
    expect(onClick).not.toHaveBeenCalled();
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('shows ChevronDown when isExpanded is true', () => {
    render(<QuestionRow question={makeQuestion()} findings={[]} isExpanded />);
    expect(screen.getByRole('button', { name: /collapse findings/i })).toBeDefined();
  });
});
