// apps/pwa/src/__tests__/modeA1.test.tsx
//
// Mode A.1 — PWA reopen with persistence.
//
// Verifies that on app load:
//   - opt-in flag false → user lands on HomeScreen
//   - opt-in flag true + Hub saved → canvas restored with GoalBanner
//
// vi.mock() must come BEFORE any imports of components under test (testing.md rule).
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Stub heavy lazy-loaded components so the App can render quickly in jsdom.
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
import { hubRepository } from '../db/hubRepository';
import { DEFAULT_PROCESS_HUB, registerLocaleLoaders, type MessageCatalog } from '@variscout/core';

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

describe('Mode A.1 — PWA reopen with persistence', () => {
  beforeEach(async () => {
    await hubRepository.clearAll();
  });

  it('with opt-in flag false: lands on HomeScreen', async () => {
    renderApp();
    // HomeScreen surfaces the "Paste from Excel" affordance via a sample-section /
    // import button. We assert the heading or paste affordance is present.
    await waitFor(
      () => {
        expect(screen.getByTestId('home-paste-button')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('with opt-in flag true and Hub saved: restores canvas with goal banner', async () => {
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub({
      ...DEFAULT_PROCESS_HUB,
      processGoal: 'Restored goal.',
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
