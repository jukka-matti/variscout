import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VerificationCard from '../VerificationCard';

describe('VerificationCard', () => {
  const defaultProps = {
    tabs: [
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
    ],
  };

  it('renders the configured default tab content', () => {
    render(<VerificationCard {...defaultProps} defaultTab="probability" />);

    expect(screen.getByTestId('probability-content')).toBeTruthy();
    expect(screen.queryByTestId('distribution-content')).toBeNull();
  });

  it('renders all configured tabs', () => {
    render(<VerificationCard {...defaultProps} />);

    expect(screen.getByText('Probability')).toBeTruthy();
    expect(screen.getByText('Distribution')).toBeTruthy();
    expect(screen.getByText('Pareto')).toBeTruthy();
  });

  it('switches to another configured tab on click', () => {
    render(<VerificationCard {...defaultProps} />);

    fireEvent.click(screen.getByText('Pareto'));

    expect(screen.getByTestId('pareto-content')).toBeTruthy();
    expect(screen.queryByTestId('probability-content')).toBeNull();
  });

  it('supports controlled tab state', () => {
    const onTabChange = vi.fn();
    render(
      <VerificationCard {...defaultProps} activeTab="distribution" onTabChange={onTabChange} />
    );

    expect(screen.getByTestId('distribution-content')).toBeTruthy();

    fireEvent.click(screen.getByText('Pareto'));
    expect(onTabChange).toHaveBeenCalledWith('pareto');
  });

  it('marks the active tab with aria-pressed', () => {
    render(<VerificationCard {...defaultProps} activeTab="distribution" />);

    const distributionButton = screen.getByText('Distribution').closest('button');
    const probabilityButton = screen.getByText('Probability').closest('button');

    expect(distributionButton?.getAttribute('aria-pressed')).toBe('true');
    expect(probabilityButton?.getAttribute('aria-pressed')).toBe('false');
  });

  it('marks the tab row with data-export-hide', () => {
    render(<VerificationCard {...defaultProps} />);

    const probabilityButton = screen.getByText('Probability');
    const tabBar = probabilityButton.closest('[data-export-hide]');
    expect(tabBar).toBeTruthy();
  });
});
