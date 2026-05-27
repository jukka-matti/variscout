import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AnalyzePhase } from '@variscout/core';
import { AnalyzePhaseBadge } from '../AnalyzePhaseBadge';

const phases: { phase: AnalyzePhase; label: string }[] = [
  { phase: 'initial', label: 'Initial' },
  { phase: 'diverging', label: 'Diverging' },
  { phase: 'validating', label: 'Validating' },
  { phase: 'converging', label: 'Converging' },
  { phase: 'improving', label: 'Improving' },
];

describe('AnalyzePhaseBadge', () => {
  phases.forEach(({ phase, label }) => {
    it(`renders "${label}" label for phase "${phase}"`, () => {
      render(<AnalyzePhaseBadge phase={phase} />);
      expect(screen.getByText(label)).toBeDefined();
    });

    it(`has data-testid="analyze-phase-badge" for phase "${phase}"`, () => {
      render(<AnalyzePhaseBadge phase={phase} />);
      expect(screen.getByTestId('analyze-phase-badge')).toBeDefined();
    });
  });
});
