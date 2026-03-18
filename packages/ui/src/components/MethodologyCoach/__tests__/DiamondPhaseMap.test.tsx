import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiamondPhaseMap } from '../DiamondPhaseMap';

const DIAMOND_LABELS = [
  { plain: 'First look', formal: 'Initial' },
  { plain: 'Exploring possible causes', formal: 'Diverging' },
  { plain: 'Gathering evidence', formal: 'Validating' },
  { plain: 'Identifying suspected cause', formal: 'Converging' },
];

describe('DiamondPhaseMap', () => {
  it('renders all 4 investigation phases', () => {
    render(<DiamondPhaseMap phase="initial" />);
    for (const step of DIAMOND_LABELS) {
      expect(screen.getByText(step.plain)).toBeDefined();
    }
  });

  it('highlights the current phase with font-medium', () => {
    render(<DiamondPhaseMap phase="diverging" />);
    const activeLabel = screen.getByText('Exploring possible causes');
    expect(activeLabel.className).toContain('font-medium');
  });

  it('does not highlight non-current phases with font-medium', () => {
    render(<DiamondPhaseMap phase="diverging" />);
    const inactiveLabel = screen.getByText('Gathering evidence');
    expect(inactiveLabel.className).not.toContain('font-medium');
  });

  it('shows formal term labels in muted text', () => {
    render(<DiamondPhaseMap phase="initial" />);
    for (const step of DIAMOND_LABELS) {
      const formalElement = screen.getByText(step.formal);
      expect(formalElement).toBeDefined();
      expect(formalElement.className).toContain('text-content-muted');
    }
  });

  it('renders with data-testid="diamond-phase-map"', () => {
    render(<DiamondPhaseMap phase="validating" />);
    expect(screen.getByTestId('diamond-phase-map')).toBeDefined();
  });

  it('renders without a phase prop (all steps inactive)', () => {
    render(<DiamondPhaseMap />);
    // All labels should still be present
    for (const step of DIAMOND_LABELS) {
      expect(screen.getByText(step.plain)).toBeDefined();
    }
  });

  it('treats "improving" phase as all diamond steps completed', () => {
    render(<DiamondPhaseMap phase="improving" />);
    // None of the diamond steps should have font-medium (all are past)
    for (const step of DIAMOND_LABELS) {
      const label = screen.getByText(step.plain);
      expect(label.className).not.toContain('font-medium');
    }
  });
});
