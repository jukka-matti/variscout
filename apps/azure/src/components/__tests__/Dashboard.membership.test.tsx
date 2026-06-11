/**
 * ER-5a Task 5 — Azure Dashboard membership strip + composition view + segment CTA.
 *
 * Asserts the APP-LEVEL WIRING (engine math is Task 1's):
 *  - condition applied → strip variant='membership'; cleared → magnitude (D7);
 *  - D7 NEGATIVE: useMembershipModel is fed the FULL lensed rows + applied leaves
 *    (NOT conditionRows) — the within-subset-η² regression guard;
 *  - composition slot swap on factor select (within-slot content change);
 *  - ⊕ a level mints the COMPOUND condition via applyCondition([...prior, newLeaf]);
 *  - degenerate fallback: model null → magnitude strip props;
 *  - the inflection segment "view as condition →" CTA applies the segment leaf
 *    (Azure-only surface).
 *
 * Pattern: useMembershipModel / useCompositionModel are overridden to capture
 * args + control returns; @variscout/ui mocks FactorStripBase + CompositionViewBase
 * + InflectionSidePanelView to capture props.
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
  InflectionSidePanelViewProps,
  ModelDrawerBaseProps,
} from '@variscout/ui';
import { usePanelsStore } from '../../features/panels/panelsStore';
import Dashboard from '../Dashboard';

const membership = vi.hoisted(() => ({
  args: undefined as { lensedRows: unknown[]; leaves: readonly ConditionLeaf[] } | undefined,
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
      { level: 'B', nIn: 3, nOut: 0, shareIn: 1, shareOut: 0, lift: undefined },
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
    // Stub stats so the verify card (host of the inflection panel) mounts in jsdom
    // (no stats worker → real path returns null, hiding the verify card).
    useAnalysisStats: () => ({
      stats: { mean: 20, ucl: 35, lcl: 5 },
      kde: null,
      isComputing: false,
    }),
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

const captured = vi.hoisted(() => ({
  stripProps: undefined as FactorStripBaseProps | undefined,
  compositionProps: undefined as CompositionViewBaseProps | undefined,
  inflectionProps: undefined as InflectionSidePanelViewProps | undefined,
}));

vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual<typeof import('@variscout/ui')>('@variscout/ui');
  return {
    ...actual,
    ProcessHealthBar: () => <div data-testid="health-bar" />,
    ScopeChrome: () => <div data-testid="scope-chrome" />,
    DashboardLayoutBase: (props: {
      factorStrip?: React.ReactNode;
      renderBoxplotContent?: React.ReactNode;
      renderVerificationCard?: React.ReactNode;
    }) => (
      <div data-testid="layout-base">
        {props.factorStrip}
        <div data-testid="boxplot-slot">{props.renderBoxplotContent}</div>
        <div data-testid="verify-slot">{props.renderVerificationCard}</div>
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
    InflectionSidePanelView: (props: InflectionSidePanelViewProps) => {
      captured.inflectionProps = props;
      return (
        <div data-testid="inflection-panel">
          <button
            data-testid="seg-view-condition-1"
            onClick={() => props.onViewSegmentAsCondition?.(1)}
          >
            view seg 1
          </button>
        </div>
      );
    },
    ModelDrawerBase: (props: ModelDrawerBaseProps) =>
      props.open ? <div data-testid="model-drawer" /> : null,
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

describe('Azure Dashboard — membership strip + composition view + segment CTA (ER-5a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.stripProps = undefined;
    captured.compositionProps = undefined;
    captured.inflectionProps = undefined;
    membership.args = undefined;
    membership.compositionArgs = undefined;
    useViewStore.setState(useViewStore.getInitialState());
    useAnalyzeStore.setState(getAnalyzeInitialState());
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
    usePanelsStore.setState({ pendingExploreIntent: null });
    seedProject();
  });

  it('no condition → magnitude strip (variant undefined)', async () => {
    render(<Dashboard scopeProjectId="general-unassigned" />);
    await flushRaf();
    expect(captured.stripProps).toBeTruthy();
    expect(captured.stripProps!.variant).toBeUndefined();
  });

  it('condition applied → strip receives variant="membership"', async () => {
    applyCondition();
    render(<Dashboard scopeProjectId="general-unassigned" />);
    await flushRaf();
    expect(captured.stripProps!.variant).toBe('membership');
    expect(captured.stripProps!.membershipChips!.map(c => c.factor)).toContain('Machine');
  });

  it('D7 NEGATIVE: useMembershipModel is fed the FULL lensed rows + leaves (NOT conditionRows)', async () => {
    applyCondition();
    render(<Dashboard scopeProjectId="general-unassigned" />);
    await flushRaf();
    expect(membership.args!.lensedRows).toHaveLength(ROWS.length);
    expect(membership.args!.leaves).toEqual([Y_BAND_LEAF]);
  });

  it('composition slot swap: factor selected under a condition → composition view in the freed slot', async () => {
    applyCondition();
    const { getByTestId, queryByTestId } = render(
      <Dashboard scopeProjectId="general-unassigned" />
    );
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));
    await flushRaf();

    expect(getByTestId('composition-view')).toBeTruthy();
    expect(queryByTestId('boxplot')).toBeNull();
    expect(membership.compositionArgs!.lensedRows).toHaveLength(ROWS.length);
    expect(membership.compositionArgs!.leaves).toEqual([Y_BAND_LEAF]);
    expect(membership.compositionArgs!.factor).toBe('Machine');
  });

  it('⊕ a level mints the COMPOUND condition via applyCondition([...prior, newLeaf])', async () => {
    applyCondition();
    const { getByTestId } = render(<Dashboard scopeProjectId="general-unassigned" />);
    await flushRaf();

    fireEvent.click(getByTestId('strip-chip-Machine'));
    await flushRaf();
    fireEvent.click(getByTestId('composition-add-B'));

    const leaves = useAnalysisScopeStore.getState().conditionLeaves;
    expect(leaves).toHaveLength(2);
    expect(leaves[0]).toEqual(Y_BAND_LEAF);
    expect(leaves[1]).toEqual({ kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' });
  });

  it('degenerate fallback: membership model null → magnitude strip props', async () => {
    membership.modelReturn = null;
    applyCondition();
    render(<Dashboard scopeProjectId="general-unassigned" />);
    await flushRaf();
    expect(captured.stripProps!.variant).toBeUndefined();
    expect(captured.stripProps!.membershipChips).toBeUndefined();
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

  it('segment CTA: "view as condition →" applies a segment leaf on the source column', async () => {
    // The inflection panel mounts only with a writer (onBindingsChange) + values.
    // Provide a binding so the committed-state panel renders, and wire the writer.
    const bindings = [
      {
        id: 'b1',
        sourceColumn: 'Result',
        cuts: [15, 28],
        levelNames: ['low', 'mid', 'high'],
        detectionMethod: 'manual' as const,
        detectedAt: new Date(0).toISOString(),
      },
    ];
    const { getByTestId } = render(
      <Dashboard
        scopeProjectId="general-unassigned"
        binnedFactorBindings={bindings}
        onBindingsChange={() => {}}
      />
    );
    await flushRaf();

    // The inflection panel received the onViewSegmentAsCondition wiring.
    expect(captured.inflectionProps?.onViewSegmentAsCondition).toBeTypeOf('function');

    // Click "view seg 1 as condition" → segment 1 (mid: between 15 and 28) applies
    // as a between leaf on the SOURCE column.
    fireEvent.click(getByTestId('seg-view-condition-1'));

    const leaves = useAnalysisScopeStore.getState().conditionLeaves;
    expect(leaves).toHaveLength(1);
    expect(leaves[0]).toEqual({
      kind: 'leaf',
      column: 'Result',
      op: 'between',
      value: [15, 28],
    });
  });
});
