/**
 * WallCanvas test-plan triad + per-hypothesis What-If SEAM test (FE-2a §4/§5).
 *
 * Proves the triad + What-If are wired through the PRODUCTION Wall path — NOT a
 * leaf with injected props. The REAL WallCanvas receives rows + outcome + specs
 * + planningProps and DERIVES each hub's test-plan triad (real
 * `buildHypothesisTestPlan`) and per-hypothesis What-If (real
 * `computeScopeWhatIfProjection` / `computeConditionCoverage`), then mounts the
 * REAL `HypothesisCardWithPlans`.
 *
 * A dead wiring (triad not derived, or rows/outcome/specs not threaded) FAILS
 * these: the factor row would be absent, the tool label would not reflect the
 * factor's data-type, the Evaluate tap would not fire with (hubId, factor), and
 * the What-If projection would not render a Cpk.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { WallCanvasPlanningProps } from '../WallCanvas';
import {
  getCanvasViewportInitialState,
  useViewStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { DataRow, Hypothesis } from '@variscout/core';

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState({ focusedWallEntityId: null });
});

// A hub whose condition names SHIFT (categorical) — drives the triad factor.
function makeHub(): Hypothesis {
  const hub = createHypothesis('Night shift runs hot', '', []);
  return {
    ...hub,
    condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
  };
}

// SHIFT sharply splits Y (Day low, Night high) → significant; SHIFT present →
// ready; TEMP is continuous but not in the condition. OPERATOR is absent → gap.
function rows(): DataRow[] {
  return [
    { SHIFT: 'Day', Y: 10 },
    { SHIFT: 'Day', Y: 11 },
    { SHIFT: 'Day', Y: 12 },
    { SHIFT: 'Day', Y: 13 },
    { SHIFT: 'Day', Y: 14 },
    { SHIFT: 'Night', Y: 30 },
    { SHIFT: 'Night', Y: 31 },
    { SHIFT: 'Night', Y: 32 },
    { SHIFT: 'Night', Y: 33 },
    { SHIFT: 'Night', Y: 34 },
  ];
}

function basePlanningProps(overrides?: Partial<WallCanvasPlanningProps>): WallCanvasPlanningProps {
  return {
    plans: [],
    members: [], // open-access (V1 single-user)
    currentUserId: null,
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    ...overrides,
  };
}

describe('WallCanvas — test-plan triad seam', () => {
  it('derives + renders the triad factor with the right tool through the real Wall', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[makeHub()]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={basePlanningProps({ onEvaluateFactor: vi.fn() })}
      />
    );
    // Triad mounted via the production path with the DERIVED factor (SHIFT).
    const factorRow = screen.getByTestId('test-plan-factor-SHIFT');
    expect(factorRow).toBeTruthy();
    // SHIFT is categorical → the engine picks boxplot + 2-sample.
    expect(factorRow.getAttribute('data-tool')).toBe('two-sample');
    expect(within(factorRow).getByText(/Boxplot \+ 2-sample/)).toBeTruthy();
    expect(factorRow.getAttribute('data-readiness')).toBe('ready');
  });

  it('fires onEvaluateFactor(hubId, factor) when Evaluate is tapped (real wiring)', () => {
    const onEvaluateFactor = vi.fn();
    const hub = makeHub();
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[hub]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        planningProps={basePlanningProps({ onEvaluateFactor })}
      />
    );
    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));
    expect(onEvaluateFactor).toHaveBeenCalledWith(hub.id, 'SHIFT');
  });

  it('renders the per-hypothesis What-If Cpk from the real IM-5 helpers', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[makeHub()]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
        activeScopeSpecs={{ usl: 25, lsl: 5 }}
        planningProps={basePlanningProps({ onEvaluateFactor: vi.fn() })}
      />
    );
    const whatIf = screen.getByTestId('hypothesis-whatif');
    // The projected Cpk row renders (real computeScopeWhatIfProjection over rows).
    expect(within(whatIf).getByTestId('hypothesis-whatif-value')).toBeTruthy();
  });

  it('does NOT render the triad when planningProps is omitted (bare card path)', () => {
    render(
      <WallCanvas
        hubId={'test-hub' as never}
        hubs={[makeHub()]}
        findings={[]}
        problemCpk={0.8}
        eventsPerWeek={10}
        rows={rows()}
        outcomeColumn="Y"
      />
    );
    expect(screen.queryByTestId('test-plan-triad')).toBeNull();
  });
});
