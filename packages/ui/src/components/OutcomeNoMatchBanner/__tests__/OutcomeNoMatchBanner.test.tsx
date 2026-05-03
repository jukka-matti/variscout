// packages/ui/src/components/OutcomeNoMatchBanner/__tests__/OutcomeNoMatchBanner.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutcomeNoMatchBanner } from '../OutcomeNoMatchBanner';

describe('OutcomeNoMatchBanner', () => {
  it('renders the no-match warning copy', () => {
    render(<OutcomeNoMatchBanner onRename={vi.fn()} onExpectedChange={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/no clear outcome match/i)).toBeInTheDocument();
  });

  it('emits expected outcome via onExpectedChange', () => {
    const onExpectedChange = vi.fn();
    render(
      <OutcomeNoMatchBanner
        onRename={vi.fn()}
        onExpectedChange={onExpectedChange}
        onSkip={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText(/i expected the outcome to be/i), {
      target: { value: 'reject_rate' },
    });
    expect(onExpectedChange).toHaveBeenCalledWith('reject_rate');
  });

  it('emits skip on click', () => {
    const onSkip = vi.fn();
    render(<OutcomeNoMatchBanner onRename={vi.fn()} onExpectedChange={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip outcome/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
