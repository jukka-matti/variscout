// packages/ui/src/components/PrimaryScopeDimensionsSelector/__tests__/PrimaryScopeDimensionsSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PrimaryScopeDimensionsSelector } from '../PrimaryScopeDimensionsSelector';

describe('PrimaryScopeDimensionsSelector', () => {
  const cols = [
    { name: 'product_id', uniqueCount: 9 },
    { name: 'shift', uniqueCount: 3 },
    { name: 'random_col', uniqueCount: 5 },
    { name: 'lot_id', uniqueCount: 87 }, // high-cardinality flagged
  ];

  it('pre-checks suggested dimensions', () => {
    render(
      <PrimaryScopeDimensionsSelector
        columns={cols}
        suggested={['product_id', 'shift']}
        value={['product_id', 'shift']}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/product_id/)).toBeChecked();
    expect(screen.getByLabelText(/shift/)).toBeChecked();
    expect(screen.getByLabelText(/random_col/)).not.toBeChecked();
  });

  it('toggling adds/removes the column from value via onChange', () => {
    const onChange = vi.fn();
    render(
      <PrimaryScopeDimensionsSelector
        columns={cols}
        suggested={['product_id']}
        value={['product_id']}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByLabelText(/random_col/));
    expect(onChange).toHaveBeenCalledWith(['product_id', 'random_col']);
  });

  it('flags high-cardinality columns as join keys, not Pareto candidates', () => {
    render(
      <PrimaryScopeDimensionsSelector columns={cols} suggested={[]} value={[]} onChange={vi.fn()} />
    );
    expect(screen.getByText(/join key, not pareto candidate/i)).toBeInTheDocument();
  });

  it('skip emits onSkip', () => {
    const onSkip = vi.fn();
    render(
      <PrimaryScopeDimensionsSelector
        columns={cols}
        suggested={[]}
        value={[]}
        onChange={vi.fn()}
        onSkip={onSkip}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
