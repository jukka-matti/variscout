import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  // Bug 2 fix: CTAs are hidden when no handler is provided (per hidden-vs-disabled
  // repo feedback rule — hide unwired CTAs entirely, never tease "Coming soon").
  // Before the fix, both buttons rendered unconditionally → onClick={undefined} no-ops.

  it('renders "Write…" button ONLY when onWriteHypothesis is provided', () => {
    // Without handler: hidden
    const { rerender } = render(<EmptyState />);
    expect(
      screen.queryByRole('button', { name: /add a suspected cause/i })
    ).not.toBeInTheDocument();

    // With handler: visible
    rerender(<EmptyState onWriteHypothesis={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add a suspected cause/i })).toBeInTheDocument();
  });

  it('renders "Seed…" button ONLY when onSeedFromFactorIntel is provided', () => {
    // Without handler: hidden (LOAD-BEARING negative control — fails if gating is dropped)
    const { rerender } = render(<EmptyState />);
    expect(
      screen.queryByRole('button', { name: /seed 3 largest contributors/i })
    ).not.toBeInTheDocument();

    // With handler: visible
    rerender(<EmptyState onSeedFromFactorIntel={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /seed 3 largest contributors/i })
    ).toBeInTheDocument();
  });

  it('never renders "promote from a question" button (IM-1 retirement)', () => {
    render(<EmptyState onWriteHypothesis={vi.fn()} onSeedFromFactorIntel={vi.fn()} />);
    expect(
      screen.queryByRole('button', { name: /promote from a question/i })
    ).not.toBeInTheDocument();
  });

  it('fires onWriteHypothesis when the button is clicked', () => {
    const fn = vi.fn();
    render(<EmptyState onWriteHypothesis={fn} />);
    fireEvent.click(screen.getByRole('button', { name: /add a suspected cause/i }));
    expect(fn).toHaveBeenCalled();
  });

  it('fires onSeedFromFactorIntel when the button is clicked', () => {
    const fn = vi.fn();
    render(<EmptyState onSeedFromFactorIntel={fn} />);
    fireEvent.click(screen.getByRole('button', { name: /seed 3 largest contributors/i }));
    expect(fn).toHaveBeenCalled();
  });
});
