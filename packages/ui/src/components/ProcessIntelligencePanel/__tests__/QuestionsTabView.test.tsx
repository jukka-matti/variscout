import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionsTabView from '../QuestionsTabView';
import type { Question, Finding } from '@variscout/core/findings';
import type { SuspectedCause } from '../ConclusionCard';

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
    expect(screen.getByText('Issue / Concern')).toBeDefined();
    expect(screen.getByText('Cpk below 1.33 on Line 3 since Feb')).toBeDefined();
  });

  it('does not render issue statement when absent', () => {
    render(<QuestionsTabView questions={[]} findings={[]} />);
    expect(screen.queryByTestId('issue-statement')).toBeNull();
  });

  it('renders current understanding when provided', () => {
    render(
      <QuestionsTabView
        questions={[]}
        findings={[]}
        currentUnderstanding={{
          summary:
            'Issue / concern: Cpk below target.\nProblem condition: Cpk is 0.87 against target 1.33.',
        }}
      />
    );
    expect(screen.getByTestId('current-understanding')).toBeDefined();
    expect(screen.getByText('Current Understanding')).toBeDefined();
    expect(screen.getByText(/Cpk is 0.87 against target 1.33/)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: progress bar
// ---------------------------------------------------------------------------

describe('QuestionsTabView — progress bar', () => {
  it('renders progress bar with question count when questions exist', () => {
    const q1 = makeQuestion({ id: 'h1', status: 'answered' }); // answered
    const q2 = makeQuestion({ id: 'h2', status: 'investigating' }); // investigating
    const q3 = makeQuestion({ id: 'h3', status: 'open' }); // open
    render(<QuestionsTabView questions={[q1, q2, q3]} findings={[]} />);
    expect(screen.getByTestId('progress-bar')).toBeDefined();
    // explored = answered(1) + investigating(1) + ruled-out(0) = 2
    expect(screen.getByTestId('progress-explored').textContent).toBe('2/3 explored');
  });

  it('shows finding count in progress bar', () => {
    const q = makeQuestion();
    const f = makeFinding({ id: 'f1' });
    render(<QuestionsTabView questions={[q]} findings={[f]} />);
    expect(screen.getByTestId('progress-findings').textContent).toBe('1 finding');
  });

  it('pluralises findings label when more than one', () => {
    const q = makeQuestion();
    const findings = [makeFinding({ id: 'f1' }), makeFinding({ id: 'f2' })];
    render(<QuestionsTabView questions={[q]} findings={findings} />);
    expect(screen.getByTestId('progress-findings').textContent).toBe('2 findings');
  });

  it('hides progress bar when no questions', () => {
    render(<QuestionsTabView questions={[]} findings={[]} />);
    expect(screen.queryByTestId('progress-bar')).toBeNull();
  });

  it('counts ruled-out questions in explored total', () => {
    const q1 = makeQuestion({ id: 'h1', status: 'ruled-out' }); // ruled-out
    const q2 = makeQuestion({ id: 'h2', status: 'open' }); // open
    render(<QuestionsTabView questions={[q1, q2]} findings={[]} />);
    expect(screen.getByTestId('progress-explored').textContent).toBe('1/2 explored');
  });
});

// ---------------------------------------------------------------------------
// Tests: question grouping
// ---------------------------------------------------------------------------

describe('QuestionsTabView — question grouping', () => {
  it('groups questions by display status into separate groups', () => {
    const answered = makeQuestion({ id: 'h1', status: 'answered', factor: 'Operator' });
    const investigating = makeQuestion({ id: 'h2', status: 'investigating', factor: 'Machine' });
    const open = makeQuestion({ id: 'h3', status: 'open', factor: 'Material' });

    render(<QuestionsTabView questions={[answered, investigating, open]} findings={[]} />);

    expect(screen.getByTestId('question-group-answered')).toBeDefined();
    expect(screen.getByTestId('question-group-investigating')).toBeDefined();
    expect(screen.getByTestId('question-group-open')).toBeDefined();
  });

  it('does not render a group container for empty groups', () => {
    const open = makeQuestion({ id: 'h1', status: 'open' });
    render(<QuestionsTabView questions={[open]} findings={[]} />);
    // answered group should not be rendered
    expect(screen.queryByTestId('question-group-answered')).toBeNull();
  });

  it('renders ruled-out group with toggle collapsed by default', () => {
    const ruledOut = makeQuestion({ id: 'h1', status: 'ruled-out', factor: 'Speed' });
    render(<QuestionsTabView questions={[ruledOut]} findings={[]} />);
    expect(screen.getByTestId('question-group-ruled-out')).toBeDefined();
    // Toggle button present
    const toggle = screen.getByTestId('ruled-out-toggle');
    expect(toggle).toBeDefined();
    // The question row is hidden (collapsed)
    expect(screen.queryByTestId('question-row-h1')).toBeNull();
  });

  it('expands ruled-out group when toggle is clicked', () => {
    const ruledOut = makeQuestion({ id: 'h1', status: 'ruled-out', factor: 'Speed' });
    render(<QuestionsTabView questions={[ruledOut]} findings={[]} />);
    fireEvent.click(screen.getByTestId('ruled-out-toggle'));
    expect(screen.getByTestId('question-row-h1')).toBeDefined();
  });

  it('renders QuestionRow for each non-ruled-out question', () => {
    const q1 = makeQuestion({ id: 'h1', status: 'open' });
    const q2 = makeQuestion({ id: 'h2', status: 'investigating' });
    render(<QuestionsTabView questions={[q1, q2]} findings={[]} />);
    expect(screen.getByTestId('question-row-h1')).toBeDefined();
    expect(screen.getByTestId('question-row-h2')).toBeDefined();
  });

  it('highlights active question with isActive prop', () => {
    const q = makeQuestion({ id: 'h1', status: 'open' });
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
    const q = makeQuestion();
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
    const q = makeQuestion({ id: 'h1', linkedFindingIds: [] });
    render(<QuestionsTabView questions={[q]} findings={[f]} />);
    expect(screen.getByTestId('observations-section')).toBeDefined();
    expect(screen.getByTestId('observation-f1')).toBeDefined();
  });

  it('does not include linked findings in observations', () => {
    const f = makeFinding({ id: 'f1' });
    // Question links to f1, so f1 should NOT appear in observations
    const q = makeQuestion({ id: 'h1', linkedFindingIds: ['f1'] });
    render(<QuestionsTabView questions={[q]} findings={[f]} />);
    expect(screen.queryByTestId('observation-f1')).toBeNull();
  });

  it('hides observations section when all findings are linked and no add callback', () => {
    const f = makeFinding({ id: 'f1' });
    const q = makeQuestion({ id: 'h1', linkedFindingIds: ['f1'] });
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
// Tests: evidence sorting (ADR-060 Pillar 5)
// ---------------------------------------------------------------------------

describe('QuestionsTabView — evidence sorting', () => {
  it('sorts questions within a group by rSquaredAdj descending', () => {
    // Three open questions with different evidence values
    const q1 = makeQuestion({
      id: 'q-low',
      status: 'open',
      factor: 'Material',
      evidence: { rSquaredAdj: 0.12 },
    });
    const q2 = makeQuestion({
      id: 'q-high',
      status: 'open',
      factor: 'Operator',
      evidence: { rSquaredAdj: 0.45 },
    });
    const q3 = makeQuestion({
      id: 'q-mid',
      status: 'open',
      factor: 'Machine',
      evidence: { rSquaredAdj: 0.28 },
    });

    render(<QuestionsTabView questions={[q1, q2, q3]} findings={[]} />);

    const group = screen.getByTestId('question-group-open');
    const rows = group.querySelectorAll('[data-testid^="question-row-"]');
    const ids = Array.from(rows).map(r =>
      r.getAttribute('data-testid')?.replace('question-row-', '')
    );

    // Expected order: q-high (0.45) → q-mid (0.28) → q-low (0.12)
    expect(ids).toEqual(['q-high', 'q-mid', 'q-low']);
  });

  it('places questions without evidence at the end of the group', () => {
    const qWithEvidence = makeQuestion({
      id: 'q-evidence',
      status: 'open',
      factor: 'Operator',
      evidence: { rSquaredAdj: 0.3 },
    });
    const qNoEvidence = makeQuestion({
      id: 'q-no-evidence',
      status: 'open',
      factor: 'Material',
      evidence: undefined,
    });

    render(<QuestionsTabView questions={[qNoEvidence, qWithEvidence]} findings={[]} />);

    const group = screen.getByTestId('question-group-open');
    const rows = group.querySelectorAll('[data-testid^="question-row-"]');
    const ids = Array.from(rows).map(r =>
      r.getAttribute('data-testid')?.replace('question-row-', '')
    );

    // q-evidence (0.3) should come before q-no-evidence (-1 sentinel)
    expect(ids).toEqual(['q-evidence', 'q-no-evidence']);
  });

  it('sorts each group independently', () => {
    const answeredLow = makeQuestion({
      id: 'a-low',
      status: 'answered',
      factor: 'Speed',
      evidence: { rSquaredAdj: 0.1 },
    });
    const answeredHigh = makeQuestion({
      id: 'a-high',
      status: 'answered',
      factor: 'Pressure',
      evidence: { rSquaredAdj: 0.9 },
    });
    const openMid = makeQuestion({
      id: 'o-mid',
      status: 'open',
      factor: 'Temperature',
      evidence: { rSquaredAdj: 0.5 },
    });

    render(<QuestionsTabView questions={[answeredLow, answeredHigh, openMid]} findings={[]} />);

    const answeredGroup = screen.getByTestId('question-group-answered');
    const answeredRows = answeredGroup.querySelectorAll('[data-testid^="question-row-"]');
    const answeredIds = Array.from(answeredRows).map(r =>
      r.getAttribute('data-testid')?.replace('question-row-', '')
    );

    // Within answered group: a-high (0.9) before a-low (0.1)
    expect(answeredIds).toEqual(['a-high', 'a-low']);

    // Open group should still render its own question
    expect(screen.getByTestId('question-row-o-mid')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tests: evidenceLabel prop (ADR-060 Pillar 5)
// ---------------------------------------------------------------------------

describe('QuestionsTabView — evidenceLabel prop', () => {
  it('passes default evidenceLabel "R²adj" to QuestionRow aria-label', () => {
    const q = makeQuestion({
      id: 'q1',
      status: 'open',
      factor: 'Operator',
      evidence: { rSquaredAdj: 0.42 },
    });

    render(<QuestionsTabView questions={[q]} findings={[]} />);

    // QuestionRow renders evidence as aria-label="<evidenceLabel> <pct>%"
    const evidenceEl = screen.getByLabelText('R²adj 42%');
    expect(evidenceEl).toBeDefined();
  });

  it('passes custom evidenceLabel to QuestionRow aria-label for performance mode', () => {
    const q = makeQuestion({
      id: 'q1',
      status: 'open',
      factor: 'Channel',
      evidence: { rSquaredAdj: 0.67 },
    });

    render(<QuestionsTabView questions={[q]} findings={[]} evidenceLabel="Cpk gap" />);

    const evidenceEl = screen.getByLabelText('Cpk gap 67%');
    expect(evidenceEl).toBeDefined();
  });

  it('passes custom evidenceLabel for yamazumi mode', () => {
    const q = makeQuestion({
      id: 'q1',
      status: 'open',
      factor: 'Step',
      evidence: { rSquaredAdj: 0.55 },
    });

    render(<QuestionsTabView questions={[q]} findings={[]} evidenceLabel="Waste%" />);

    const evidenceEl = screen.getByLabelText('Waste% 55%');
    expect(evidenceEl).toBeDefined();
  });

  it('does not render evidence span when question has no evidence', () => {
    const q = makeQuestion({
      id: 'q1',
      status: 'open',
      factor: 'Operator',
      evidence: undefined,
    });

    render(<QuestionsTabView questions={[q]} findings={[]} evidenceLabel="R²adj" />);

    // No aria-label containing the evidence label should be present
    expect(screen.queryByLabelText(/R²adj/)).toBeNull();
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
