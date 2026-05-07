import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { CanvasStepCardModel } from '@variscout/hooks';
import type { WorkflowReadinessSignals } from '@variscout/core';
import { CanvasStepOverlay } from '../CanvasStepOverlay';

const baseCard: CanvasStepCardModel = {
  stepId: 'step-1',
  stepName: 'Bake step',
  metricKind: 'numeric',
  metricColumn: 'Bake_Time',
  assignedColumns: ['Bake_Time'],
  capability: { state: 'no-specs', n: 12 },
  distribution: [],
  defectCount: undefined,
  stats: { mean: 1.0, stdDev: 0.1 },
};

const emptySignals: WorkflowReadinessSignals = {
  hasIntervention: false,
  sustainmentConfirmed: false,
};

function renderOverlay(overrides: Partial<React.ComponentProps<typeof CanvasStepOverlay>> = {}) {
  return render(
    <CanvasStepOverlay
      card={baseCard}
      onClose={() => undefined}
      signals={emptySignals}
      onQuickAction={() => undefined}
      onFocusedInvestigation={() => undefined}
      onCharter={() => undefined}
      onSustainment={() => undefined}
      onHandoff={() => undefined}
      {...overrides}
    />
  );
}

describe('CanvasStepOverlay — response-path CTA rendering', () => {
  it('renders all five CTAs when handlers wired and prerequisites met', () => {
    renderOverlay({
      signals: { hasIntervention: true, sustainmentConfirmed: true },
    });
    for (const path of [
      'quick-action',
      'focused-investigation',
      'charter',
      'sustainment',
      'handoff',
    ]) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'active');
      expect(cta).not.toBeDisabled();
    }
  });

  it('renders quick-action and focused-investigation as active even when other paths have unmet prerequisites', () => {
    renderOverlay(); // emptySignals
    for (const path of ['quick-action', 'focused-investigation']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'active');
      expect(cta).not.toBeDisabled();
    }
  });

  it('renders Charter as active regardless of signals (DMAIC Define-phase, no prerequisite)', () => {
    renderOverlay(); // emptySignals
    const cta = screen.getByTestId('canvas-cta-charter');
    expect(cta).toHaveAttribute('data-cta-state', 'active');
    expect(cta).not.toBeDisabled();
  });

  it('renders Sustainment as prerequisite-locked when no intervention exists', () => {
    renderOverlay();
    const cta = screen.getByTestId('canvas-cta-sustainment');
    expect(cta).toHaveAttribute('data-cta-state', 'prerequisite-locked');
    expect(cta).toHaveAttribute('data-cta-reason', 'no-intervention');
    expect(cta).toBeDisabled();
    expect(cta.getAttribute('title')).toMatch(/process change to monitor/i);
  });

  it('renders Handoff as prerequisite-locked when sustainment not confirmed', () => {
    renderOverlay({ signals: { hasIntervention: true, sustainmentConfirmed: false } });
    const cta = screen.getByTestId('canvas-cta-handoff');
    expect(cta).toHaveAttribute('data-cta-state', 'prerequisite-locked');
    expect(cta).toHaveAttribute('data-cta-reason', 'no-sustainment-confirmed');
    expect(cta).toBeDisabled();
    expect(cta.getAttribute('title')).toMatch(/sustainment monitoring confirms gains/i);
  });

  it('hides any CTA whose handler is not wired', () => {
    renderOverlay({
      signals: { hasIntervention: true, sustainmentConfirmed: true },
      onCharter: undefined,
      onSustainment: undefined,
      onHandoff: undefined,
    });
    expect(screen.queryByTestId('canvas-cta-charter')).toBeNull();
    expect(screen.queryByTestId('canvas-cta-sustainment')).toBeNull();
    expect(screen.queryByTestId('canvas-cta-handoff')).toBeNull();
    expect(screen.queryByTestId('canvas-cta-quick-action')).not.toBeNull();
    expect(screen.queryByTestId('canvas-cta-focused-investigation')).not.toBeNull();
  });

  it('isDemo bypasses sustainment + handoff prerequisites', () => {
    renderOverlay({ signals: { ...emptySignals, isDemo: true } });
    for (const path of ['sustainment', 'handoff']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'active');
    }
  });

  it('clicking an active CTA invokes its handler with the step id', () => {
    const onCharter = vi.fn();
    renderOverlay({ onCharter });
    const cta = screen.getByTestId('canvas-cta-charter');
    cta.click();
    expect(onCharter).toHaveBeenCalledWith('step-1');
  });
});
