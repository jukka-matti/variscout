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
 *      CTA → panelsStore.showExplore() called.
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
const showExploreMock = vi.fn();

// FSJ-2 T5 mocks — import-flow handlers passed as props by App.
const onFixDataMock = vi.fn();
const onRenameColumnMock = vi.fn();

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

// 30-row all-categorical dataset — no numeric columns → rankYCandidates returns
// empty → FrameViewB0 renders the noYBanner (OutcomeNoMatchBanner) instead of chips.
const CATEGORICAL_ROWS = Array.from({ length: 30 }, (_, i) => ({
  Line: ['Line A', 'Line B', 'Line C'][i % 3],
  Shift: ['Day', 'Night'][i % 2],
  Category: ['Cat 1', 'Cat 2', 'Cat 3', 'Cat 4'][i % 4],
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
  dataFilename: 'Pasted Data' as string | null,
  dataQualityReport: null as unknown,
};

const storeStateRef: { current: typeof baseStoreState } = { current: { ...baseStoreState } };

vi.mock('@variscout/stores', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/stores')>();
  return {
    ...actual,
    useProjectStore: Object.assign(
      vi.fn((selector: (s: unknown) => unknown) => selector(storeStateRef.current)),
      { getState: () => storeStateRef.current }
    ),
  };
});

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: Object.assign(vi.fn(), {
    getState: () => ({ showExplore: showExploreMock }),
  }),
}));

// E1 T6: PWA FrameView guards Canvas chrome behind activeIP != null. This
// b0 integration test exercises the post-guard b0 (empty processMap) surface,
// so we supply a minimal IP-shaped stub via the useActiveIPContext mock so
// the guard passes and Canvas chrome renders.
const FAKE_ACTIVE_IP_FOR_B0 = {
  id: 'ip-b0-test',
  hubId: 'hub-b0-test',
  status: 'active',
  metadata: { title: 'b0 integration test project', members: [] },
  goal: { outcomeGoals: [] },
  sections: {
    background: {},
    approach: {},
    outcomeReference: {},
  },
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
};
vi.mock('@variscout/hooks', async () => {
  const actual = await import('@variscout/hooks');
  return {
    ...actual,
    useActiveIPContext: () => ({ activeIP: FAKE_ACTIVE_IP_FOR_B0 }),
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
import type { QuietTimeExtractionChip } from '../../../hooks/usePasteImportFlow';
import type { DefectDetection, DefectMapping, WideFormatDetection } from '@variscout/core';

const DEFECT_ROWS = Array.from({ length: 12 }, (_, i) => ({
  Date: `2026-05-${String((i % 4) + 1).padStart(2, '0')}`,
  Defect_Type: ['Scratch', 'Dent', 'Crack'][i % 3],
  Shift: ['Day', 'Night'][i % 2],
  Units_Produced: 100,
}));

const WIDE_ROWS = Array.from({ length: 12 }, (_, i) => ({
  Batch: `B${i + 1}`,
  V1: 10 + (i % 5),
  V2: 11 + ((i * 2) % 5),
  V3: 9 + ((i * 3) % 5),
  V4: 12 + ((i * 4) % 5),
}));

const DEFECT_DETECTION: DefectDetection = {
  isDefectFormat: true,
  confidence: 'high',
  dataShape: 'event-log',
  suggestedMapping: {
    aggregationUnit: 'Date',
    defectTypeColumn: 'Defect_Type',
    unitsProducedColumn: 'Units_Produced',
  },
};

const WIDE_DETECTION: WideFormatDetection = {
  isWideFormat: true,
  confidence: 'high',
  reason: '4/4 columns match channel naming patterns',
  metadataColumns: ['Batch'],
  channels: [
    { id: 'V1', label: 'V1', n: 12, preview: { min: 10, max: 14, mean: 12 }, matchedPattern: true },
    { id: 'V2', label: 'V2', n: 12, preview: { min: 11, max: 15, mean: 13 }, matchedPattern: true },
    { id: 'V3', label: 'V3', n: 12, preview: { min: 9, max: 13, mean: 11 }, matchedPattern: true },
    { id: 'V4', label: 'V4', n: 12, preview: { min: 12, max: 16, mean: 14 }, matchedPattern: true },
  ],
};

interface RenderFrameViewOptions {
  onFixData?: () => void;
  onRenameColumn?: (oldName: string, alias: string) => void;
  quietTimeExtraction?: QuietTimeExtractionChip | null;
  onDismissQuietTimeExtraction?: () => void;
  onUndoQuietTimeExtraction?: () => void;
  defectDetection?: DefectDetection | null;
  onAcceptDefectDetection?: (mapping: DefectMapping) => void;
  onDismissDefectDetection?: () => void;
  wideFormatDetection?: WideFormatDetection | null;
  onAcceptWideFormatDetection?: (columns: string[], label: string) => void;
  onDismissWideFormatDetection?: () => void;
}

function renderFrameView({
  onFixData,
  onRenameColumn,
  quietTimeExtraction,
  onDismissQuietTimeExtraction,
  onUndoQuietTimeExtraction,
  defectDetection,
  onAcceptDefectDetection,
  onDismissDefectDetection,
  wideFormatDetection,
  onAcceptWideFormatDetection,
  onDismissWideFormatDetection,
}: RenderFrameViewOptions = {}) {
  return render(
    <SessionProvider>
      <FrameView
        onFixData={onFixData}
        onRenameColumn={onRenameColumn}
        quietTimeExtraction={quietTimeExtraction}
        onDismissQuietTimeExtraction={onDismissQuietTimeExtraction}
        onUndoQuietTimeExtraction={onUndoQuietTimeExtraction}
        defectDetection={defectDetection}
        onAcceptDefectDetection={onAcceptDefectDetection}
        onDismissDefectDetection={onDismissDefectDetection}
        wideFormatDetection={wideFormatDetection}
        onAcceptWideFormatDetection={onAcceptWideFormatDetection}
        onDismissWideFormatDetection={onDismissWideFormatDetection}
      />
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
    showExploreMock.mockClear();
    onFixDataMock.mockClear();
    onRenameColumnMock.mockClear();
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

  it('See-the-data CTA fires panelsStore.showExplore() once Y + factors are selected', () => {
    storeStateRef.current = {
      ...baseStoreState,
      outcome: 'Down_Content_%',
      factors: ['Material_Type'],
    };

    // ── Step 7: re-render with Y + X picked → CTA enabled → click → showExplore.
    renderFrameView();
    const cta = screen.getByTestId('see-the-data-cta');
    expect(cta.getAttribute('data-disabled')).toBe('false');
    fireEvent.click(cta);
    expect(showExploreMock).toHaveBeenCalledTimes(1);
  });

  // ── FSJ-2 T5: b0 landing chrome (provenance / Fix-data hatch / track-another / no-Y) ──

  it('shows the provenance line with source, rows and columns (b0-landing wireframe top bar)', () => {
    // Fixture: baseStoreState has dataFilename='Pasted Data', 30 FEATHER_ROWS × 4 columns.
    renderFrameView({ onFixData: onFixDataMock });
    const prov = screen.getByTestId('b0-provenance');
    expect(prov).toHaveTextContent('Pasted Data · 30 rows · 4 columns');
  });

  it('"Fix data…" opens the demoted wizard (fires onFixData)', () => {
    renderFrameView({ onFixData: onFixDataMock });
    fireEvent.click(screen.getByTestId('b0-fix-data'));
    expect(onFixDataMock).toHaveBeenCalledTimes(1);
  });

  it('shows an undoable quiet time chip in the b0 top bar', () => {
    const onDismissQuietTimeExtraction = vi.fn();
    const onUndoQuietTimeExtraction = vi.fn();
    renderFrameView({
      onFixData: onFixDataMock,
      quietTimeExtraction: {
        timeColumn: 'Lot_Start_DateTime',
        newColumns: ['Lot_Start_DateTime_Month', 'Lot_Start_DateTime_DayOfWeek'],
        dismissed: false,
      },
      onDismissQuietTimeExtraction,
      onUndoQuietTimeExtraction,
    });

    const chip = screen.getByTestId('b0-time-chip');
    expect(chip).toHaveTextContent('Dates detected in Lot_Start_DateTime');
    expect(chip).toHaveTextContent('added Month + Day of Week');

    fireEvent.click(screen.getByTestId('b0-time-chip-adjust'));
    expect(onFixDataMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('b0-time-chip-undo'));
    expect(onUndoQuietTimeExtraction).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('b0-time-chip-dismiss'));
    expect(onDismissQuietTimeExtraction).toHaveBeenCalledTimes(1);
  });

  it('"+ track another outcome" reaches the multi-outcome surface (fires onFixData — wizard parity, spec §7)', () => {
    renderFrameView({ onFixData: onFixDataMock });
    fireEvent.click(screen.getByTestId('b0-track-another-outcome'));
    expect(onFixDataMock).toHaveBeenCalledTimes(1);
  });

  it('renders the defect proposal and accepts the inline confirm sequence', () => {
    const onAcceptDefectDetection = vi.fn();
    const onDismissDefectDetection = vi.fn();
    storeStateRef.current = {
      ...baseStoreState,
      rawData: DEFECT_ROWS as unknown as typeof baseStoreState.rawData,
    };

    renderFrameView({
      defectDetection: DEFECT_DETECTION,
      onAcceptDefectDetection,
      onDismissDefectDetection,
    });

    const banner = screen.getByTestId('b0-defect-banner');
    expect(banner).toHaveTextContent('These rows look like defect events');

    fireEvent.click(screen.getByTestId('b0-defect-expand'));
    expect(screen.getByTestId('b0-defect-confirm-panel')).toHaveTextContent('DATA TYPE');

    fireEvent.click(screen.getByTestId('b0-defect-accept'));
    expect(onAcceptDefectDetection).toHaveBeenCalledWith({
      dataShape: 'event-log',
      aggregationUnit: 'Date',
      defectTypeColumn: 'Defect_Type',
      unitsProducedColumn: 'Units_Produced',
      countColumn: undefined,
      resultColumn: undefined,
    });

    fireEvent.click(screen.getByTestId('b0-defect-dismiss'));
    expect(onDismissDefectDetection).toHaveBeenCalledTimes(1);
  });

  it('renders the performance proposal and accepts detected channel columns', () => {
    const onAcceptWideFormatDetection = vi.fn();
    const onDismissWideFormatDetection = vi.fn();
    storeStateRef.current = {
      ...baseStoreState,
      rawData: WIDE_ROWS as unknown as typeof baseStoreState.rawData,
    };

    renderFrameView({
      onFixData: onFixDataMock,
      wideFormatDetection: WIDE_DETECTION,
      onAcceptWideFormatDetection,
      onDismissWideFormatDetection,
    });

    const banner = screen.getByTestId('b0-performance-banner');
    expect(banner).toHaveTextContent('These look like parallel channel measurements');
    expect(banner).toHaveTextContent('V1, V2, V3, V4');

    fireEvent.click(screen.getByTestId('b0-performance-accept'));
    expect(onAcceptWideFormatDetection).toHaveBeenCalledWith(['V1', 'V2', 'V3', 'V4'], 'Channel');

    fireEvent.click(screen.getByTestId('b0-performance-stack'));
    expect(onFixDataMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('b0-performance-dismiss'));
    expect(onDismissWideFormatDetection).toHaveBeenCalledTimes(1);
  });

  it('all-categorical data shows the OutcomeNoMatchBanner; skip proceeds to Explore (spec §4.1 no-Y floor)', () => {
    // Override rawData with all-categorical rows — rankYCandidates returns empty.
    // Cast via unknown: CATEGORICAL_ROWS has a different literal shape than FEATHER_ROWS,
    // but the store mock accepts any `(s: unknown) => unknown` selector — the type match
    // is only relevant at the selector call site inside CanvasWorkspace where rawData
    // is typed as DataRow[] (compatible interface).
    storeStateRef.current = {
      ...baseStoreState,
      rawData: CATEGORICAL_ROWS as unknown as typeof baseStoreState.rawData,
    };
    renderFrameView({ onFixData: onFixDataMock });
    expect(screen.getByRole('alert')).toHaveTextContent(/No clear outcome match/);
    fireEvent.click(screen.getByText(/Skip outcome/));
    // handleSeeData calls usePanelsStore.getState().showExplore() — never a dead-end CTA.
    expect(showExploreMock).toHaveBeenCalled();
  });

  it('numeric data shows no banner (negative control)', () => {
    // baseStoreState has numeric columns → yCandidates non-empty → no alert rendered.
    renderFrameView({ onFixData: onFixDataMock });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ── FSJ-2 walk Fix 2: an out-of-candidates store outcome must NOT enable the CTA ──
  // (b0 contract, spec §4.1: a wrong pick is one glance + one click to fix — an
  // outcome that no visible chip represents renders as no-selection rather than an
  // invisible claim, so the CTA stays gated on picking a visible candidate.)

  it('out-of-candidates store outcome renders no selected Y chip (spec §4.1 one-glance contract)', () => {
    // outcome='Lot_Start_DateTime' is the date column — it is NOT among the ranked
    // numeric Y candidates (Down_Content_%, Input_Quantity_kg). Before the fix this
    // showed no highlighted chip yet enabled the CTA (silent wrong Y).
    storeStateRef.current = { ...baseStoreState, outcome: 'Lot_Start_DateTime' };
    renderFrameView();

    const yRow = screen.getByTestId('y-picker-candidate-row');
    const selectedChips = yRow.querySelectorAll(
      '[data-testid="column-candidate-chip"][aria-pressed="true"]'
    );
    expect(selectedChips.length).toBe(0);
  });

  it('out-of-candidates store outcome leaves the See-the-data CTA disabled (spec §4.1)', () => {
    storeStateRef.current = { ...baseStoreState, outcome: 'Lot_Start_DateTime' };
    renderFrameView();
    const cta = screen.getByTestId('see-the-data-cta');
    expect(cta.getAttribute('data-disabled')).toBe('true');
  });
});
