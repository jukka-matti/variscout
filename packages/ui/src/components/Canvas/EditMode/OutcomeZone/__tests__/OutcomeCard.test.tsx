import { describe, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { createTestOutcomeSpec } from '../../../../../test-utils/outcomeSpec';
import { OutcomeCard } from '../OutcomeCard';

describe('OutcomeCard', () => {
  it('renders columnName, direction indicator, and spec pills', () => {
    render(
      <OutcomeCard
        spec={createTestOutcomeSpec({
          columnName: 'Diameter',
          characteristicType: 'nominalIsBest',
          target: 10,
          lsl: 9.5,
          usl: 10.5,
          cpkTarget: 1.33,
        })}
        onSpecsClick={vi.fn()}
      />
    );
    expect(screen.getByText('Diameter')).toBeInTheDocument();
    expect(screen.getByText('=')).toBeInTheDocument();
    expect(screen.getByText(/target: 10/)).toBeInTheDocument();
    expect(screen.getByText(/LSL: 9.5/)).toBeInTheDocument();
    expect(screen.getByText(/USL: 10.5/)).toBeInTheDocument();
    expect(screen.getByText(/Cpk: 1.33/)).toBeInTheDocument();
  });

  it('renders ↓ for smallerIsBetter', () => {
    render(
      <OutcomeCard
        spec={createTestOutcomeSpec({ characteristicType: 'smallerIsBetter' })}
        onSpecsClick={vi.fn()}
      />
    );
    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('renders ↑ for largerIsBetter', () => {
    render(
      <OutcomeCard
        spec={createTestOutcomeSpec({ characteristicType: 'largerIsBetter' })}
        onSpecsClick={vi.fn()}
      />
    );
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('renders em-dash for missing spec values', () => {
    render(
      <OutcomeCard
        spec={createTestOutcomeSpec({ target: undefined, lsl: undefined, usl: undefined })}
        onSpecsClick={vi.fn()}
      />
    );
    expect(screen.getByText(/target: —/)).toBeInTheDocument();
    expect(screen.getByText(/LSL: —/)).toBeInTheDocument();
    expect(screen.getByText(/USL: —/)).toBeInTheDocument();
  });

  it('clicking ⚙ fires onSpecsClick with anchor from getBoundingClientRect', () => {
    const onSpecsClick = vi.fn();
    render(<OutcomeCard spec={createTestOutcomeSpec()} onSpecsClick={onSpecsClick} />);
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    expect(onSpecsClick).toHaveBeenCalledTimes(1);
    expect(onSpecsClick).toHaveBeenCalledWith(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
    );
  });

  it('renders ExploreJumpButton labeled with columnName when onExploreJumpClick is provided', () => {
    render(
      <OutcomeCard
        spec={createTestOutcomeSpec({ columnName: 'Diameter' })}
        onSpecsClick={vi.fn()}
        onExploreJumpClick={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /open diameter in explore/i })).toBeInTheDocument();
  });

  it('does NOT render ExploreJumpButton when onExploreJumpClick is undefined', () => {
    render(
      <OutcomeCard
        spec={createTestOutcomeSpec({ columnName: 'Diameter' })}
        onSpecsClick={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /open diameter in explore/i })).toBeNull();
  });

  it('clicking ExploreJumpButton fires onExploreJumpClick (and does NOT fire onSpecsClick)', () => {
    const onExploreJumpClick = vi.fn();
    const onSpecsClick = vi.fn();
    render(
      <OutcomeCard
        spec={createTestOutcomeSpec({ columnName: 'Diameter' })}
        onSpecsClick={onSpecsClick}
        onExploreJumpClick={onExploreJumpClick}
      />
    );
    fireEvent.click(screen.getByTestId('chip-explore-jump'));
    expect(onExploreJumpClick).toHaveBeenCalledTimes(1);
    expect(onSpecsClick).not.toHaveBeenCalled();
  });
});

describe('OutcomeCard scope visualization (LV1-G)', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
  });

  it('renders baseline (no active border / no ✓) when scope is empty', () => {
    const { container } = render(
      <OutcomeCard spec={createTestOutcomeSpec({ columnName: 'yield' })} onSpecsClick={vi.fn()} />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toMatch(/border-green-600/);
    expect(root.className).not.toMatch(/opacity-50/);
    expect(screen.queryByText('✓')).toBeNull();
  });

  it('renders active styling when scope.yColumn matches columnName', () => {
    useAnalysisScopeStore.getState().setY('yield');
    const { container } = render(
      <OutcomeCard spec={createTestOutcomeSpec({ columnName: 'yield' })} onSpecsClick={vi.fn()} />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/border-green-600/);
    expect(root.className).toMatch(/ring-green-500\/30/);
    expect(root.className).toMatch(/bg-green-50/);
    expect(root.className).not.toMatch(/opacity-50/);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('dims when scope is non-empty AND columnName does not match yColumn', () => {
    useAnalysisScopeStore.getState().setY('temperature');
    const { container } = render(
      <OutcomeCard spec={createTestOutcomeSpec({ columnName: 'yield' })} onSpecsClick={vi.fn()} />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/opacity-50/);
    expect(root.className).not.toMatch(/border-green-600/);
    expect(screen.queryByText('✓')).toBeNull();
  });
});
