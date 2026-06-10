// apps/pwa/src/__tests__/findingConditionStats.test.tsx
//
// ER-0 Task 6 — Finding capture: condition-scoped stats (PWA app-level handler).
//
// Bug (2026-06-10 walkthrough): the FindingCard rendered condition chips from
// `context.activeFilters` next to `n={context.stats.samples}` computed over a
// DIFFERENT row set (the dashboard's unconditioned `filteredData`). The capture
// handler passed the draft's condition as `captureOptions.activeFilters` but the
// dashboard's rows to buildFindingContext, so n was wrong (dialog n=404 → card
// n=1600).
//
// Fix: when `captureOptions.activeFilters` is present, compute the finding's
// stats over `applyFilters(useProjectStore.getState().rawData, activeFilters)` —
// the SAME row set the condition chips describe. The store read MUST be fresh
// (getState), not a render-scope closure, because brush/probability/engine-signal
// captures add a derived column via setRawData in the SAME tick.
//
// This test renders the real App, captures the REAL handleAddChartObservation
// closure via a stubbed AppViewSwitch, then invokes it and reads the persisted
// finding back from useAnalyzeStore.
//
// vi.mock() BEFORE component imports — testing.md invariant.
import 'fake-indexeddb/auto';
import { vi } from 'vitest';
import type { ChartObservationCaptureOptions } from '@variscout/ui';

type AddChartObservation = (
  chartType: 'boxplot' | 'pareto' | 'ichart' | 'probability',
  categoryKey?: string,
  noteText?: string,
  anchorX?: number,
  anchorY?: number,
  captureOptions?: ChartObservationCaptureOptions
) => unknown;

// Capture the real handleAddChartObservation closure that App builds.
const captured = vi.hoisted(() => ({
  handleAddChartObservation: undefined as AddChartObservation | undefined,
}));

// Stub AppViewSwitch: grab the handler prop, render nothing heavy.
vi.mock('../components/AppViewSwitch', () => ({
  AppViewSwitch: (props: { handleAddChartObservation?: AddChartObservation }) => {
    captured.handleAddChartObservation = props.handleAddChartObservation;
    return null;
  },
}));

// Stub heavy lazy-loaded children so the App mounts quickly in jsdom and we
// don't drag in providers (ThemeProvider etc.) unrelated to the handler.
vi.mock('../components/Dashboard', () => ({
  default: () => <div data-testid="dashboard-stub">Dashboard</div>,
}));
vi.mock('../components/settings/SettingsPanel', () => ({
  default: () => <div data-testid="settings-stub">Settings</div>,
}));
vi.mock('../components/WhatIfPage', () => ({
  default: () => <div data-testid="whatif-stub">What-If</div>,
}));
vi.mock('../components/data/DataTableModal', () => ({
  default: () => <div data-testid="data-table-stub">Data Table</div>,
}));
vi.mock('../components/FindingsPanel', () => ({
  default: () => <div data-testid="findings-panel-stub">Findings</div>,
}));

// Stub the stats worker so useAnalysisStats resolves immediately.
vi.mock('../workers/useStatsWorker', () => ({
  useStatsWorker: () => null,
}));

import { render, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { LocaleProvider } from '../context/LocaleContext';
import { db } from '../db/schema';
import { useProjectStore, useAnalyzeStore, getProjectInitialState } from '@variscout/stores';
import { registerLocaleLoaders, type DataRow, type MessageCatalog } from '@variscout/core';

registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>(
    '../../../../packages/core/src/i18n/messages/*.ts',
    { eager: false }
  )
);

// Deterministic dataset: 4 Billing rows + 6 Sales rows.
const ROWS: DataRow[] = [
  ...Array.from({ length: 4 }, (_, i) => ({ Queue: 'Billing', Y: 10 + i })),
  ...Array.from({ length: 6 }, (_, i) => ({ Queue: 'Sales', Y: 100 + i })),
];

function renderApp() {
  return render(
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
}

async function clearDb() {
  if (!db.isOpen()) await db.open();
  await Promise.all([
    db.meta.clear(),
    db.hubs.clear(),
    db.outcomes.clear(),
    db.canvasState.clear(),
  ]);
}

function latestFinding() {
  // addFinding prepends, so the most recent finding is at index 0.
  return useAnalyzeStore.getState().findings[0];
}

describe('PWA finding capture — condition-scoped stats (ER-0 Task 6)', () => {
  beforeEach(async () => {
    window.history.pushState({}, '', '/');
    await clearDb();
    captured.handleAddChartObservation = undefined;
    useAnalyzeStore.setState({ findings: [] } as never);
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: ROWS,
      outcome: 'Y',
      factors: ['Queue'],
    });
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('computes samples over the captured condition rows, not the dashboard filteredData', async () => {
    await act(async () => {
      renderApp();
    });
    expect(captured.handleAddChartObservation).toBeDefined();

    await act(async () => {
      captured.handleAddChartObservation?.('boxplot', 'Billing', 'note', undefined, undefined, {
        activeFilters: { Queue: ['Billing'] },
        captureMode: 'capture',
      });
    });

    const finding = latestFinding();
    expect(finding).toBeDefined();
    // Billing has 4 rows; the dashboard filteredData had all 10. The persisted
    // samples MUST equal the captured condition's count.
    expect(finding.context?.stats?.samples).toBe(4);
  });

  it('reads fresh rawData (getState) so a same-tick derived column is counted', async () => {
    await act(async () => {
      renderApp();
    });
    expect(captured.handleAddChartObservation).toBeDefined();

    await act(async () => {
      // Simulate the Dashboard same-tick sequence: add a derived 'obs' column via
      // setRawData, THEN capture a finding filtered on that brand-new column —
      // within ONE act().
      const derived = useProjectStore
        .getState()
        .rawData.map((row, i) => ({ ...row, obs: i < 3 ? 'in' : 'out' }));
      useProjectStore.getState().setRawData(derived);
      captured.handleAddChartObservation?.('ichart', undefined, 'brush', 0, 10, {
        activeFilters: { obs: ['in'] },
        captureMode: 'capture',
        brushedRange: { startIdx: 0, endIdx: 2 },
      });
    });

    const finding = latestFinding();
    expect(finding).toBeDefined();
    // 3 rows carry obs='in'. A stale-closure implementation would call
    // applyFilters on the PRE-setRawData rows (no `obs` column); `row['obs']`
    // is undefined, `['in'].includes(undefined)` is false, so every row is
    // excluded → 0 matches → stats = undefined. The test would fail because
    // `samples` would be undefined rather than 3.
    expect(finding.context?.stats?.samples).toBe(3);
  });

  it('without captureOptions, samples equals the dashboard filteredData count (context-menu path)', async () => {
    // Pre-load with 5 rows so filteredData driving the handler is a subset.
    useProjectStore.setState({
      ...useProjectStore.getState(),
      rawData: ROWS.slice(0, 5),
    });

    await act(async () => {
      renderApp();
    });
    expect(captured.handleAddChartObservation).toBeDefined();

    await act(async () => {
      // No captureOptions → legacy path: stats over filteredData (5 rows).
      captured.handleAddChartObservation?.('boxplot', 'Billing', 'note');
    });

    const finding = latestFinding();
    expect(finding).toBeDefined();
    // Context-menu captures have no activeFilters, so stats are computed over
    // the dashboard's filteredData — which here equals rawData (5 rows).
    expect(finding.context?.stats?.samples).toBe(5);
  });
});
