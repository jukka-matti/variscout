/**
 * FrameView b0 happy-path integration test (W3-9).
 *
 * Exercises the user's real paste-flow through the PWA `<FrameView />` for
 * the empty-process-map (b0) branch:
 *
 *   1. Project store seeded with a synthetic "feather"-style dataset
 *      (datetime + categorical + 2 continuous numerics) → detectColumns
 *      identifies columns sensibly.
 *   2. FrameView mounts → b0 surface renders (frame-view + y-picker-section).
 *   3. Y picker shows ranked candidates with `Down_Content_%` first
 *      (name pattern bonus: `%` + `content` → +1.0 cap) ahead of
 *      `Input_Quantity_kg` (no name-pattern bonus).
 *   4. Click `Down_Content_%` chip → setOutcome('Down_Content_%').
 *   5. Re-render with outcome='Down_Content_%' → X picker visible with
 *      `Material_Type` and `Input_Quantity_kg` chips, `Lot_Start_DateTime`
 *      shown as run-order hint (excluded from picker).
 *   6. Click `Material_Type` chip → setFactors(['Material_Type']).
 *   7. Re-render with factors=['Material_Type'] → click "See the data →"
 *      CTA → panelsStore.showAnalysis() called.
 *
 * Critical test rule (per .claude/rules/testing.md): vi.mock() BEFORE any
 * component imports — otherwise tests hang in an infinite loop.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock MUST come before component imports.

const setOutcomeMock = vi.fn();
const setFactorsMock = vi.fn();
const setMeasureSpecMock = vi.fn();
const setProcessContextMock = vi.fn();
const showAnalysisMock = vi.fn();

// 30-row synthetic feather-style dataset — already-parsed numerics so the
// column-type detector classifies cleanly (parser detection runs at parse
// time; FrameView reads pre-parsed `DataRow[]` from the store).
//
// Deterministic generation (no Math.random) — uses index `i` for everything.
const FEATHER_ROWS = Array.from({ length: 30 }, (_, i) => ({
  Lot_Start_DateTime: `2024-03-${String((i % 28) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00:00`,
  Material_Type: ['Material A', 'Material B', 'Material C'][i % 3],
  // Numeric (already parsed) so detectColumns labels this 'numeric'. Each
  // row gets a unique value → uniqueCount=30 → triggers the +0.3 rich
  // variation bonus (RICH_VARIATION_THRESHOLD=30 in yLikelihood.ts).
  'Down_Content_%': 20 + (i % 5) + (i * 7) / 1000,
  // Numeric, no name-pattern bonus → ranks below Down_Content_%.
  Input_Quantity_kg: 80 + i * 2.3,
}));

const baseStoreState = {
  rawData: FEATHER_ROWS,
  outcome: null as string | null,
  factors: [] as readonly string[],
  setOutcome: setOutcomeMock,
  setFactors: setFactorsMock,
  measureSpecs: {} as Record<string, unknown>,
  setMeasureSpec: setMeasureSpecMock,
  processContext: null as unknown,
  setProcessContext: setProcessContextMock,
};

const storeStateRef: { current: typeof baseStoreState } = { current: { ...baseStoreState } };

vi.mock('@variscout/stores', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/stores')>();
  return {
    ...actual,
    useProjectStore: vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
  };
});

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({ showAnalysis: showAnalysisMock }),
  }),
}));

vi.mock('@variscout/hooks', async () => {
  const actual = await import('@variscout/hooks');
  return {
    ...actual,
    useProductionLineGlanceFilter: vi.fn(() => ({
      value: {},
      onChange: vi.fn(),
    })),
    useProductionLineGlanceOpsToggle: vi.fn(() => ({
      mode: 'spatial' as const,
      setMode: vi.fn(),
      toggle: vi.fn(),
    })),
    useProductionLineGlanceData: vi.fn(() => ({
      cpkTrend: { data: [], stats: null, specs: {} },
      cpkGapTrend: { series: [], stats: null },
      capabilityNodes: [],
      errorSteps: [],
      availableContext: { hubColumns: [], tributaryGroups: [] },
      contextValueOptions: {},
    })),
  };
});

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  const React = await import('react');
  return {
    ...actual,
    IChart: () => React.createElement('div', { 'data-testid': 'mock-cpk-trend' }),
    CapabilityGapTrendChart: () => React.createElement('div', { 'data-testid': 'mock-gap-trend' }),
    CapabilityBoxplot: () =>
      React.createElement('div', { 'data-testid': 'mock-capability-boxplot' }),
    StepErrorPareto: () => React.createElement('div', { 'data-testid': 'mock-step-pareto' }),
  };
});

import FrameView from '../FrameView';
import { SessionProvider } from '../../../store/sessionStore';

function renderFrameView() {
  return render(
    <SessionProvider>
      <FrameView />
    </SessionProvider>
  );
}

describe('FrameView b0 — happy-path integration', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test');
    setOutcomeMock.mockClear();
    setFactorsMock.mockClear();
    setMeasureSpecMock.mockClear();
    setProcessContextMock.mockClear();
    showAnalysisMock.mockClear();
    storeStateRef.current = { ...baseStoreState };
  });

  it('renders b0 surface, ranks Y, then accepts Y → X → See-the-data flow', () => {
    // ── Step 2: empty processMap → b0 path. Verify b0 surface rendered. ─────
    renderFrameView();
    expect(screen.getByTestId('frame-view')).toBeInTheDocument();
    expect(screen.getByTestId('y-picker-section')).toBeInTheDocument();

    // ── Step 3: Y picker shows ranked candidates with Down_Content_% first.
    const yRow = screen.getByTestId('y-picker-candidate-row');
    const yChips = yRow.querySelectorAll<HTMLButtonElement>(
      '[data-testid="column-candidate-chip"]'
    );
    // Exactly 2 numeric Y candidates: Down_Content_% and Input_Quantity_kg.
    // (Date and categorical columns are filtered out by yLikelihood ranking.)
    expect(yChips.length).toBe(2);
    // Aria-label on each chip starts with the column name (see ColumnCandidateChip
    // defaultAriaLabel: `${column.name}, …`). First chip should be Down_Content_%.
    expect(yChips[0].getAttribute('aria-label')).toMatch(/^Down_Content_%/);
    expect(yChips[1].getAttribute('aria-label')).toMatch(/^Input_Quantity_kg/);

    // ── Step 4: click Down_Content_% chip → setOutcome called. ──────────────
    fireEvent.click(yChips[0]);
    expect(setOutcomeMock).toHaveBeenCalledWith('Down_Content_%');
  });

  it('after Y is selected, X picker reveals factor chips and run-order hint', () => {
    storeStateRef.current = { ...baseStoreState, outcome: 'Down_Content_%' };

    // ── Step 5 (re-render with outcome): X picker visible, run-order hint. ─
    renderFrameView();
    expect(screen.getByTestId('x-picker-section')).toBeInTheDocument();

    // Run-order hint mentions Lot_Start_DateTime (date column auto-detected
    // as timeColumn). The hint is read-only — never appears as a chip.
    const runOrderHint = screen.getByTestId('x-picker-run-order-hint');
    expect(runOrderHint.textContent).toContain('Lot_Start_DateTime');

    // X picker contains exactly the two factor candidates: Material_Type
    // (categorical) + Input_Quantity_kg (numeric). The Y column and the
    // run-order column are excluded by FrameView's xCandidates filter.
    const xRow = screen.getByTestId('x-picker-available-row');
    const xChips = xRow.querySelectorAll<HTMLButtonElement>(
      '[data-testid="column-candidate-chip"]'
    );
    expect(xChips.length).toBe(2);
    const xLabels = Array.from(xChips).map(c => c.getAttribute('aria-label') ?? '');
    expect(xLabels.some(l => l.startsWith('Material_Type'))).toBe(true);
    expect(xLabels.some(l => l.startsWith('Input_Quantity_kg'))).toBe(true);

    // ── Step 6: click Material_Type chip → setFactors called with ['Material_Type'].
    const materialChip = Array.from(xChips).find(c =>
      (c.getAttribute('aria-label') ?? '').startsWith('Material_Type')
    );
    expect(materialChip).toBeDefined();
    fireEvent.click(materialChip!);
    expect(setFactorsMock).toHaveBeenCalledWith(['Material_Type']);
  });

  it('See-the-data CTA fires panelsStore.showAnalysis() once Y + factors are selected', () => {
    storeStateRef.current = {
      ...baseStoreState,
      outcome: 'Down_Content_%',
      factors: ['Material_Type'],
    };

    // ── Step 7: re-render with Y + X picked → CTA enabled → click → showAnalysis.
    renderFrameView();
    const cta = screen.getByTestId('see-the-data-cta');
    expect(cta.getAttribute('data-disabled')).toBe('false');
    fireEvent.click(cta);
    expect(showAnalysisMock).toHaveBeenCalledTimes(1);
  });
});
