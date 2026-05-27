import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
