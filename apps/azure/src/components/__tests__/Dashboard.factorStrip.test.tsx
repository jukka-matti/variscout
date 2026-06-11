/**
 * ER-2 Task 4 — Azure Dashboard factor strip wiring.
 *
 * Asserts:
 *  - the strip band model reaches DashboardLayoutBase as the `factorStrip` node
 *    with ranked chips for the seeded data;
 *  - clicking a chip rebinds the comparison factor (selectedFactor updates) AND
 *    marks it examined in the viewStore;
 *  - recomputeScopeWhatIf fires when the live drill matches an existing scope
 *    (keyed by the scopeProjectId prop), and does NOT fire / create one otherwise.
 *
 * Pattern: DashboardLayoutBase + FactorStripBase are mocked to capture props +
 * expose chip buttons (the ER-1 mock-capture pattern).
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
import { usePanelsStore } from '../../features/panels/panelsStore';
import Dashboard from '../Dashboard';

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
vi.mock('../PerformanceDashboard', () => ({
  default: () => <div data-testid="performance-dashboard">Perf</div>,
}));
vi.mock('../MobileChartCarousel', () => ({
  default: () => <div data-testid="mobile-carousel">Mobile</div>,
}));
vi.mock('../settings/SpecEditor', () => ({ default: () => <div data-testid="spec-editor" /> }));
vi.mock('html-to-image', () => ({ toBlob: vi.fn() }));
vi.mock('../../workers/useStatsWorker', () => ({ useStatsWorker: () => null }));

const captured = vi.hoisted(() => ({
  factorStrip: undefined as React.ReactNode,
  stripProps: undefined as FactorStripBaseProps | undefined,
}));

vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual<typeof import('@variscout/ui')>('@variscout/ui');
  return {
    ...actual,
    ProcessHealthBar: () => <div data-testid="health-bar" />,
    ScopeChrome: () => <div data-testid="scope-chrome" />,
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

describe('Azure Dashboard — factor strip wiring (ER-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.factorStrip = undefined;
    captured.stripProps = undefined;
    useViewStore.setState(useViewStore.getInitialState());
    useAnalyzeStore.setState(getAnalyzeInitialState());
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
    usePanelsStore.setState({ pendingExploreIntent: null });
    seedProject();
  });

  it('passes the strip model to DashboardLayoutBase with a ranked chip', async () => {
    render(<Dashboard scopeProjectId="general-unassigned" />);
    await flushRaf();
    expect(captured.factorStrip).toBeTruthy();
    expect(captured.stripProps!.chips.map(c => c.factor)).toContain('Machine');
  });

  it('chip select rebinds the comparison factor + marks it examined', async () => {
    const { getByTestId } = render(<Dashboard scopeProjectId="general-unassigned" />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));
    await flushRaf();

    // The active comparison factor updates (selectedFactor reflects boxplotFactor).
    expect(captured.stripProps!.selectedFactor).toBe('Machine');
    expect(
      useViewStore.getState().examinedFactors.has(examinedFactorKey('Result', 'Machine'))
    ).toBe(true);
  });

  it('refreshes the what-if of a scope matching the live drill (ends the zero-caller)', async () => {
    const drill = [{ column: 'Machine', values: ['B'] as Array<string | number> }];
    useAnalysisScopeStore.getState().setCategoricalValues('Machine', ['B']);
    const scope = createProblemStatementScope(
      'proj-xyz',
      'Result',
      buildConditionFromCategoricalFilters(drill)
    );
    useAnalyzeStore.setState({ scopes: [scope] });

    const spy = vi.spyOn(useAnalyzeStore.getState(), 'recomputeScopeWhatIf');

    const { getByTestId } = render(<Dashboard scopeProjectId="proj-xyz" />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));

    expect(spy).toHaveBeenCalledWith(scope.id);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });

  it('does NOT refresh and does NOT create a scope when the drill matches nothing', async () => {
    useAnalysisScopeStore.getState().setCategoricalValues('Machine', ['B']);

    const spy = vi.spyOn(useAnalyzeStore.getState(), 'recomputeScopeWhatIf');

    const { getByTestId } = render(<Dashboard scopeProjectId="proj-xyz" />);
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
      'a-different-project',
      'Result',
      buildConditionFromCategoricalFilters(drill)
    );
    useAnalyzeStore.setState({ scopes: [scope] });

    const spy = vi.spyOn(useAnalyzeStore.getState(), 'recomputeScopeWhatIf');

    const { getByTestId } = render(<Dashboard scopeProjectId="proj-xyz" />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));

    expect(spy).not.toHaveBeenCalled();
    // The scope under the other projectId is left untouched.
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });
});
