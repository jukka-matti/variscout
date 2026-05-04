// apps/pwa/src/__tests__/outcomePinMulti.test.tsx
//
// Verifies that the framing toolbar renders one OutcomePin per outcome entry
// in sessionHub.outcomes (not just outcomes[0]).
//
// vi.mock() BEFORE imports — testing.md invariant.
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Stub heavy components to keep renders fast in jsdom.
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
import { hubRepository } from '../db/hubRepository';
import { useProjectStore } from '@variscout/stores';
import { registerLocaleLoaders, type MessageCatalog } from '@variscout/core';

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

describe('PWA framing toolbar — OutcomePin per outcome', () => {
  beforeEach(async () => {
    await hubRepository.clearAll();
    // Reset the project store so rawData and outcome are cleared between tests.
    useProjectStore.setState({
      rawData: [],
      outcome: null,
      factors: [],
    });
  });

  it('renders one OutcomePin for a single-outcome hub with data', async () => {
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub({
      id: 'test-hub',
      name: 'Test Hub',
      createdAt: new Date().toISOString(),
      processGoal: 'Single outcome hub.',
      outcomes: [{ columnName: 'FillWeight', characteristicType: 'nominalIsBest' }],
    });

    // Seed raw data so the framing toolbar becomes visible.
    useProjectStore.setState({
      rawData: [{ FillWeight: 23.5 }, { FillWeight: 24.1 }],
      outcome: 'FillWeight',
    });

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
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub({
      id: 'test-hub-2',
      name: 'Test Hub 2',
      createdAt: new Date().toISOString(),
      processGoal: 'Multi-outcome hub.',
      outcomes: [
        { columnName: 'FillWeight', characteristicType: 'nominalIsBest' },
        { columnName: 'CycleTime', characteristicType: 'smallerIsBetter' },
      ],
    });

    useProjectStore.setState({
      rawData: [
        { FillWeight: 23.5, CycleTime: 5.2 },
        { FillWeight: 24.1, CycleTime: 5.4 },
      ],
      outcome: 'FillWeight',
    });

    renderApp();

    await waitFor(
      () => {
        const pins = screen.getAllByTestId('outcome-pin');
        expect(pins).toHaveLength(2);
      },
      { timeout: 4000 }
    );
  });
});
