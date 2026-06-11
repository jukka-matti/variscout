/**
 * ER-5a Task 5 — PWA Dashboard membership strip + composition view wiring.
 *
 * Asserts the APP-LEVEL WIRING (not the engine math, which Task 1 owns):
 *  - condition applied → the strip receives variant='membership'; cleared →
 *    'magnitude' (the variant switch, D7);
 *  - D7 NEGATIVE guard: useMembershipModel is called with the FULL lensed rows +
 *    the applied leaves (NOT conditionRows) — the within-subset-η² regression
 *    guard (disposition 2 / D7);
 *  - composition slot swap: under a condition with a selected factor, the freed
 *    comparison slot hosts the composition view (within-slot content change);
 *  - ⊕ produces the COMPOUND leaf set via applyCondition([...prior, newLeaf]);
 *  - degenerate fallback: membership model null → the magnitude strip props.
 *
 * Pattern: useMembershipModel / useCompositionModel are spied (importOriginal +
 * override) to capture their args + control their return; @variscout/ui mocks
 * FactorStripBase + CompositionViewBase to capture props. The store wiring is the
 * unit under test, not the engine or the strip's DOM.
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
} from '@variscout/stores';
import type { ConditionLeaf } from '@variscout/core';
import type {
  FactorStripBaseProps,
  CompositionViewBaseProps,
  ModelDrawerBaseProps,
} from '@variscout/ui';
import Dashboard from '../Dashboard';

// ── Hoisted capture for the membership/composition hook args + returns ────────
const membership = vi.hoisted(() => ({
  args: undefined as
    | { lensedRows: unknown[]; leaves: readonly ConditionLeaf[]; factor?: string }
    | undefined,
  compositionArgs: undefined as
    | { lensedRows: unknown[]; leaves: readonly ConditionLeaf[]; factor: string }
    | undefined,
  modelReturn: {
    chips: [
      {
        factor: 'Machine',
        separation: 0.7,
        pValue: 0.01,
        isSignificant: true,
        binnedForRanking: false,
        topLevel: { level: 'B', lift: 2.8 },
        isSelected: true,
      },
    ],
    nIn: 3,
    nOut: 3,
  } as unknown,
  compositionReturn: {
    levels: [
      { level: 'B', nIn: 3, nOut: 0, shareIn: 1, shareOut: 0, lift: Infinity },
      { level: 'A', nIn: 0, nOut: 3, shareIn: 0, shareOut: 1, lift: 0 },
    ],
    nIn: 3,
    nOut: 3,
  } as unknown,
}));

vi.mock('../../workers/useStatsWorker', () => ({ useStatsWorker: () => null }));

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useDataDateRange: () => null,
    useMembershipModel: (a: { lensedRows: unknown[]; leaves: readonly ConditionLeaf[] }) => {
      membership.args = a;
      return membership.modelReturn;
    },
    useCompositionModel: (a: {
      lensedRows: unknown[];
      leaves: readonly ConditionLeaf[];
      factor: string;
    }) => {
      membership.compositionArgs = a;
      return membership.compositionReturn;
    },
  };
});

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
vi.mock('../PerformanceDashboard', () => ({
  default: () => <div data-testid="performance-dashboard">Perf</div>,
}));
vi.mock('../MobileDashboard', () => ({
  default: () => <div data-testid="mobile-dashboard">Mobile</div>,
}));
vi.mock('../settings/SpecEditor', () => ({ default: () => <div data-testid="spec-editor" /> }));
vi.mock('html-to-image', () => ({ toBlob: vi.fn() }));

// Capture the props FactorStripBase + CompositionViewBase receive.
const captured = vi.hoisted(() => ({
  stripProps: undefined as FactorStripBaseProps | undefined,
  compositionProps: undefined as CompositionViewBaseProps | undefined,
}));

vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual<typeof import('@variscout/ui')>('@variscout/ui');
  return {
    ...actual,
    ProcessHealthBar: () => <div data-testid="health-bar" />,
    DashboardLayoutBase: (props: {
      factorStrip?: React.ReactNode;
      renderBoxplotContent?: React.ReactNode;
    }) => (
      <div data-testid="layout-base">
        {props.factorStrip}
        <div data-testid="boxplot-slot">{props.renderBoxplotContent}</div>
      </div>
    ),
    FactorStripBase: (props: FactorStripBaseProps) => {
      captured.stripProps = props;
      return (
        <div data-testid="factor-strip" data-variant={props.variant ?? 'magnitude'}>
          {(props.variant === 'membership' ? (props.membershipChips ?? []) : props.chips).map(c => (
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
    CompositionViewBase: (props: CompositionViewBaseProps) => {
      captured.compositionProps = props;
      return (
        <div data-testid="composition-view">
          {props.levels.map(l => (
            <button
              key={l.level}
              data-testid={`composition-add-${l.level}`}
              onClick={() => props.onAddToCondition?.(l.level)}
            >
              {l.level}
            </button>
          ))}
        </div>
      );
    },
    ModelDrawerBase: (props: ModelDrawerBaseProps) =>
      props.open ? <div data-testid="model-drawer" /> : null,
  };
});

// A factor (Machine) with two clearly-separated group means.
const ROWS = [
  { Result: 10, Machine: 'A' },
  { Result: 11, Machine: 'A' },
  { Result: 12, Machine: 'A' },
  { Result: 30, Machine: 'B' },
  { Result: 31, Machine: 'B' },
  { Result: 32, Machine: 'B' },
];

// A y-band condition: Result >= 25 (the high band = the three 'B' rows).
const Y_BAND_LEAF: ConditionLeaf = { kind: 'leaf', column: 'Result', op: 'gte', value: 25 };

function seedProject() {
  useProjectStore.setState({
    ...getProjectInitialState(),
    outcome: 'Result',
    factors: ['Machine'],
    rawData: ROWS,
  });
}

function applyCondition() {
  useAnalysisScopeStore.getState().setConditionLeaves([Y_BAND_LEAF]);
}

describe('PWA Dashboard — membership strip + composition view (ER-5a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.stripProps = undefined;
    captured.compositionProps = undefined;
    membership.args = undefined;
    membership.compositionArgs = undefined;
    useViewStore.setState(useViewStore.getInitialState());
    useAnalyzeStore.setState(getAnalyzeInitialState());
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
    seedProject();
  });

  it('no condition → magnitude strip (variant magnitude / undefined)', async () => {
    render(<Dashboard />);
    await flushRaf();
    expect(captured.stripProps).toBeTruthy();
    // Magnitude path: variant prop is omitted (defaults to 'magnitude').
    expect(captured.stripProps!.variant).toBeUndefined();
  });

  it('condition applied → strip receives variant="membership"', async () => {
    applyCondition();
    render(<Dashboard />);
    await flushRaf();
    expect(captured.stripProps!.variant).toBe('membership');
    expect(captured.stripProps!.membershipChips).toBeTruthy();
    expect(captured.stripProps!.membershipChips!.map(c => c.factor)).toContain('Machine');
  });

  it('D7 NEGATIVE: useMembershipModel is fed the FULL lensed rows + the leaves (NOT conditionRows)', async () => {
    applyCondition();
    render(<Dashboard />);
    await flushRaf();
    expect(membership.args).toBeTruthy();
    // The within-subset-η² regression guard: the hook gets the FULL population
    // (all 6 rows), NOT the 3-row condition subset. If this drops to 3, the
    // membership ranking has silently become a within-subset ranking (D7 broken).
    expect(membership.args!.lensedRows).toHaveLength(ROWS.length);
    expect(membership.args!.leaves).toEqual([Y_BAND_LEAF]);
  });

  it('composition slot swap: factor selected under a condition → composition view in the freed slot', async () => {
    applyCondition();
    const { getByTestId, queryByTestId } = render(<Dashboard />);
    await flushRaf();

    // Select the Machine chip from the membership strip.
    fireEvent.click(getByTestId('strip-chip-Machine'));
    await flushRaf();

    // The freed comparison slot now hosts the composition view (boxplot replaced).
    expect(getByTestId('composition-view')).toBeTruthy();
    expect(queryByTestId('boxplot')).toBeNull();
    // The composition model was fed the FULL lensed rows + leaves + the factor (D7).
    expect(membership.compositionArgs!.lensedRows).toHaveLength(ROWS.length);
    expect(membership.compositionArgs!.leaves).toEqual([Y_BAND_LEAF]);
    expect(membership.compositionArgs!.factor).toBe('Machine');
  });

  it('⊕ a level mints the COMPOUND condition via applyCondition([...prior, newLeaf])', async () => {
    applyCondition();
    const { getByTestId } = render(<Dashboard />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));
    await flushRaf();

    // ⊕ the 'B' level → compound condition = [Y_BAND_LEAF, eq(Machine,B)].
    fireEvent.click(getByTestId('composition-add-B'));

    const leaves = useAnalysisScopeStore.getState().conditionLeaves;
    expect(leaves).toHaveLength(2);
    expect(leaves[0]).toEqual(Y_BAND_LEAF);
    expect(leaves[1]).toEqual({ kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' });
  });

  it('degenerate fallback: membership model null → magnitude strip props (no membership variant)', async () => {
    membership.modelReturn = null;
    applyCondition();
    render(<Dashboard />);
    await flushRaf();
    // Model null → the strip falls back to magnitude exactly as today.
    expect(captured.stripProps!.variant).toBeUndefined();
    expect(captured.stripProps!.membershipChips).toBeUndefined();
    // Restore for subsequent tests.
    membership.modelReturn = {
      chips: [
        {
          factor: 'Machine',
          separation: 0.7,
          pValue: 0.01,
          isSignificant: true,
          binnedForRanking: false,
          topLevel: { level: 'B', lift: 2.8 },
          isSelected: true,
        },
      ],
      nIn: 3,
      nOut: 3,
    };
  });
});
