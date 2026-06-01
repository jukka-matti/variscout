// apps/pwa/src/__tests__/outcomePinMulti.test.tsx
//
// F3 P5 — verifies the framing toolbar renders one OutcomePin per outcome
// in sessionHub.outcomes (not just outcomes[0]).
//
// vi.mock() BEFORE imports — testing.md invariant.
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Stub heavy lazy-loaded components so the App can render quickly in jsdom.
vi.mock('../components/Dashboard', () => ({
  default: () => <div data-testid="dashboard-stub">Dashboard</div>,
}));
vi.mock('../components/views/FrameView', () => ({
  default: () => <div data-testid="frame-view-stub">FrameView</div>,
}));
vi.mock('../components/views/AnalyzeView', () => ({
  default: () => <div data-testid="analyze-view-stub">AnalyzeView</div>,
}));
vi.mock('../components/views/ImprovementView', () => ({
  default: () => <div data-testid="improvement-view-stub">ImprovementView</div>,
}));
vi.mock('../components/views/ReportView', () => ({
  default: () => <div data-testid="report-view-stub">ReportView</div>,
}));
vi.mock('../components/ProcessIntelligencePanel', () => ({
  default: () => <div data-testid="pi-panel-stub">PI Panel</div>,
}));
vi.mock('../components/WhatIfPage', () => ({
  default: () => <div data-testid="whatif-stub">What-If</div>,
}));
vi.mock('../components/settings/SettingsPanel', () => ({
  default: () => <div data-testid="settings-stub">Settings</div>,
}));
vi.mock('../components/data/DataTableModal', () => ({
  default: () => <div data-testid="data-table-stub">Data Table</div>,
}));
vi.mock('../components/FindingsPanel', () => ({
  default: () => <div data-testid="findings-panel-stub">Findings</div>,
}));

// Stub the stats worker so useAnalysisStats returns a value immediately.
vi.mock('../workers/useStatsWorker', () => ({
  useStatsWorker: () => ({
    computeStats: vi.fn(),
    computeStatsAsync: vi.fn().mockResolvedValue({
      mean: 23.5,
      stdDev: 0.5,
      min: 22,
      max: 25,
      q1: 23,
      q3: 24,
      median: 23.5,
      cpk: 1.2,
      skewness: 0,
      kurtosis: 3,
      n: 10,
      outOfSpecCount: 0,
      outOfSpecPercentage: 0,
      nelsonFailed: [],
      nelsonRule2Sequences: [],
      nelsonRule3Sequences: [],
    }),
  }),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { LocaleProvider } from '../context/LocaleContext';
import { db } from '../db/schema';
import { pwaHubRepository } from '../persistence';
import {
  buildDocumentSnapshotVrs,
  getCanvasInitialState,
  getProjectInitialState,
  useCanvasStore,
  useProjectStore,
} from '@variscout/stores';
import {
  DEFAULT_PROCESS_HUB,
  registerLocaleLoaders,
  type DataRow,
  type MessageCatalog,
} from '@variscout/core';
import type { OutcomeSpec, ProcessHub } from '@variscout/core/processHub';

registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>(
    '../../../../packages/core/src/i18n/messages/*.ts',
    { eager: false }
  )
);

const NOW = 1_746_352_800_000;

function makeOutcome(id: string, columnName: string): OutcomeSpec {
  return {
    id,
    hubId: 'test-hub',
    columnName,
    characteristicType: 'nominalIsBest',
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeHub(id: string, outcomes: OutcomeSpec[]): ProcessHub {
  return {
    ...DEFAULT_PROCESS_HUB,
    id,
    name: `Hub ${id}`,
    createdAt: NOW,
    deletedAt: null,
    processGoal: 'Test hub goal.',
    outcomes: outcomes.map(outcome => ({ ...outcome, hubId: id })),
  };
}

function renderApp() {
  return render(
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
}

async function importVrsThroughHome(hub: ProcessHub, rawData: DataRow[]) {
  useProjectStore.setState({
    ...getProjectInitialState(),
    rawData,
    outcome: hub.outcomes?.[0]?.columnName ?? null,
  });
  useCanvasStore.setState({
    ...getCanvasInitialState(),
    outcomes: hub.outcomes ?? [],
    primaryScopeDimensions: hub.primaryScopeDimensions ?? [],
    canonicalMap: hub.canonicalProcessMap ?? getCanvasInitialState().canonicalMap,
    canonicalMapVersion: hub.canonicalMapVersion ?? 'canvas-map-0',
  });
  const json = buildDocumentSnapshotVrs({ activeHub: hub });
  const file = new File([json], 'scenario.vrs', { type: 'application/json' });
  useProjectStore.setState({
    rawData: [],
    outcome: null,
    factors: [],
  });
  useCanvasStore.setState(getCanvasInitialState());

  renderApp();
  const input = (await screen.findByLabelText(/import.*\.vrs/i)) as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

describe('PWA framing toolbar — OutcomePin per outcome (F3)', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await Promise.all([
      db.meta.clear(),
      db.hubs.clear(),
      db.outcomes.clear(),
      db.canvasState.clear(),
    ]);
    // Reset the project store so previous tests' rawData / outcome don't leak.
    useProjectStore.setState({
      rawData: [],
      outcome: null,
      factors: [],
    });
    useCanvasStore.setState(getCanvasInitialState());
  });

  it('renders one OutcomePin for a single-outcome hub with data', async () => {
    const hub = makeHub('test-hub-1', [makeOutcome('out-1', 'FillWeight')]);
    await importVrsThroughHome(hub, [{ FillWeight: 23.5 }, { FillWeight: 24.1 }]);

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(1);
      },
      { timeout: 4000 }
    );
  });

  it('renders two OutcomePins for a two-outcome hub with data', async () => {
    const hub = makeHub('test-hub-2', [
      makeOutcome('out-1', 'FillWeight'),
      makeOutcome('out-2', 'CycleTime'),
    ]);
    await importVrsThroughHome(hub, [
      { FillWeight: 23.5, CycleTime: 5.2 },
      { FillWeight: 24.1, CycleTime: 5.4 },
    ]);

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(2);
      },
      { timeout: 4000 }
    );
  });

  it('reflects an outcome added via dispatch on rerender', async () => {
    const hub = makeHub('test-hub-add', [makeOutcome('out-1', 'FillWeight')]);
    await pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    // Add a second outcome via the dispatch boundary (the contract used by
    // the framing flow). Then re-persist the hub-of-one with the joined view
    // so AppMain's restore effect picks up the new outcomes set.
    await pwaHubRepository.dispatch({
      kind: 'OUTCOME_ADD',
      hubId: 'test-hub-add',
      outcome: { ...makeOutcome('out-2', 'CycleTime'), hubId: 'test-hub-add' },
    });
    const restored = await pwaHubRepository.hubs.get('test-hub-add');
    expect(restored?.outcomes).toHaveLength(2);
    await importVrsThroughHome(restored!, [
      { FillWeight: 23.5, CycleTime: 5.2 },
      { FillWeight: 24.1, CycleTime: 5.4 },
    ]);

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(2);
      },
      { timeout: 4000 }
    );
  });

  it('archived outcomes are filtered out (deletedAt === null filter)', async () => {
    const hub = makeHub('test-hub-arch', [
      makeOutcome('out-1', 'FillWeight'),
      makeOutcome('out-2', 'CycleTime'),
    ]);
    await pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    // Archive one outcome via the dispatch boundary (soft-delete).
    await pwaHubRepository.dispatch({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'out-2' });

    const restored = await pwaHubRepository.hubs.get('test-hub-arch');
    expect(restored?.outcomes).toHaveLength(1);
    expect(restored?.outcomes?.[0].id).toBe('out-1');

    await importVrsThroughHome(restored!, [
      { FillWeight: 23.5, CycleTime: 5.2 },
      { FillWeight: 24.1, CycleTime: 5.4 },
    ]);

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(1);
      },
      { timeout: 4000 }
    );
  });
});
