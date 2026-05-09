import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HypothesisCard } from '../HypothesisCard';
import type { Hypothesis } from '@variscout/core';

const hub: Hypothesis = {
  id: 'h-1',
  name: 'Test Hypothesis',
  synthesis: '',
  questionIds: [],
  findingIds: ['f1', 'f2'],
  disconfirmationAttempts: [],
  status: 'evidenced',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-test',
};

describe('HypothesisCard renders derived status', () => {
  it('shows needs-disconfirmation border + 1-step-away badge at full LOD', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="needs-disconfirmation" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/1 step away/i)).toBeInTheDocument();
  });

  it('does not show 1-step-away badge at glyph LOD', () => {
    render(
      <svg>
        <HypothesisCard
          hub={hub}
          displayStatus="needs-disconfirmation"
          x={0}
          y={0}
          zoomScale={0.2}
        />
      </svg>
    );
    expect(screen.queryByText(/1 step away/i)).toBeNull();
  });

  it('does not show 1-step-away badge at medium LOD', () => {
    render(
      <svg>
        <HypothesisCard
          hub={hub}
          displayStatus="needs-disconfirmation"
          x={0}
          y={0}
          zoomScale={0.5}
        />
      </svg>
    );
    expect(screen.queryByText(/1 step away/i)).toBeNull();
  });

  it('does not show 1-step-away badge when displayStatus is not needs-disconfirmation', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} />
      </svg>
    );
    expect(screen.queryByText(/1 step away/i)).toBeNull();
  });

  it('suppresses openChecksLabel when displayStatus is needs-disconfirmation at full LOD', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="needs-disconfirmation" x={0} y={0} />
      </svg>
    );
    // Badge replaces the open-checks row — both cannot appear simultaneously.
    expect(screen.queryByText(/open check/i)).toBeNull();
  });

  it('shows openChecksLabel when displayStatus is evidenced at full LOD', () => {
    const hubWithChecks = { ...hub, questionIds: ['q1', 'q2'] };
    render(
      <svg>
        <HypothesisCard hub={hubWithChecks} displayStatus="evidenced" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/open check/i)).toBeInTheDocument();
  });
});
