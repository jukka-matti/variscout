import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParsingBanner } from '../ParsingBanner';

describe('ParsingBanner', () => {
  it('renders the warning count and review button when warningCount >= 3', () => {
    const onReviewAll = vi.fn();
    render(<ParsingBanner warningCount={4} onReviewAll={onReviewAll} />);
    expect(screen.getByText(/4 columns need attention/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review/i })).toBeInTheDocument();
  });

  it('fires onReviewAll when the review button is clicked', () => {
    const onReviewAll = vi.fn();
    render(<ParsingBanner warningCount={3} onReviewAll={onReviewAll} />);
    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    expect(onReviewAll).toHaveBeenCalled();
  });

  it('uses warning amber tokens', () => {
    render(<ParsingBanner warningCount={3} onReviewAll={() => {}} />);
    const banner = screen.getByTestId('parsing-banner');
    expect(banner.className).toMatch(/bg-amber-50/);
    expect(banner.className).toMatch(/text-amber-700/);
  });
});
