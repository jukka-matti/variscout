// packages/ui/src/components/OutcomeNoMatchBanner/__tests__/OutcomeNoMatchBanner.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ColumnAnalysis } from '@variscout/core';
import { OutcomeNoMatchBanner } from '../OutcomeNoMatchBanner';

function column(name: string, type: ColumnAnalysis['type']): ColumnAnalysis {
  return {
    name,
    type,
    uniqueCount: 10,
    hasVariation: true,
    missingCount: 0,
    sampleValues: type === 'numeric' ? ['1', '2', '3'] : ['A', 'B', 'C'],
  };
}

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

  it('applies an exact numeric expected outcome without waiting for submit', () => {
    const onApplyExpectedOutcome = vi.fn();
    render(
      <OutcomeNoMatchBanner
        columns={[column('CycleTime', 'numeric'), column('Line', 'categorical')]}
        onRename={vi.fn()}
        onExpectedChange={vi.fn()}
        onApplyExpectedOutcome={onApplyExpectedOutcome}
        onSkip={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/i expected the outcome to be/i), {
      target: { value: 'CycleTime' },
    });

    expect(onApplyExpectedOutcome).toHaveBeenCalledWith('CycleTime');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows feedback when the expected outcome does not match any column', () => {
    render(
      <OutcomeNoMatchBanner
        columns={[column('CycleTime', 'numeric'), column('Line', 'categorical')]}
        onRename={vi.fn()}
        onExpectedChange={vi.fn()}
        onApplyExpectedOutcome={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/i expected the outcome to be/i), {
      target: { value: 'CycleTypo' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('No column called "CycleTypo"');
    expect(screen.getByRole('status')).toHaveTextContent('CycleTime');
  });

  it('shows feedback when the expected outcome matches a non-numeric column', () => {
    render(
      <OutcomeNoMatchBanner
        columns={[column('CycleTime', 'numeric'), column('Line', 'categorical')]}
        onRename={vi.fn()}
        onExpectedChange={vi.fn()}
        onApplyExpectedOutcome={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/i expected the outcome to be/i), {
      target: { value: 'Line' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('"Line" is not numeric');
  });

  it('emits skip on click', () => {
    const onSkip = vi.fn();
    render(<OutcomeNoMatchBanner onRename={vi.fn()} onExpectedChange={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip outcome/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
