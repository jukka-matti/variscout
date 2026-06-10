// apps/pwa/src/__tests__/modeA1.test.tsx
//
// R6d — PWA durable persistence is export-only.
//
// Verifies that on App mount:
//   - no imported .vrs → user lands on HomeScreen
//   - current IndexedDB hub rows do not hydrate on startup
//
// vi.mock() must come BEFORE any imports of components under test (testing.md
// invariant). The full Dashboard / view trees are stubbed so the mounted App
// renders quickly in jsdom.
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

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
import { useProjectStore } from '@variscout/stores';

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

async function seedCurrentIndexedDbHub(processGoal: string) {
  if (!db.isOpen()) await db.open();
  await Promise.all([
    db.meta.clear(),
    db.hubs.clear(),
    db.outcomes.clear(),
    db.canvasState.clear(),
  ]);
  await db.meta.put({ key: 'persistence.optIn', value: true });
  await db.hubs.put({
    id: DEFAULT_PROCESS_HUB.id,
    name: DEFAULT_PROCESS_HUB.name,
    processGoal,
    createdAt: DEFAULT_PROCESS_HUB.createdAt,
    deletedAt: DEFAULT_PROCESS_HUB.deletedAt,
  });
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

  it('with a browser-local IndexedDB hub persisted: still lands on HomeScreen', async () => {
    await seedCurrentIndexedDbHub('Ignored saved goal.');

    const { unmount } = renderApp();

    await waitFor(() => expect(screen.getByTestId('home-paste-button')).toBeInTheDocument(), {
      timeout: 4000,
    });
    await expect(screen.findByTestId('goal-banner', {}, { timeout: 500 })).rejects.toThrow();
    unmount();
  });
});
