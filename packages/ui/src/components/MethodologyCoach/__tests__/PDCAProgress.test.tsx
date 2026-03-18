import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PDCAProgress } from '../PDCAProgress';
import type { Finding, FindingContext } from '@variscout/core';

const makeContext = (): FindingContext => ({
  activeFilters: {},
  cumulativeScope: null,
});

/** Create a minimal Finding for testing */
const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'f-1',
  text: 'Test finding',
  createdAt: 1000,
  context: makeContext(),
  status: 'observed',
  comments: [],
  statusChangedAt: 1000,
  ...overrides,
});

describe('PDCAProgress', () => {
  it('renders with data-testid="pdca-progress"', () => {
    render(<PDCAProgress findings={[]} />);
    expect(screen.getByTestId('pdca-progress')).toBeDefined();
  });

  it('renders all 4 PDCA step labels', () => {
    render(<PDCAProgress findings={[]} />);
    expect(screen.getByText('Plan')).toBeDefined();
    expect(screen.getByText('Do')).toBeDefined();
    expect(screen.getByText('Check')).toBeDefined();
    expect(screen.getByText('Act')).toBeDefined();
  });

  it('shows all steps as incomplete when no hypotheses or actions exist', () => {
    const { container } = render(<PDCAProgress findings={[makeFinding()]} />);
    // No green checkmarks should be present (&#9745; = checkbox with check)
    const greenChecks = container.querySelectorAll('.text-green-500');
    expect(greenChecks.length).toBe(0);
  });

  it('shows Plan as done when a finding has hypothesisId', () => {
    const findings = [makeFinding({ hypothesisId: 'h-1' })];
    const { container } = render(<PDCAProgress findings={findings} />);
    // At least one green checkmark should be present
    const greenChecks = container.querySelectorAll('.text-green-500');
    expect(greenChecks.length).toBeGreaterThanOrEqual(1);
    // Detail text should mention linked findings
    expect(screen.getByText('1 finding linked')).toBeDefined();
  });

  it('shows Do as in progress when actions exist but are not all completed', () => {
    const findings = [
      makeFinding({
        actions: [
          { id: 'a-1', text: 'Fix calibration', createdAt: 2000 },
          { id: 'a-2', text: 'Retrain staff', createdAt: 3000 },
        ],
      }),
    ];
    const { container } = render(<PDCAProgress findings={findings} />);
    // Should show amber in-progress indicator
    const amberIndicators = container.querySelectorAll('.text-amber-500');
    expect(amberIndicators.length).toBeGreaterThanOrEqual(1);
    // Should show progress detail
    expect(screen.getByText('0/2 actions done')).toBeDefined();
  });

  it('shows Do as done when all actions are completed', () => {
    const findings = [
      makeFinding({
        actions: [{ id: 'a-1', text: 'Fix calibration', createdAt: 2000, completedAt: 5000 }],
      }),
    ];
    render(<PDCAProgress findings={findings} />);
    expect(screen.getByText('1/1 actions done')).toBeDefined();
  });

  it('shows Check as done when a finding has an outcome', () => {
    const findings = [
      makeFinding({
        outcome: { effective: 'yes', verifiedAt: 9000 },
      }),
    ];
    const { container } = render(<PDCAProgress findings={findings} />);
    const greenChecks = container.querySelectorAll('.text-green-500');
    expect(greenChecks.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Act as done when a finding has outcome effective=yes', () => {
    const findings = [
      makeFinding({
        outcome: { effective: 'yes', verifiedAt: 9000 },
        status: 'resolved',
      }),
    ];
    const { container } = render(<PDCAProgress findings={findings} />);
    // Both Check and Act should be done — at least 2 green checks
    const greenChecks = container.querySelectorAll('.text-green-500');
    expect(greenChecks.length).toBeGreaterThanOrEqual(2);
  });
});
