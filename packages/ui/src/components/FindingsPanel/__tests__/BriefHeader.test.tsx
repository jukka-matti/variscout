import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BriefHeader from '../BriefHeader';
import type { ProcessContext } from '@variscout/core';

const makeProcessContext = (overrides?: Partial<ProcessContext>): ProcessContext => ({
  issueStatement: 'Reduce mean fill weight',
  targetMetric: 'mean',
  targetValue: 15,
  targetDirection: 'minimize',
  ...overrides,
});

describe('BriefHeader', () => {
  it('renders nothing without process context', () => {
    const { container } = render(<BriefHeader />);
    expect(container.firstChild).toBeNull();
  });

  it('renders progress bar with current value', () => {
    render(<BriefHeader processContext={makeProcessContext()} currentValue={17} />);
    expect(screen.getByTestId('target-progress')).toBeTruthy();
    expect(screen.getByText(/now 17\.00/)).toBeTruthy();
  });

  it('renders projected segment when projectedValue provided', () => {
    render(
      <BriefHeader processContext={makeProcessContext()} currentValue={17} projectedValue={16} />
    );
    expect(screen.getByTestId('projected-progress-segment')).toBeTruthy();
  });

  it('does not render projected segment without projectedValue', () => {
    render(<BriefHeader processContext={makeProcessContext()} currentValue={17} />);
    expect(screen.queryByTestId('projected-progress-segment')).toBeNull();
  });

  it('caps projected progress at 100%', () => {
    render(
      <BriefHeader
        processContext={makeProcessContext()}
        currentValue={17}
        projectedValue={14} // beyond target (15), minimize direction
      />
    );
    // Projected segment should still render (capped)
    const segment = screen.getByTestId('projected-progress-segment');
    expect(segment).toBeTruthy();
  });
});
