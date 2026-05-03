import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerificationCard from '../VerificationCard';

describe('VerificationCard', () => {
  const tabs = [
    {
      id: 'probability',
      label: 'Probability',
      content: <div data-testid="probability-content">Probability plot content</div>,
    },
    {
      id: 'distribution',
      label: 'Distribution',
      content: <div data-testid="distribution-content">Distribution content</div>,
    },
    {
      id: 'pareto',
      label: 'Pareto',
      content: <div data-testid="pareto-content">Pareto content</div>,
    },
  ];

  it('renders the active tab content', () => {
    render(<VerificationCard tabs={tabs} activeTab="probability" />);
    expect(screen.getByTestId('probability-content')).toBeTruthy();
    expect(screen.queryByTestId('distribution-content')).toBeNull();
    expect(screen.queryByTestId('pareto-content')).toBeNull();
  });

  it('renders distribution content when activeTab is distribution', () => {
    render(<VerificationCard tabs={tabs} activeTab="distribution" />);
    expect(screen.getByTestId('distribution-content')).toBeTruthy();
    expect(screen.queryByTestId('probability-content')).toBeNull();
  });

  it('renders pareto content when activeTab is pareto', () => {
    render(<VerificationCard tabs={tabs} activeTab="pareto" />);
    expect(screen.getByTestId('pareto-content')).toBeTruthy();
    expect(screen.queryByTestId('probability-content')).toBeNull();
  });

  it('falls back to first tab when activeTab does not match any tab id', () => {
    render(<VerificationCard tabs={tabs} activeTab="nonexistent" />);
    expect(screen.getByTestId('probability-content')).toBeTruthy();
  });

  it('renders no tab buttons (tab bar belongs to the card header)', () => {
    render(<VerificationCard tabs={tabs} activeTab="probability" />);
    // The segmented control lives in the DashboardChartCard title slot, not here
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('returns null when tabs array is empty', () => {
    const { container } = render(<VerificationCard tabs={[]} activeTab="probability" />);
    expect(container.firstChild).toBeNull();
  });
});
