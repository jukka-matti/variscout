/**
 * Tests for PrioritizationMatrix — ghost dots, cause colors, nudge, highlight
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    tf: (key: string, _params: Record<string, unknown>) => key,
  }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { PrioritizationMatrix } from '../PrioritizationMatrix';
import type { MatrixIdea } from '../PrioritizationMatrix';
import type { FindingProjection } from '@variscout/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProjection(cpk: number): FindingProjection {
  return {
    baselineMean: 10,
    baselineSigma: 1,
    baselineCpk: 1.0,
    projectedMean: 10,
    projectedSigma: 0.8,
    projectedCpk: cpk,
    meanDelta: 0,
    sigmaDelta: -0.2,
    simulationParams: { meanAdjustment: 0, variationReduction: 20 },
    createdAt: '2026-04-01T00:00:00Z',
  };
}

function makeIdea(overrides: Partial<MatrixIdea> & { id: string }): MatrixIdea {
  return {
    text: `Idea ${overrides.id}`,
    timeframe: 'weeks',
    cost: { category: 'low', amount: 100, currency: '€' },
    risk: { computed: 'medium', axis1: 2, axis2: 2 },
    ...overrides,
  };
}

const defaultProps = {
  xAxis: 'cost' as const,
  yAxis: 'benefit' as const,
  colorBy: 'risk' as const,
  onToggleSelect: vi.fn(),
  onAxisChange: vi.fn(),
};

describe('PrioritizationMatrix', () => {
  // -----------------------------------------------------------------------
  // Ghost dots
  // -----------------------------------------------------------------------

  it('renders ghost dot (dashed) for idea without projection or impactOverride', () => {
    const ideas: MatrixIdea[] = [
      makeIdea({
        id: 'no-proj',
        impactOverride: 'medium', // has override → positioned on benefit axis, NOT ghost
      }),
      makeIdea({
        id: 'ghost-one',
        // no projection, no impactOverride → ghost but needs benefit position
        impactOverride: undefined,
        projection: undefined,
      }),
    ];

    // benefit axis needs impactOverride or projection for Y position.
    // ghost-one has neither, so it won't be positioned on benefit axis.
    // Switch yAxis to 'risk' so both ideas get positions.
    render(<PrioritizationMatrix {...defaultProps} yAxis="risk" ideas={ideas} />);

    // ghost-one should render as ghost
    expect(screen.getByTestId('dot-ghost-ghost-one')).toBeInTheDocument();
    // no-proj has impactOverride → not ghost (but on risk yAxis it's a regular dot)
    expect(screen.getByTestId('matrix-dot-no-proj')).toBeInTheDocument();
  });

  it('does not render ghost dot when idea has impactOverride', () => {
    const ideas: MatrixIdea[] = [
      makeIdea({
        id: 'has-override',
        impactOverride: 'high',
        projection: undefined,
      }),
    ];

    render(<PrioritizationMatrix {...defaultProps} yAxis="risk" ideas={ideas} />);

    // Should be a regular dot, not ghost
    expect(screen.getByTestId('matrix-dot-has-override')).toBeInTheDocument();
    expect(screen.queryByTestId('dot-ghost-has-override')).not.toBeInTheDocument();
  });

  it('renders solid dot for idea with projection', () => {
    const ideas: MatrixIdea[] = [
      makeIdea({
        id: 'projected',
        projection: makeProjection(1.5),
      }),
    ];

    render(<PrioritizationMatrix {...defaultProps} ideas={ideas} />);

    expect(screen.getByTestId('matrix-dot-projected')).toBeInTheDocument();
    expect(screen.queryByTestId('dot-ghost-projected')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Nudge message
  // -----------------------------------------------------------------------

  it('shows nudge message with correct count for unprojected ideas', () => {
    const ideas: MatrixIdea[] = [
      makeIdea({ id: 'a', impactOverride: undefined, projection: undefined }),
      makeIdea({ id: 'b', impactOverride: undefined, projection: undefined }),
      makeIdea({
        id: 'c',
        projection: makeProjection(1.2),
      }),
    ];

    render(<PrioritizationMatrix {...defaultProps} yAxis="risk" ideas={ideas} />);

    const nudge = screen.getByTestId('matrix-ghost-nudge');
    expect(nudge).toBeInTheDocument();
    expect(nudge.textContent).toContain('2 ideas have no projection');
  });

  it('shows singular nudge for 1 unprojected idea', () => {
    const ideas: MatrixIdea[] = [
      makeIdea({ id: 'solo', impactOverride: undefined, projection: undefined }),
    ];

    render(<PrioritizationMatrix {...defaultProps} yAxis="risk" ideas={ideas} />);

    const nudge = screen.getByTestId('matrix-ghost-nudge');
    expect(nudge.textContent).toContain('1 idea has no projection');
  });

  it('does not show nudge when all ideas have projections', () => {
    const ideas: MatrixIdea[] = [
      makeIdea({
        id: 'p1',
        projection: makeProjection(1.5),
      }),
    ];

    render(<PrioritizationMatrix {...defaultProps} ideas={ideas} />);

    expect(screen.queryByTestId('matrix-ghost-nudge')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Cause colors
  // -----------------------------------------------------------------------

  it('applies cause color from causeColors map', () => {
    const causeColors = new Map([['q1', '#ff0000']]);
    const ideas: MatrixIdea[] = [
      makeIdea({
        id: 'colored',
        questionId: 'q1',
        projection: makeProjection(1.5),
      }),
    ];

    render(<PrioritizationMatrix {...defaultProps} ideas={ideas} causeColors={causeColors} />);

    // The solid dot circle should have fill="#ff0000"
    const dotGroup = screen.getByTestId('matrix-dot-colored');
    const circles = dotGroup.querySelectorAll('circle');
    // The main dot is the last circle (after optional rings)
    const mainDot = Array.from(circles).find(c => c.getAttribute('fill') === '#ff0000');
    expect(mainDot).toBeTruthy();
  });

  it('falls back to getColor when causeColors not provided', () => {
    const ideas: MatrixIdea[] = [
      makeIdea({
        id: 'fallback',
        questionId: 'q1',
        projection: makeProjection(1.5),
      }),
    ];

    render(<PrioritizationMatrix {...defaultProps} ideas={ideas} />);

    // Without causeColors, should use risk color (medium = #f59e0b)
    const dotGroup = screen.getByTestId('matrix-dot-fallback');
    const circles = dotGroup.querySelectorAll('circle');
    const mainDot = Array.from(circles).find(c => c.getAttribute('fill') === '#f59e0b');
    expect(mainDot).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // Ghost dot click
  // -----------------------------------------------------------------------

  it('calls onGhostDotClick when ghost dot is clicked', () => {
    const onGhostDotClick = vi.fn();
    const ideas: MatrixIdea[] = [
      makeIdea({ id: 'ghost-click', impactOverride: undefined, projection: undefined }),
    ];

    render(
      <PrioritizationMatrix
        {...defaultProps}
        yAxis="risk"
        ideas={ideas}
        onGhostDotClick={onGhostDotClick}
      />
    );

    fireEvent.click(screen.getByTestId('dot-ghost-ghost-click'));
    expect(onGhostDotClick).toHaveBeenCalledWith('ghost-click');
  });

  // -----------------------------------------------------------------------
  // Cause legend
  // -----------------------------------------------------------------------

  it('shows cause-based legend when causeColors and causeLabels provided', () => {
    const causeColors = new Map([
      ['q1', '#ff0000'],
      ['q2', '#00ff00'],
    ]);
    const causeLabels = new Map([
      ['q1', 'Cause A'],
      ['q2', 'Cause B'],
    ]);
    const ideas: MatrixIdea[] = [
      makeIdea({
        id: 'x',
        questionId: 'q1',
        projection: makeProjection(1.5),
      }),
    ];

    render(
      <PrioritizationMatrix
        {...defaultProps}
        ideas={ideas}
        causeColors={causeColors}
        causeLabels={causeLabels}
      />
    );

    expect(screen.getByText('Cause A')).toBeInTheDocument();
    expect(screen.getByText('Cause B')).toBeInTheDocument();
  });
});
