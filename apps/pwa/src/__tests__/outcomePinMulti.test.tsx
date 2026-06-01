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

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { LocaleProvider } from '../context/LocaleContext';
import { db } from '../db/schema';
import { setOptInFlag, pwaHubRepository } from '../persistence';
import { useProjectStore, type DocumentSnapshot } from '@variscout/stores';
import { DEFAULT_PROCESS_HUB, registerLocaleLoaders, type MessageCatalog } from '@variscout/core';
import type { OutcomeSpec, ProcessHub } from '@variscout/core/processHub';

const EMPTY_CANONICAL_MAP = {
  version: 1,
  nodes: [],
  tributaries: [],
  assignments: {},
  arrows: [],
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

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
    outcomes,
  };
}

function renderApp() {
  return render(
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
}

async function persistDocumentSnapshot(hub: ProcessHub, rawData: Array<Record<string, unknown>>) {
  const snapshot = {
    schemaVersion: 1,
    hubId: hub.id,
    hub: {
      id: hub.id,
      name: hub.name,
      processGoal: hub.processGoal,
      createdAt: hub.createdAt,
      updatedAt: hub.updatedAt,
      deletedAt: hub.deletedAt,
    },
    project: {
      projectId: hub.id,
      projectName: hub.name,
      rawData,
      outcome: hub.outcomes?.[0]?.columnName ?? null,
      factors: [],
      specs: {},
      analysisMode: 'standard',
      processContext: { processHubId: hub.id },
      entryScenario: null,
    },
    analyze: { findings: [], categories: [], hypotheses: [], causalLinks: [], scopes: [] },
    canvas: {
      canonicalMap: hub.canonicalProcessMap ?? EMPTY_CANONICAL_MAP,
      outcomes: hub.outcomes ?? [],
      primaryScopeDimensions: hub.primaryScopeDimensions ?? [],
      canonicalMapVersion: hub.canonicalMapVersion ?? 'canvas-map-0',
    },
    improvementProject: hub.improvementProject ?? null,
  } as unknown as DocumentSnapshot;

  await db.documentSnapshots.put({
    key: 'current',
    snapshot,
    savedAt: new Date().toISOString(),
  });
}

describe('PWA framing toolbar — OutcomePin per outcome (F3)', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await Promise.all([
      db.meta.clear(),
      db.hubs.clear(),
      db.outcomes.clear(),
      db.canvasState.clear(),
      db.documentSnapshots.clear(),
    ]);
    // Reset the project store so previous tests' rawData / outcome don't leak.
    useProjectStore.setState({
      rawData: [],
      outcome: null,
      factors: [],
    });
  });

  it('renders one OutcomePin for a single-outcome hub with data', async () => {
    await setOptInFlag(true);
    const hub = makeHub('test-hub-1', [makeOutcome('out-1', 'FillWeight')]);
    await persistDocumentSnapshot(hub, [{ FillWeight: 23.5 }, { FillWeight: 24.1 }]);

    renderApp();

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(1);
      },
      { timeout: 4000 }
    );
  });

  it('renders two OutcomePins for a two-outcome hub with data', async () => {
    await setOptInFlag(true);
    const hub = makeHub('test-hub-2', [
      makeOutcome('out-1', 'FillWeight'),
      makeOutcome('out-2', 'CycleTime'),
    ]);
    await persistDocumentSnapshot(hub, [
      { FillWeight: 23.5, CycleTime: 5.2 },
      { FillWeight: 24.1, CycleTime: 5.4 },
    ]);

    renderApp();

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(2);
      },
      { timeout: 4000 }
    );
  });

  it('reflects an outcome added via dispatch on rerender', async () => {
    await setOptInFlag(true);
    const hub = makeHub('test-hub-add', [makeOutcome('out-1', 'FillWeight')]);
    await pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    // Add a second outcome via the dispatch boundary (the contract used by
    // the framing flow). Then re-persist the hub-of-one with the joined view
    // so AppMain's restore effect picks up the new outcomes set.
    await pwaHubRepository.dispatch({
      kind: 'OUTCOME_ADD',
      hubId: 'test-hub-add',
      outcome: makeOutcome('out-2', 'CycleTime'),
    });
    const restored = await pwaHubRepository.hubs.get('test-hub-add');
    expect(restored?.outcomes).toHaveLength(2);
    // Re-persist so the restored hub-of-one has the freshly added outcome — the
    // F3 dispatch already wrote the new outcomes row, but a fresh snapshot
    // exercises the same write path the framing flow uses post-add.
    await persistDocumentSnapshot(restored!, [
      { FillWeight: 23.5, CycleTime: 5.2 },
      { FillWeight: 24.1, CycleTime: 5.4 },
    ]);

    renderApp();

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(2);
      },
      { timeout: 4000 }
    );
  });

  it('archived outcomes are filtered out (deletedAt === null filter)', async () => {
    await setOptInFlag(true);
    const hub = makeHub('test-hub-arch', [
      makeOutcome('out-1', 'FillWeight'),
      makeOutcome('out-2', 'CycleTime'),
    ]);
    await pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    // Archive one outcome via the dispatch boundary (soft-delete).
    await pwaHubRepository.dispatch({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'out-2' });

    // Re-persist the joined view so the restore effect sees only the live outcome.
    const restored = await pwaHubRepository.hubs.get('test-hub-arch');
    expect(restored?.outcomes).toHaveLength(1);
    expect(restored?.outcomes?.[0].id).toBe('out-1');

    await persistDocumentSnapshot(restored!, [
      { FillWeight: 23.5, CycleTime: 5.2 },
      { FillWeight: 24.1, CycleTime: 5.4 },
    ]);

    renderApp();

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(1);
      },
      { timeout: 4000 }
    );
  });
});
