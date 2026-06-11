/**
 * ER-2 Task 4 — PWA Dashboard factor strip wiring.
 *
 * Asserts:
 *  - the strip band model reaches DashboardLayoutBase as the `factorStrip` node
 *    with ranked chips for the seeded data;
 *  - clicking a chip rebinds the comparison factor (setBoxplotFactor via the
 *    analysisScopeStore mirror) AND marks it examined in the viewStore;
 *  - recomputeScopeWhatIf fires when the live drill matches an existing scope,
 *    and does NOT fire (and no scope is created) when it doesn't.
 *
 * Pattern: DashboardLayoutBase + FactorStripBase are mocked to capture props +
 * expose chip buttons (the ER-1 mock-capture pattern). The store wiring is the
 * unit under test, not the strip's internal DOM.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { flushRaf } from '@variscout/ui/test-utils';
import {
  useProjectStore,
  useViewStore,
  useAnalyzeStore,
  useAnalysisScopeStore,
  getProjectInitialState,
  getAnalyzeInitialState,
  getAnalysisScopeInitialState,
  examinedFactorKey,
} from '@variscout/stores';
import { createProblemStatementScope, buildConditionFromCategoricalFilters } from '@variscout/core';
import type { FactorStripBaseProps } from '@variscout/ui';

// Worker-free chart stubs (real charts need ResizeObserver, unavailable in jsdom).
vi.mock('../charts/IChart', () => ({ default: () => <div data-testid="i-chart">I-Chart</div> }));
vi.mock('../charts/Boxplot', () => ({ default: () => <div data-testid="boxplot">Boxplot</div> }));
vi.mock('../charts/ParetoChart', () => ({
  default: () => <div data-testid="pareto-chart">Pareto</div>,
}));
vi.mock('../charts/CapabilityHistogram', () => ({
  default: () => <div data-testid="capability-histogram">Histogram</div>,
}));
vi.mock('../charts/ProbabilityPlot', () => ({
  default: () => <div data-testid="probability-plot">Probability Plot</div>,
}));
vi.mock('../ProcessIntelligencePanel', () => ({
  default: () => <div data-testid="stats-panel">PI</div>,
}));

vi.mock('../../workers/useStatsWorker', () => ({ useStatsWorker: () => null }));

// Capture the factorStrip node DashboardLayoutBase receives, and the props the
// FactorStripBase inside it is built with.
const captured = vi.hoisted(() => ({
  factorStrip: undefined as React.ReactNode,
  stripProps: undefined as FactorStripBaseProps | undefined,
}));

vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual<typeof import('@variscout/ui')>('@variscout/ui');
  return {
    ...actual,
    ProcessHealthBar: () => <div data-testid="health-bar" />,
    DashboardLayoutBase: ({ factorStrip }: { factorStrip?: React.ReactNode }) => {
      captured.factorStrip = factorStrip;
      return <div data-testid="layout-base">{factorStrip}</div>;
    },
    FactorStripBase: (props: FactorStripBaseProps) => {
      captured.stripProps = props;
      return (
        <div data-testid="factor-strip">
          {props.chips.map(c => (
            <button
              key={c.factor}
              data-testid={`strip-chip-${c.factor}`}
              onClick={() => props.onFactorSelect(c.factor)}
            >
              {c.factor}
            </button>
          ))}
        </div>
      );
    },
  };
});

// A NON-default scopeProjectId — in the real PWA flow App.tsx threads
// String(canvasViewportHubId) (a sessionHub randomUUID), never the
// 'general-unassigned' sentinel. Seeding the non-default value here exercises
// the genuine match path (the previous 'general-unassigned' coincidence masked
// the bug where Dashboard re-derived its own key).
const HUB_ID = 'hub-uuid-1';

// A factor (Machine) with two clearly-separated group means → a rankable chip.
const ROWS = [
  { Result: 10, Machine: 'A' },
  { Result: 11, Machine: 'A' },
  { Result: 12, Machine: 'A' },
  { Result: 30, Machine: 'B' },
  { Result: 31, Machine: 'B' },
  { Result: 32, Machine: 'B' },
];

function seedProject() {
  useProjectStore.setState({
    ...getProjectInitialState(),
    outcome: 'Result',
    factors: ['Machine'],
    rawData: ROWS,
  });
}

describe('PWA Dashboard — factor strip wiring (ER-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.factorStrip = undefined;
    captured.stripProps = undefined;
    useViewStore.setState(useViewStore.getInitialState());
    useAnalyzeStore.setState(getAnalyzeInitialState());
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
    seedProject();
  });

  it('passes the strip model to DashboardLayoutBase with a ranked chip', async () => {
    const Dashboard = (await import('../Dashboard')).default;
    render(<Dashboard />);
    await flushRaf();
    expect(captured.factorStrip).toBeTruthy();
    expect(captured.stripProps).toBeTruthy();
    const factors = captured.stripProps!.chips.map(c => c.factor);
    expect(factors).toContain('Machine');
  });

  it('chip select rebinds the comparison factor + marks it examined', async () => {
    const Dashboard = (await import('../Dashboard')).default;
    const { getByTestId } = render(<Dashboard />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));

    // setBoxplotFactor mirrors into analysisScopeStore (PWA write-mirror).
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Machine');
    // Examined-state recorded under the active outcome key.
    expect(
      useViewStore.getState().examinedFactors.has(examinedFactorKey('Result', 'Machine'))
    ).toBe(true);
  });

  it('refreshes the what-if of a scope matching the live drill (ends the zero-caller)', async () => {
    // Seed a live drill in the scope store + a scope that matches it, keyed
    // under the SAME non-default projectId Dashboard receives via scopeProjectId.
    const drill = [{ column: 'Machine', values: ['B'] as Array<string | number> }];
    useAnalysisScopeStore.getState().setCategoricalValues('Machine', ['B']);
    const scope = createProblemStatementScope(
      HUB_ID,
      'Result',
      buildConditionFromCategoricalFilters(drill)
    );
    useAnalyzeStore.setState({ scopes: [scope] });

    const spy = vi.spyOn(useAnalyzeStore.getState(), 'recomputeScopeWhatIf');

    const Dashboard = (await import('../Dashboard')).default;
    const { getByTestId } = render(<Dashboard scopeProjectId={HUB_ID} />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));

    expect(spy).toHaveBeenCalledWith(scope.id);
    // No scope was created by the strip (ER-4 owns creation).
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });

  it('does NOT refresh and does NOT create a scope when the drill matches nothing', async () => {
    // Live drill present, but no scope exists for it.
    useAnalysisScopeStore.getState().setCategoricalValues('Machine', ['B']);

    const spy = vi.spyOn(useAnalyzeStore.getState(), 'recomputeScopeWhatIf');

    const Dashboard = (await import('../Dashboard')).default;
    const { getByTestId } = render(<Dashboard scopeProjectId={HUB_ID} />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));

    expect(spy).not.toHaveBeenCalled();
    expect(useAnalyzeStore.getState().scopes).toHaveLength(0);
  });

  it('does NOT refresh when an otherwise-matching scope lives under a DIFFERENT projectId', async () => {
    // The drill matches the scope's condition, but the scope is keyed under a
    // different projectId than the one Dashboard receives — the projectId is
    // part of the match key, so this must NOT fire (guards against re-deriving
    // the wrong key, which is exactly the masked bug this suite now covers).
    const drill = [{ column: 'Machine', values: ['B'] as Array<string | number> }];
    useAnalysisScopeStore.getState().setCategoricalValues('Machine', ['B']);
    const scope = createProblemStatementScope(
      'a-different-hub',
      'Result',
      buildConditionFromCategoricalFilters(drill)
    );
    useAnalyzeStore.setState({ scopes: [scope] });

    const spy = vi.spyOn(useAnalyzeStore.getState(), 'recomputeScopeWhatIf');

    const Dashboard = (await import('../Dashboard')).default;
    const { getByTestId } = render(<Dashboard scopeProjectId={HUB_ID} />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));

    expect(spy).not.toHaveBeenCalled();
    // The scope under the other projectId is left untouched.
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });
});
