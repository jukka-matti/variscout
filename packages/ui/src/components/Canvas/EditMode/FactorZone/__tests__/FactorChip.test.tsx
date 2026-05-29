import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestFactorControl } from '../../../../../test-utils/factorControl';
import { FactorChip } from '../FactorChip';

describe('FactorChip', () => {
  it('renders factor name + target-condition pill', () => {
    render(
      <FactorChip
        control={createTestFactorControl({ factor: 'Temperature', targetCondition: '120 ± 5°C' })}
        onSpecsClick={vi.fn()}
      />
    );
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText(/120 ± 5°C/)).toBeInTheDocument();
  });

  it('renders global binding pill when stepId undefined', () => {
    render(
      <FactorChip control={createTestFactorControl({ stepId: undefined })} onSpecsClick={vi.fn()} />
    );
    expect(screen.getByText(/global/i)).toBeInTheDocument();
    expect(screen.queryByText(/^step /i)).not.toBeInTheDocument();
  });

  it('renders step-bound pill when stepId set', () => {
    render(
      <FactorChip control={createTestFactorControl({ stepId: 's-mix' })} onSpecsClick={vi.fn()} />
    );
    expect(screen.getByText(/step s-mix/i)).toBeInTheDocument();
    expect(screen.queryByText(/^global$/i)).not.toBeInTheDocument();
  });

  it('renders em-dash for missing target condition', () => {
    render(
      <FactorChip
        control={createTestFactorControl({ targetCondition: '' })}
        onSpecsClick={vi.fn()}
      />
    );
    expect(screen.getByText(/—/)).toBeInTheDocument();
  });

  it('clicking ⚙ fires onSpecsClick with anchor from getBoundingClientRect', () => {
    const onSpecsClick = vi.fn();
    render(<FactorChip control={createTestFactorControl()} onSpecsClick={onSpecsClick} />);
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    expect(onSpecsClick).toHaveBeenCalledTimes(1);
    expect(onSpecsClick).toHaveBeenCalledWith(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
    );
  });

  it('renders ExploreJumpButton labeled with factor when onExploreJumpClick is provided', () => {
    render(
      <FactorChip
        control={createTestFactorControl({ factor: 'Vessel' })}
        onSpecsClick={vi.fn()}
        onExploreJumpClick={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /open vessel in explore/i })).toBeInTheDocument();
  });

  it('does NOT render ExploreJumpButton when onExploreJumpClick is undefined', () => {
    render(
      <FactorChip control={createTestFactorControl({ factor: 'Vessel' })} onSpecsClick={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /open vessel in explore/i })).toBeNull();
  });

  it('clicking ExploreJumpButton fires onExploreJumpClick (and does NOT fire onSpecsClick)', () => {
    const onExploreJumpClick = vi.fn();
    const onSpecsClick = vi.fn();
    render(
      <FactorChip
        control={createTestFactorControl({ factor: 'Vessel' })}
        onSpecsClick={onSpecsClick}
        onExploreJumpClick={onExploreJumpClick}
      />
    );
    fireEvent.click(screen.getByTestId('chip-explore-jump'));
    expect(onExploreJumpClick).toHaveBeenCalledTimes(1);
    expect(onSpecsClick).not.toHaveBeenCalled();
  });
});
