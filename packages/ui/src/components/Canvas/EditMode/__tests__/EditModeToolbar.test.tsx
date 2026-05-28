import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditModeToolbar } from '../EditModeToolbar';
import type { OutcomeSpec } from '@variscout/core/processHub';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';

// ─── Minimal fixtures ──────────────────────────────────────────────────────────

function makeOutcomeSpec(columnName: string): OutcomeSpec {
  return {
    id: `os-${columnName}`,
    hubId: 'hub-1',
    columnName,
    characteristicType: 'nominalIsBest',
    createdAt: 0,
    deletedAt: null,
  };
}

function makeFactorControl(factor: string): ImprovementProjectFactorControl {
  return { factor, targetCondition: 'any' };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('EditModeToolbar', () => {
  it('renders a toolbar container with role="toolbar" and aria-label="Edit mode toolbar"', () => {
    render(<EditModeToolbar steps={[]} />);
    expect(screen.getByRole('toolbar', { name: 'Edit mode toolbar' })).toBeInTheDocument();
  });

  it('renders a single visible button with text containing "+ Capture step timings"', () => {
    render(<EditModeToolbar steps={[]} />);
    expect(screen.getByRole('button', { name: /\+ Capture step timings/i })).toBeInTheDocument();
  });

  it('button is disabled when steps.length === 0', () => {
    render(<EditModeToolbar steps={[]} />);
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).toBeDisabled();
  });

  it('button has title="Add steps first" when disabled', () => {
    render(<EditModeToolbar steps={[]} />);
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).toHaveAttribute('title', 'Add steps first');
  });

  it('button is enabled when steps.length >= 1', () => {
    render(<EditModeToolbar steps={[{ id: 's1', name: 'Mix', order: 0 }]} />);
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls onCaptureStepTimings when button is clicked with steps present', () => {
    const onCaptureStepTimings = vi.fn();
    render(
      <EditModeToolbar
        steps={[{ id: 's1', name: 'Mix', order: 0 }]}
        onCaptureStepTimings={onCaptureStepTimings}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /\+ Capture step timings/i }));
    expect(onCaptureStepTimings).toHaveBeenCalledTimes(1);
  });

  it('does NOT render unrelated toolbar buttons (+ Goal narrative, + Issue / question)', () => {
    render(<EditModeToolbar steps={[]} />);
    expect(screen.queryByRole('button', { name: /goal narrative/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /issue.*question/i })).not.toBeInTheDocument();
  });

  // ─── ExploreExitButton integration tests (F1 Task 3) ────────────────────────

  it('renders the → Explore button (Exit to Explore aria-label) at the toolbar right edge', () => {
    render(<EditModeToolbar steps={[]} />);
    expect(screen.getByRole('button', { name: /Exit to Explore/i })).toBeInTheDocument();
  });

  it('→ Explore button is disabled when outcomeSpecs is omitted', () => {
    render(<EditModeToolbar steps={[]} />);
    expect(screen.getByRole('button', { name: /Exit to Explore/i })).toBeDisabled();
  });

  it('→ Explore button is disabled when outcomeSpecs is empty array', () => {
    render(<EditModeToolbar steps={[]} outcomeSpecs={[]} />);
    expect(screen.getByRole('button', { name: /Exit to Explore/i })).toBeDisabled();
  });

  it('→ Explore button is enabled when outcomeSpecs has 1+ entries', () => {
    render(<EditModeToolbar steps={[]} outcomeSpecs={[makeOutcomeSpec('Yield')]} />);
    expect(screen.getByRole('button', { name: /Exit to Explore/i })).not.toBeDisabled();
  });

  it('click fires onExploreExit callback with the derived landing shape', () => {
    const onExploreExit = vi.fn();
    render(
      <EditModeToolbar
        steps={[]}
        outcomeSpecs={[makeOutcomeSpec('Yield')]}
        factorControls={[makeFactorControl('Vessel')]}
        onExploreExit={onExploreExit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Exit to Explore/i }));

    expect(onExploreExit).toHaveBeenCalledTimes(1);
    expect(onExploreExit).toHaveBeenCalledWith(
      expect.objectContaining({
        isEnabled: true,
        routeKey: 'y-plus-one-factor',
        boxplotFactor: 'Vessel',
      })
    );
  });

  it('click is a no-op (no crash) when onExploreExit is omitted and outcomeSpecs populated', () => {
    render(
      <EditModeToolbar
        steps={[]}
        outcomeSpecs={[makeOutcomeSpec('Yield')]}
        // intentionally no onExploreExit
      />
    );
    // Should not throw
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /Exit to Explore/i }));
    }).not.toThrow();
  });
});
