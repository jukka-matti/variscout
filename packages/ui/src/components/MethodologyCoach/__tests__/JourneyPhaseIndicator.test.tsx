import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { JourneyPhase } from '@variscout/core';
import { JourneyPhaseIndicator } from '../JourneyPhaseIndicator';

const ALL_PHASES: JourneyPhase[] = ['frame', 'scout', 'investigate', 'improve'];
const PHASE_LABELS: Record<JourneyPhase, string> = {
  frame: 'Frame',
  scout: 'Scout',
  investigate: 'Investigate',
  improve: 'Improve',
};

describe('JourneyPhaseIndicator', () => {
  it('renders all 4 phase labels', () => {
    render(<JourneyPhaseIndicator phase="frame" />);
    for (const phase of ALL_PHASES) {
      expect(screen.getByText(PHASE_LABELS[phase])).toBeDefined();
    }
  });

  ALL_PHASES.forEach(phase => {
    it(`highlights the "${phase}" phase with font-medium class`, () => {
      render(<JourneyPhaseIndicator phase={phase} />);
      const label = screen.getByText(PHASE_LABELS[phase]);
      // The current phase label should have font-medium styling
      expect(label.className).toContain('font-medium');

      // Other phase labels should NOT have font-medium
      const otherPhases = ALL_PHASES.filter(p => p !== phase);
      for (const other of otherPhases) {
        const otherLabel = screen.getByText(PHASE_LABELS[other]);
        expect(otherLabel.className).not.toContain('font-medium');
      }
    });
  });

  it('renders with data-testid="journey-phase-indicator"', () => {
    render(<JourneyPhaseIndicator phase="scout" />);
    expect(screen.getByTestId('journey-phase-indicator')).toBeDefined();
  });

  it('shows the phase description text', () => {
    render(<JourneyPhaseIndicator phase="scout" />);
    expect(screen.getByText('Exploring patterns')).toBeDefined();
  });
});
