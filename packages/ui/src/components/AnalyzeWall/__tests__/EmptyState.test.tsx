import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders two CTAs (IM-1: promote-from-question removed)', () => {
    render(<EmptyState />);
    expect(
      screen.getByRole('button', { name: /write a suspected mechanism/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /seed.*factor intel/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /promote from a question/i })
    ).not.toBeInTheDocument();
  });

  it('fires onWriteHypothesis', () => {
    const fn = vi.fn();
    render(<EmptyState onWriteHypothesis={fn} />);
    fireEvent.click(screen.getByRole('button', { name: /write a suspected mechanism/i }));
    expect(fn).toHaveBeenCalled();
  });

  it('fires onSeedFromFactorIntel', () => {
    const fn = vi.fn();
    render(<EmptyState onSeedFromFactorIntel={fn} />);
    fireEvent.click(screen.getByRole('button', { name: /seed 3 from factor intelligence/i }));
    expect(fn).toHaveBeenCalled();
  });
});
