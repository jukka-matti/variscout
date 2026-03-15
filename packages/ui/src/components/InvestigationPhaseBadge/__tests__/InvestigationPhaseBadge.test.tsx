import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { InvestigationPhase } from '@variscout/core';
import { InvestigationPhaseBadge } from '../InvestigationPhaseBadge';

const phases: { phase: InvestigationPhase; label: string }[] = [
  { phase: 'initial', label: 'Initial' },
  { phase: 'diverging', label: 'Diverging' },
  { phase: 'validating', label: 'Validating' },
  { phase: 'converging', label: 'Converging' },
  { phase: 'acting', label: 'Acting' },
];

describe('InvestigationPhaseBadge', () => {
  phases.forEach(({ phase, label }) => {
    it(`renders "${label}" label for phase "${phase}"`, () => {
      render(<InvestigationPhaseBadge phase={phase} />);
      expect(screen.getByText(label)).toBeDefined();
    });

    it(`has data-testid="investigation-phase-badge" for phase "${phase}"`, () => {
      render(<InvestigationPhaseBadge phase={phase} />);
      expect(screen.getByTestId('investigation-phase-badge')).toBeDefined();
    });
  });
});
