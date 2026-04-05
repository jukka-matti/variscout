import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConclusionCard from '../ConclusionCard';
import type { SuspectedCause, HubProjection } from '@variscout/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHub(
  id: string,
  name: string,
  status: SuspectedCause['status'] = 'suspected'
): SuspectedCause {
  return {
    id,
    name,
    status,
    questionIds: [],
    findingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synthesis: '',
    selectedForImprovement: false,
  };
}

function makeProjection(delta: number, rSquaredAdj: number): HubProjection {
  return {
    predictedMeanDelta: delta,
    predictedMean: 12.0 + delta,
    currentMean: 12.0,
    rSquaredAdj,
    levelChanges: [],
    label: 'Model suggests',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConclusionCard', () => {
  it('renders nothing when no causes and no hubs', () => {
    const { container } = render(<ConclusionCard suspectedCauses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders hub names with evidence badges', () => {
    const hubs = [makeHub('h1', 'Night shift effect')];
    const evidence = new Map([
      [
        'h1',
        {
          contribution: { label: 'R²adj', value: 0.38, description: 'Explains 38% of variation' },
          mode: 'standard' as const,
        },
      ],
    ]);

    render(<ConclusionCard suspectedCauses={[]} hubs={hubs} hubEvidences={evidence} />);

    expect(screen.getByText('Night shift effect')).toBeInTheDocument();
    expect(screen.getByText('R²adj 38%')).toBeInTheDocument();
  });

  it('renders hub projection when provided', () => {
    const hubs = [makeHub('h1', 'Night shift effect')];
    const projections = new Map([['h1', makeProjection(-1.8, 0.38)]]);

    render(<ConclusionCard suspectedCauses={[]} hubs={hubs} hubProjections={projections} />);

    const projectionEl = screen.getByTestId('conclusion-hub-projection-h1');
    expect(projectionEl).toBeInTheDocument();
    expect(projectionEl.textContent).toContain('Model suggests');
    expect(projectionEl.textContent).toContain('-1.8');
    expect(projectionEl.textContent).toContain('R²adj 38%');
  });

  it('renders positive delta with + sign', () => {
    const hubs = [makeHub('h1', 'Head alignment')];
    const projections = new Map([['h1', makeProjection(0.5, 0.22)]]);

    render(<ConclusionCard suspectedCauses={[]} hubs={hubs} hubProjections={projections} />);

    const projectionEl = screen.getByTestId('conclusion-hub-projection-h1');
    expect(projectionEl.textContent).toContain('+0.5');
  });

  it('omits projection when hub has no projection data', () => {
    const hubs = [makeHub('h1', 'Unmapped hub')];
    const projections = new Map<string, HubProjection>(); // empty map

    render(<ConclusionCard suspectedCauses={[]} hubs={hubs} hubProjections={projections} />);

    expect(screen.queryByTestId('conclusion-hub-projection-h1')).not.toBeInTheDocument();
  });

  it('renders legacy chip model when no hubs provided', () => {
    render(
      <ConclusionCard
        suspectedCauses={[{ factor: 'Machine', projectedCpk: 1.2 }]}
        currentCpk={0.9}
      />
    );

    expect(screen.getByText('Machine')).toBeInTheDocument();
  });
});
