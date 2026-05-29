// packages/ui/src/components/Explore/ScopeChrome/__tests__/EmptyStateHint.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyStateHint } from '../EmptyStateHint';

describe('EmptyStateHint', () => {
  it('renders the canonical hint copy (in pieces because the button splits the sentence)', () => {
    render(<EmptyStateHint />);
    // The string is split across text nodes by the inline <button>; assert
    // each substring separately rather than the full sentence.
    expect(screen.getByText(/No outcome selected\./)).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-hint-process-link')).toHaveTextContent(
      'Go to Process tab'
    );
    expect(screen.getByText(/to pick a measure\./)).toBeInTheDocument();
  });

  it('invokes onNavigateToProcess when the Process link is clicked', () => {
    const onNavigateToProcess = vi.fn();
    render(<EmptyStateHint onNavigateToProcess={onNavigateToProcess} />);
    fireEvent.click(screen.getByTestId('empty-state-hint-process-link'));
    expect(onNavigateToProcess).toHaveBeenCalledTimes(1);
  });
});
