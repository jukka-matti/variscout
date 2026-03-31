import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportInvestigationSummary } from '../ReportInvestigationSummary';

describe('ReportInvestigationSummary', () => {
  it('returns null when no content provided', () => {
    const { container } = render(<ReportInvestigationSummary />);
    expect(container.innerHTML).toBe('');
  });

  it('renders issue statement', () => {
    render(<ReportInvestigationSummary issueStatement="Fill weight exceeds USL on Line 3" />);
    expect(screen.getByTestId('report-investigation-summary')).toBeDefined();
    expect(screen.getByText('Fill weight exceeds USL on Line 3')).toBeDefined();
    expect(screen.getByText('Issue Statement')).toBeDefined();
  });

  it('renders suspected causes with evidence', () => {
    render(
      <ReportInvestigationSummary
        suspectedCauses={[
          {
            text: 'Shift changeover procedure',
            factor: 'Shift',
            level: 'Night',
            evidence: { etaSquared: 0.35 },
          },
          {
            text: 'Material batch variation',
            factor: 'Batch',
            evidence: { rSquaredAdj: 0.22 },
          },
        ]}
      />
    );
    expect(screen.getByText('Suspected Causes')).toBeDefined();
    expect(screen.getByText('Shift changeover procedure')).toBeDefined();
    expect(screen.getByText('Material batch variation')).toBeDefined();
  });

  it('renders negative learnings', () => {
    render(
      <ReportInvestigationSummary
        ruledOut={[{ text: 'Tool wear', factor: 'Tool', evidence: { etaSquared: 0.01 } }]}
      />
    );
    expect(screen.getByText('Negative Learnings')).toBeDefined();
    expect(screen.getByText('Tool wear')).toBeDefined();
  });

  it('renders problem statement', () => {
    render(
      <ReportInvestigationSummary problemStatement="Mean fill weight increased 3g since January across all lines" />
    );
    expect(screen.getByText('Problem Statement')).toBeDefined();
    expect(screen.getByText(/Mean fill weight increased/)).toBeDefined();
  });
});
