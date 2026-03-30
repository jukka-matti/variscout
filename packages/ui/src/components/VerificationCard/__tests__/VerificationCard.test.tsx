import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'stats.histogram': 'Histogram',
    'stats.probPlot': 'Prob Plot',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      locale: 'en',
    }),
  };
});

import VerificationCard from '../VerificationCard';

describe('VerificationCard', () => {
  const defaultProps = {
    renderHistogram: <div data-testid="histogram-content">Histogram content</div>,
    renderProbabilityPlot: <div data-testid="prob-plot-content">Probability plot content</div>,
  };

  it('renders probability plot tab by default', () => {
    render(<VerificationCard {...defaultProps} />);

    expect(screen.getByTestId('prob-plot-content')).toBeTruthy();
    expect(screen.queryByTestId('histogram-content')).toBeNull();
  });

  it('renders both tab buttons', () => {
    render(<VerificationCard {...defaultProps} />);

    expect(screen.getByText('Histogram')).toBeTruthy();
    expect(screen.getByText('Prob Plot')).toBeTruthy();
  });

  it('probability plot tab is active by default', () => {
    render(<VerificationCard {...defaultProps} />);

    const probPlotButton = screen.getByText('Prob Plot').closest('button');
    expect(probPlotButton?.getAttribute('aria-pressed')).toBe('true');

    const histogramButton = screen.getByText('Histogram').closest('button');
    expect(histogramButton?.getAttribute('aria-pressed')).toBe('false');
  });

  it('switches to histogram on tab click', () => {
    render(<VerificationCard {...defaultProps} />);

    fireEvent.click(screen.getByText('Histogram'));

    expect(screen.getByTestId('histogram-content')).toBeTruthy();
    expect(screen.queryByTestId('prob-plot-content')).toBeNull();
  });

  it('activates histogram tab after click', () => {
    render(<VerificationCard {...defaultProps} />);

    fireEvent.click(screen.getByText('Histogram'));

    const histogramButton = screen.getByText('Histogram').closest('button');
    expect(histogramButton?.getAttribute('aria-pressed')).toBe('true');

    const probPlotButton = screen.getByText('Prob Plot').closest('button');
    expect(probPlotButton?.getAttribute('aria-pressed')).toBe('false');
  });

  it('accepts custom defaultTab prop set to probability', () => {
    render(<VerificationCard {...defaultProps} defaultTab="probability" />);

    expect(screen.getByTestId('prob-plot-content')).toBeTruthy();
    expect(screen.queryByTestId('histogram-content')).toBeNull();
  });

  it('accepts custom defaultTab prop set to histogram explicitly', () => {
    render(<VerificationCard {...defaultProps} defaultTab="histogram" />);

    expect(screen.getByTestId('histogram-content')).toBeTruthy();
    expect(screen.queryByTestId('prob-plot-content')).toBeNull();
  });

  it('can switch back to probability after switching to histogram', () => {
    render(<VerificationCard {...defaultProps} />);

    fireEvent.click(screen.getByText('Histogram'));
    fireEvent.click(screen.getByText('Prob Plot'));

    expect(screen.getByTestId('prob-plot-content')).toBeTruthy();
    expect(screen.queryByTestId('histogram-content')).toBeNull();
  });

  it('marks tab bar with data-export-hide', () => {
    render(<VerificationCard {...defaultProps} />);

    const histogramButton = screen.getByText('Histogram');
    const tabBar = histogramButton.closest('[data-export-hide]');
    expect(tabBar).toBeTruthy();
  });
});
