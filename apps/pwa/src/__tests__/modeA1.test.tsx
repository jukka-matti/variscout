// apps/pwa/src/__tests__/modeA1.test.tsx
//
// R6d — PWA durable persistence is export-only.
//
// Verifies that on App mount:
//   - no imported .vrs → user lands on HomeScreen
//   - stale documentSnapshots rows from older builds do not hydrate on startup
//
// vi.mock() must come BEFORE any imports of components under test (testing.md
// invariant). The full Dashboard / view trees are stubbed so the mounted App
// renders quickly in jsdom.
import 'fake-indexeddb/auto';
import { vi } from 'vitest';
import Dexie from 'dexie';

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
vi.mock('../workers/useStatsWorker', () => ({
  useStatsWorker: () => null,
}));

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { LocaleProvider } from '../context/LocaleContext';
import { db } from '../db/schema';
import { DEFAULT_PROCESS_HUB, registerLocaleLoaders, type MessageCatalog } from '@variscout/core';
import { useProjectStore, type DocumentSnapshot } from '@variscout/stores';

const EMPTY_CANONICAL_MAP = {
  version: 1,
  nodes: [],
  tributaries: [],
  assignments: {},
  arrows: [],
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const LEGACY_DOCUMENT_SNAPSHOT_STORES = {
  hubs: '&id, deletedAt',
  outcomes: '&id, hubId, deletedAt',
  evidenceSnapshots: '&id, hubId, capturedAt, deletedAt',
  rowProvenance: '&id, snapshotId',
  evidenceSources: '&id, hubId, deletedAt',
  evidenceSourceCursors: '&id, sourceId',
  investigations: '&id, hubId, deletedAt',
  findings: '&id, investigationId, deletedAt',
  causalLinks: '&id, investigationId, deletedAt',
  hypotheses: '&id, investigationId, deletedAt',
  improvementProjects: '&id, hubId, deletedAt, status, updatedAt',
  actionItems:
    '&id, hubId, stepId, parentImprovementProjectId, parentImprovementIdeaId, status, deletedAt, createdAt',
  controlRecords: '&id, investigationId, hubId, nextReviewDue, updatedAt, deletedAt',
  controlReviews: '&id, recordId, investigationId, hubId, reviewedAt',
  controlHandoffs: '&id, investigationId, hubId, status, handoffDate, deletedAt',
  canvasState: '&hubId',
  meta: '&key',
  measurementPlans: '&id, hypothesisId, status, deletedAt',
  documentSnapshots: '&key, savedAt',
};

registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>(
    '../../../../packages/core/src/i18n/messages/*.ts',
    { eager: false }
  )
);

function renderApp() {
  return render(
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
}

async function seedLegacyDocumentSnapshot(processGoal: string) {
  db.close();
  await db.delete();

  const snapshot = {
    schemaVersion: 1,
    hubId: DEFAULT_PROCESS_HUB.id,
    hub: {
      id: DEFAULT_PROCESS_HUB.id,
      name: DEFAULT_PROCESS_HUB.name,
      processGoal,
      createdAt: DEFAULT_PROCESS_HUB.createdAt,
      deletedAt: DEFAULT_PROCESS_HUB.deletedAt,
    },
    project: {
      projectId: DEFAULT_PROCESS_HUB.id,
      projectName: DEFAULT_PROCESS_HUB.name,
      rawData: [{ value: 1 }, { value: 2 }],
      outcome: 'value',
      factors: [],
      specs: {},
      analysisMode: 'standard',
      processContext: { processHubId: DEFAULT_PROCESS_HUB.id },
      entryScenario: null,
    },
    analyze: { findings: [], categories: [], hypotheses: [], causalLinks: [], scopes: [] },
    canvas: {
      canonicalMap: DEFAULT_PROCESS_HUB.canonicalProcessMap ?? EMPTY_CANONICAL_MAP,
      outcomes: [
        {
          id: 'outcome-value',
          hubId: DEFAULT_PROCESS_HUB.id,
          columnName: 'value',
          characteristicType: 'nominalIsBest',
          createdAt: DEFAULT_PROCESS_HUB.createdAt,
          deletedAt: null,
        },
      ],
      primaryScopeDimensions: [],
      canonicalMapVersion: DEFAULT_PROCESS_HUB.canonicalMapVersion ?? 'canvas-map-0',
    },
    improvementProject: null,
  } as unknown as DocumentSnapshot;

  const legacyDb = new Dexie('variscout-pwa-normalized');
  legacyDb.version(11).stores(LEGACY_DOCUMENT_SNAPSHOT_STORES);
  await legacyDb.open();
  await legacyDb.table('meta').put({ key: 'persistence.optIn', value: true });
  await legacyDb.table('documentSnapshots').put({
    key: 'current',
    snapshot,
    savedAt: new Date().toISOString(),
  });
  legacyDb.close();
  await db.open();
}

describe('PWA export-only startup persistence (R6d)', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await Promise.all([
      db.meta.clear(),
      db.hubs.clear(),
      db.outcomes.clear(),
      db.canvasState.clear(),
    ]);
    useProjectStore.setState({
      rawData: [],
      outcome: null,
      factors: [],
    });
  });

  it('with no imported .vrs: lands on HomeScreen', async () => {
    renderApp();

    await waitFor(
      () => {
        expect(screen.getByTestId('home-paste-button')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('with stale browser documentSnapshot persisted: still lands on HomeScreen', async () => {
    await seedLegacyDocumentSnapshot('Ignored stale goal.');

    const { unmount } = renderApp();

    await waitFor(() => expect(screen.getByTestId('home-paste-button')).toBeInTheDocument(), {
      timeout: 4000,
    });
    await expect(screen.findByTestId('goal-banner', {}, { timeout: 500 })).rejects.toThrow();
    unmount();
  });
});
