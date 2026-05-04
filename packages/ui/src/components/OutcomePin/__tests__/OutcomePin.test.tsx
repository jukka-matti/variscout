// packages/ui/src/components/OutcomePin/__tests__/OutcomePin.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutcomePin } from '../OutcomePin';

const baseOutcome = {
  columnName: 'weight_g',
  characteristicType: 'nominalIsBest' as const,
};
const stats = { mean: 4.5, sigma: 0.1, n: 1842 };

describe('OutcomePin', () => {
  it('with full specs: renders Cpk badge', () => {
    render(
      <OutcomePin
        outcome={{ ...baseOutcome, target: 4.5, lsl: 4.2, usl: 4.8, cpkTarget: 1.33 }}
        stats={stats}
        onAddSpecs={vi.fn()}
      />
    );
    expect(screen.getByText(/cpk/i)).toBeInTheDocument();
  });

  it('without specs: renders mean ± σ + n + Add specs chip', () => {
    render(<OutcomePin outcome={baseOutcome} stats={stats} onAddSpecs={vi.fn()} />);
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/n=1842/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add specs/i })).toBeInTheDocument();
  });

  it('clicking Add specs fires onAddSpecs with column name', () => {
    const onAddSpecs = vi.fn();
    render(<OutcomePin outcome={baseOutcome} stats={stats} onAddSpecs={onAddSpecs} />);
    fireEvent.click(screen.getByRole('button', { name: /add specs/i }));
    expect(onAddSpecs).toHaveBeenCalledWith('weight_g');
  });

  it('with n<10: shows trust pending instead of Cpk', () => {
    render(
      <OutcomePin
        outcome={{ ...baseOutcome, target: 4.5, lsl: 4.2, usl: 4.8 }}
        stats={{ mean: 4.5, sigma: 0.1, n: 5 }}
        onAddSpecs={vi.fn()}
      />
    );
    expect(screen.getByText(/trust pending|n<10/i)).toBeInTheDocument();
  });
});
