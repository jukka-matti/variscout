import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportHypothesisSummary } from '../ReportHypothesisSummary';
import type { Hypothesis } from '@variscout/core';

const makeHypothesis = (overrides: Partial<Hypothesis> = {}): Hypothesis => ({
  id: 'h1',
  text: 'Temperature causes defects',
  status: 'supported' as const,
  linkedFindingIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('ReportHypothesisSummary', () => {
  it('renders hypothesis tree with parent/child', () => {
    const hypotheses: Hypothesis[] = [
      makeHypothesis({ id: 'root', text: 'Root cause: temperature' }),
      makeHypothesis({
        id: 'child',
        text: 'Sub: ambient temp',
        parentId: 'root',
        status: 'partial',
      }),
    ];
    render(<ReportHypothesisSummary hypotheses={hypotheses} />);
    expect(screen.getByTestId('report-hypothesis-summary')).toBeDefined();
    expect(screen.getByText('Root cause: temperature')).toBeDefined();
    expect(screen.getByText('Sub: ambient temp')).toBeDefined();
  });

  it('renders status badges', () => {
    const hypotheses: Hypothesis[] = [
      makeHypothesis({ id: 'h1', text: 'Hypothesis A', status: 'supported' }),
      makeHypothesis({ id: 'h2', text: 'Hypothesis B', status: 'contradicted' }),
    ];
    render(<ReportHypothesisSummary hypotheses={hypotheses} />);
    expect(screen.getByTestId('report-hypothesis-summary')).toBeDefined();
  });

  it('returns null for empty hypotheses', () => {
    const { container } = render(<ReportHypothesisSummary hypotheses={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders cause role badge', () => {
    const hypotheses: Hypothesis[] = [
      makeHypothesis({ id: 'h1', text: 'Suspected cause', causeRole: 'suspected-cause' }),
    ];
    render(<ReportHypothesisSummary hypotheses={hypotheses} />);
    expect(screen.getByText('suspected-cause')).toBeDefined();
  });

  it('renders factor link', () => {
    const hypotheses: Hypothesis[] = [
      makeHypothesis({ id: 'h1', text: 'Factor-linked', factor: 'Machine', level: 'Line A' }),
    ];
    render(<ReportHypothesisSummary hypotheses={hypotheses} />);
    expect(screen.getByText('(Machine: Line A)')).toBeDefined();
  });
});
