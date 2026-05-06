// apps/pwa/src/__tests__/modeA1.test.tsx
//
// F3 P5 — Mode A.1 (PWA reopen with persistence) end-to-end behavior.
//
// Verifies that on App mount:
//   - opt-in flag false → user lands on HomeScreen (no Hub restore)
//   - opt-in flag true + persisted Hub → canvas restored, GoalBanner visible
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
vi.mock('../components/views/InvestigationView', () => ({
  default: () => <div data-testid="investigation-view-stub">InvestigationView</div>,
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
vi.mock('../components/YamazumiDashboard', () => ({
  default: () => <div data-testid="yamazumi-stub">Yamazumi</div>,
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
import { setOptInFlag, pwaHubRepository } from '../persistence';
import { DEFAULT_PROCESS_HUB, registerLocaleLoaders, type MessageCatalog } from '@variscout/core';
import { useProjectStore } from '@variscout/stores';

// Register locale loaders (mirrors main.tsx) so useTranslation works.
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

describe('Mode A.1 — PWA reopen with persistence (F3)', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    await Promise.all([
      db.meta.clear(),
      db.hubs.clear(),
      db.outcomes.clear(),
      db.canvasState.clear(),
    ]);
    // Reset the project store so prior test mutations don't leak rawData.
    useProjectStore.setState({
      rawData: [],
      outcome: null,
      factors: [],
    });
  });

  it('with opt-in flag false: lands on HomeScreen', async () => {
    renderApp();

    // HomeScreen surfaces the "Paste from Excel" affordance via data-testid.
    await waitFor(
      () => {
        expect(screen.getByTestId('home-paste-button')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('with opt-in flag true and Hub persisted: restores canvas with goal banner', async () => {
    await setOptInFlag(true);
    await pwaHubRepository.dispatch({
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: { ...DEFAULT_PROCESS_HUB, processGoal: 'Restored goal.' },
    });

    renderApp();

    await waitFor(
      () => {
        expect(screen.getByTestId('goal-banner')).toHaveTextContent('Restored goal');
      },
      { timeout: 4000 }
    );
  });
});
