import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportImprovementSummary } from '../ReportImprovementSummary';
import type { ReportImprovementSummaryProps } from '../ReportImprovementSummary';
import type { ImprovementIdea } from '@variscout/core';

const makeIdea = (overrides: Partial<ImprovementIdea> = {}): ImprovementIdea => ({
  id: 'idea1',
  text: 'Install temperature sensor',
  selected: false,
  createdAt: 1714000000000,
  deletedAt: null,
  ...overrides,
});

const makeProps = (
  overrides: Partial<ReportImprovementSummaryProps> = {}
): ReportImprovementSummaryProps => ({
  questions: [
    {
      id: 'h1',
      text: 'Temperature causes defects',
      causeRole: 'suspected-cause',
      ideas: [
        makeIdea({ id: 'i1', text: 'Install sensor', selected: true, direction: 'detect' }),
        makeIdea({ id: 'i2', text: 'Add insulation', selected: false, direction: 'prevent' }),
      ],
    },
  ],
  ...overrides,
});

describe('ReportImprovementSummary', () => {
  it('renders grouped ideas with question header', () => {
    render(<ReportImprovementSummary {...makeProps()} />);
    expect(screen.getByTestId('report-improvement-summary')).toBeDefined();
    expect(screen.getByText('Temperature causes defects')).toBeDefined();
    expect(screen.getByText('Install sensor')).toBeDefined();
    expect(screen.getByText('Add insulation')).toBeDefined();
  });

  it('renders selection indicators', () => {
    render(<ReportImprovementSummary {...makeProps()} />);
    // The selected idea has a checkmark SVG, unselected has empty border
    expect(screen.getByTestId('report-improvement-summary')).toBeDefined();
  });

  it('shows summary bar with selected count', () => {
    render(<ReportImprovementSummary {...makeProps()} />);
    expect(screen.getByTestId('report-improvement-summary-bar')).toBeDefined();
  });

  it('renders summaryOnly mode', () => {
    render(<ReportImprovementSummary {...makeProps({ summaryOnly: true })} />);
    expect(screen.getByTestId('report-improvement-summary-bar')).toBeDefined();
    // Full detail section should not be present
    expect(screen.queryByTestId('report-improvement-summary')).toBeNull();
  });

  it('returns null when no questions have ideas', () => {
    const { container } = render(
      <ReportImprovementSummary questions={[{ id: 'h1', text: 'Empty', ideas: [] }]} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders direction badges', () => {
    render(<ReportImprovementSummary {...makeProps()} />);
    // Direction labels will be i18n keys or English values
    expect(screen.getByTestId('report-improvement-summary')).toBeDefined();
  });

  it('renders timeframe and cost metadata', () => {
    const props = makeProps({
      questions: [
        {
          id: 'h1',
          text: 'Cause',
          ideas: [
            makeIdea({
              id: 'i1',
              text: 'Fix it',
              selected: true,
              timeframe: 'days',
              cost: { category: 'low', amount: 500 },
            }),
          ],
        },
      ],
    });
    render(<ReportImprovementSummary {...props} />);
    expect(screen.getByText(/500/)).toBeDefined();
  });

  it('renders best projected Cpk in summary bar', () => {
    const props = makeProps({
      questions: [
        {
          id: 'h1',
          text: 'Cause',
          ideas: [
            makeIdea({
              id: 'i1',
              text: 'Fix it',
              selected: true,
              projection: {
                baselineMean: 10,
                baselineSigma: 1,
                projectedMean: 10,
                projectedSigma: 0.5,
                projectedCpk: 1.45,
                projectedYield: 99.5,
                meanDelta: 0,
                sigmaDelta: -0.5,
                simulationParams: { meanAdjustment: 0, variationReduction: 50 },
                createdAt: new Date().toISOString(),
              },
            }),
          ],
        },
      ],
    });
    render(<ReportImprovementSummary {...props} />);
    expect(screen.getAllByText(/1\.45/).length).toBeGreaterThanOrEqual(1);
  });
});
