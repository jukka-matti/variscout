import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvestigationConclusion } from '../InvestigationConclusion';
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

describe('InvestigationConclusion', () => {
  it('returns null when hasConclusions is false', () => {
    const { container } = render(
      <InvestigationConclusion
        suspectedCauses={[makeQuestion()]}
        ruledOut={[]}
        contributing={[]}
        hasConclusions={false}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders suspected causes section', () => {
    const causes = [
      makeQuestion({
        id: 'h1',
        text: 'Shift changeover procedure',
        factor: 'Shift',
        evidence: { etaSquared: 0.35 },
      }),
    ];
    render(
      <InvestigationConclusion
        suspectedCauses={causes}
        ruledOut={[]}
        contributing={[]}
        hasConclusions
      />
    );
    expect(screen.getByTestId('suspected-causes')).toBeDefined();
    expect(screen.getByText('Shift changeover procedure')).toBeDefined();
  });

  it('renders ruled-out section collapsed by default', () => {
    const ruledOut = [
      makeQuestion({
        id: 'h2',
        text: 'Material batch variation',
        status: 'ruled-out',
        evidence: { rSquaredAdj: 0.01 },
      }),
    ];
    render(
      <InvestigationConclusion
        suspectedCauses={[]}
        ruledOut={ruledOut}
        contributing={[]}
        hasConclusions
      />
    );
    expect(screen.getByTestId('ruled-out')).toBeDefined();
    // The ruled-out items should not be visible until expanded
    expect(screen.queryByText('Material batch variation')).toBeNull();

    // Expand
    fireEvent.click(screen.getByTestId('ruled-out-toggle'));
    expect(screen.getByText('Material batch variation')).toBeDefined();
  });

  it('shows problem statement when provided', () => {
    render(
      <InvestigationConclusion
        suspectedCauses={[]}
        ruledOut={[]}
        contributing={[]}
        problemStatement="Mean fill weight increased 3g since January"
        hasConclusions
      />
    );
    expect(screen.getByTestId('problem-statement')).toBeDefined();
    expect(screen.getByText('Approved Problem Statement')).toBeDefined();
    expect(screen.getByText('Mean fill weight increased 3g since January')).toBeDefined();
  });

  it('renders contributing factors section', () => {
    const contributing = [
      makeQuestion({
        id: 'h3',
        text: 'Ambient temperature',
        factor: 'Temp',
        evidence: { etaSquared: 0.12 },
      }),
    ];
    render(
      <InvestigationConclusion
        suspectedCauses={[]}
        ruledOut={[]}
        contributing={contributing}
        hasConclusions
      />
    );
    expect(screen.getByTestId('contributing-factors')).toBeDefined();
    expect(screen.getByText('Ambient temperature')).toBeDefined();
  });
});
