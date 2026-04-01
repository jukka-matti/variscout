import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionRow from '../QuestionRow';
import type { Hypothesis, Finding } from '@variscout/core/findings';

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
// Tests
// ---------------------------------------------------------------------------

describe('QuestionRow', () => {
  it('renders question text as factor name + "?"', () => {
    render(<QuestionRow question={makeHypothesis()} findings={[]} />);
    expect(screen.getByText('Operator?')).toBeDefined();
  });

  it('falls back to hypothesis text when factor is absent', () => {
    const q = makeHypothesis({ factor: undefined, text: 'Is temperature relevant?' });
    render(<QuestionRow question={q} findings={[]} />);
    expect(screen.getByText('Is temperature relevant?')).toBeDefined();
  });

  it('shows evidence percentage when rSquaredAdj is present', () => {
    const q = makeHypothesis({ evidence: { rSquaredAdj: 0.72 } });
    render(<QuestionRow question={q} findings={[]} />);
    expect(screen.getByText('72%')).toBeDefined();
  });

  it('does not render evidence percentage when evidence is absent', () => {
    render(<QuestionRow question={makeHypothesis()} findings={[]} />);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('shows finding count badge when there are findings', () => {
    const findings = [makeFinding({ id: 'f1' }), makeFinding({ id: 'f2' })];
    render(<QuestionRow question={makeHypothesis()} findings={findings} />);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('does not render finding count badge when findings is empty', () => {
    render(<QuestionRow question={makeHypothesis()} findings={[]} />);
    // The badge text "0" should not appear — we look for digit-only text
    expect(screen.queryByText('0')).toBeNull();
  });

  it('calls onClick with the question when the row is clicked', () => {
    const onClick = vi.fn();
    const q = makeHypothesis();
    render(<QuestionRow question={q} findings={[]} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('question-row-h1'));
    expect(onClick).toHaveBeenCalledWith(q);
  });

  it('calls onClick on Enter key press', () => {
    const onClick = vi.fn();
    const q = makeHypothesis();
    render(<QuestionRow question={q} findings={[]} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('question-row-h1'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith(q);
  });

  it('shows green evidence color for answered questions (supported status)', () => {
    const q = makeHypothesis({ status: 'supported', evidence: { rSquaredAdj: 0.85 } });
    render(<QuestionRow question={q} findings={[]} />);
    const pctEl = screen.getByText('85%');
    expect(pctEl.className).toContain('text-green-500');
  });

  it('shows amber evidence color for open questions (untested status)', () => {
    const q = makeHypothesis({ status: 'untested', evidence: { rSquaredAdj: 0.45 } });
    render(<QuestionRow question={q} findings={[]} />);
    const pctEl = screen.getByText('45%');
    expect(pctEl.className).toContain('text-amber-500');
  });

  it('applies line-through style for ruled-out questions (contradicted status)', () => {
    const q = makeHypothesis({ status: 'contradicted' });
    render(<QuestionRow question={q} findings={[]} />);
    const label = screen.getByText('Operator?');
    expect(label.className).toContain('line-through');
  });

  it('applies reduced opacity for ruled-out questions', () => {
    const q = makeHypothesis({ status: 'contradicted' });
    render(<QuestionRow question={q} findings={[]} />);
    const row = screen.getByTestId('question-row-h1');
    expect(row.className).toContain('opacity-40');
  });

  it('highlights with bg-surface-tertiary when isActive is true', () => {
    render(<QuestionRow question={makeHypothesis()} findings={[]} isActive />);
    const row = screen.getByTestId('question-row-h1');
    expect(row.className).toContain('bg-surface-tertiary');
  });

  it('shows ◀ active indicator when isActive is true', () => {
    render(<QuestionRow question={makeHypothesis()} findings={[]} isActive />);
    expect(screen.getByText('◀')).toBeDefined();
  });

  it('does not show active indicator when isActive is false', () => {
    render(<QuestionRow question={makeHypothesis()} findings={[]} isActive={false} />);
    expect(screen.queryByText('◀')).toBeNull();
  });

  it('calls onToggleExpand with question id when expand chevron is clicked', () => {
    const onToggleExpand = vi.fn();
    render(
      <QuestionRow question={makeHypothesis()} findings={[]} onToggleExpand={onToggleExpand} />
    );
    fireEvent.click(screen.getByRole('button', { name: /expand findings/i }));
    expect(onToggleExpand).toHaveBeenCalledWith('h1');
  });

  it('expand click does not bubble up to row onClick', () => {
    const onClick = vi.fn();
    const onToggleExpand = vi.fn();
    render(
      <QuestionRow
        question={makeHypothesis()}
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
    render(<QuestionRow question={makeHypothesis()} findings={[]} isExpanded />);
    expect(screen.getByRole('button', { name: /collapse findings/i })).toBeDefined();
  });
});
