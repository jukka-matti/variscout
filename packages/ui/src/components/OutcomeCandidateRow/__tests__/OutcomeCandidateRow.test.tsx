// packages/ui/src/components/OutcomeCandidateRow/__tests__/OutcomeCandidateRow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutcomeCandidateRow } from '../OutcomeCandidateRow';

const baseCandidate = {
  columnName: 'weight_g',
  type: 'continuous' as const,
  characteristicType: 'nominalIsBest' as const,
  values: [4.5, 4.4, 4.6, 4.5, 4.4],
  matchScore: 0.92,
  goalKeywordMatch: 'weight',
  qualityReport: { validCount: 5, invalidCount: 0, missingCount: 0 },
};

describe('OutcomeCandidateRow', () => {
  it('unselected: renders checkbox + name + sparkline + quality + match — no spec inputs', () => {
    render(
      <OutcomeCandidateRow
        candidate={baseCandidate}
        isSelected={false}
        onToggleSelect={vi.fn()}
        specs={{}}
        onSpecsChange={vi.fn()}
      />
    );
    expect(screen.getByText('weight_g')).toBeInTheDocument();
    expect(screen.queryByLabelText(/target/i)).not.toBeInTheDocument();
  });

  it('selected: shows inline spec inputs with empty LSL/USL placeholders', () => {
    render(
      <OutcomeCandidateRow
        candidate={baseCandidate}
        isSelected
        onToggleSelect={vi.fn()}
        specs={{}}
        onSpecsChange={vi.fn()}
      />
    );
    const lsl = screen.getByLabelText(/lsl/i) as HTMLInputElement;
    const usl = screen.getByLabelText(/usl/i) as HTMLInputElement;
    expect(lsl.placeholder).toMatch(/from customer spec/i);
    expect(usl.placeholder).toMatch(/from customer spec/i);
  });

  it('disables LSL when characteristicType is smallerIsBetter', () => {
    const c = { ...baseCandidate, characteristicType: 'smallerIsBetter' as const };
    render(
      <OutcomeCandidateRow
        candidate={c}
        isSelected
        onToggleSelect={vi.fn()}
        specs={{}}
        onSpecsChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/lsl/i)).toBeDisabled();
  });

  it('disables USL when characteristicType is largerIsBetter', () => {
    const c = { ...baseCandidate, characteristicType: 'largerIsBetter' as const };
    render(
      <OutcomeCandidateRow
        candidate={c}
        isSelected
        onToggleSelect={vi.fn()}
        specs={{}}
        onSpecsChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/usl/i)).toBeDisabled();
  });

  it('emits onSpecsChange when target changes', () => {
    const onSpecsChange = vi.fn();
    render(
      <OutcomeCandidateRow
        candidate={baseCandidate}
        isSelected
        onToggleSelect={vi.fn()}
        specs={{}}
        onSpecsChange={onSpecsChange}
      />
    );
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: '4.50' } });
    expect(onSpecsChange).toHaveBeenCalledWith(expect.objectContaining({ target: 4.5 }));
  });

  it('clicking checkbox emits onToggleSelect', () => {
    const onToggleSelect = vi.fn();
    render(
      <OutcomeCandidateRow
        candidate={baseCandidate}
        isSelected={false}
        onToggleSelect={onToggleSelect}
        specs={{}}
        onSpecsChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /weight_g/i }));
    expect(onToggleSelect).toHaveBeenCalled();
  });
});
