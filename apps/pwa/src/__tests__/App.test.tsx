// apps/pwa/src/__tests__/App.test.tsx
//
// Regression: bare usePanelsStore() whole-store subscription in useAppPanels
// triggered React 19 Strict-Mode tearing detection, producing:
//   "Cannot update a component (AppMain) while rendering a different component"
//
// Reproduces the trigger path: mount App → call showFrame() on the panels store
// (simulates Frame-tab activation) → assert zero setState-in-render warnings.
//
// vi.mock() blocks MUST come before any component imports (testing.md invariant).
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

import { render, act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { LocaleProvider } from '../context/LocaleContext';
import { registerLocaleLoaders, type MessageCatalog } from '@variscout/core';
import { usePanelsStore, initialPanelsState } from '../features/panels/panelsStore';
import {
  useProjectStore,
  useProjectMembershipStore,
  projectMembershipStorageKey,
} from '@variscout/stores';

// Register locale loaders (mirrors main.tsx) so useTranslation works.
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>(
    '../../../../packages/core/src/i18n/messages/*.ts',
    { eager: false }
  )
);

describe('setState-in-render regression — useAppPanels individual selectors', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset panels store so test isolation is guaranteed.
    usePanelsStore.setState(initialPanelsState);
    // Spy BEFORE render so any synchronous warning during mount is captured.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('mounting App does not produce a setState-in-render warning', async () => {
    await act(async () => {
      render(
        <LocaleProvider>
          <App />
        </LocaleProvider>
      );
    });

    const warningCalls = consoleError.mock.calls.filter(
      (args: unknown[]) =>
        typeof args[0] === 'string' && /Cannot update a component.*while rendering/i.test(args[0])
    );

    expect(warningCalls).toHaveLength(0);
  });

  it('calling showFrame() after mount does not produce a setState-in-render warning', async () => {
    await act(async () => {
      render(
        <LocaleProvider>
          <App />
        </LocaleProvider>
      );
    });

    // Reset spy counts after mount so we only capture the showFrame transition.
    consoleError.mockClear();

    await act(async () => {
      usePanelsStore.getState().showFrame();
    });

    const warningCalls = consoleError.mock.calls.filter(
      (args: unknown[]) =>
        typeof args[0] === 'string' && /Cannot update a component.*while rendering/i.test(args[0])
    );

    expect(warningCalls).toHaveLength(0);
  });
});

// Minimal invite fixture — only the fields PendingInvitesBanner reads.
const testInvite = {
  id: 'inv-test-1',
  projectId: 'proj-test-1',
  userId: 'user-test-1',
  displayName: 'Test User',
  role: 'member' as const,
  invitedAt: 1_700_000_000_000,
  status: 'pending' as const,
  createdAt: 1_700_000_000_000,
  deletedAt: null,
};

describe('PendingInvitesBanner — mounted in App.tsx Home view (active-IP launchpad path)', () => {
  beforeEach(() => {
    // Non-empty rawData so the HomeScreen empty-state branch is skipped and the
    // panels.activeView branch is reached.
    useProjectStore.setState({ rawData: [{ x: 1 }] as never });
    // Put the app on the Home view so panels.activeView === 'home' triggers.
    usePanelsStore.setState({ ...initialPanelsState, activeView: 'home' });
    // Seed one pending invitation so the banner renders (non-null).
    // PWA uses 'analyst@local' as the stable per-user membership key (see App.tsx).
    // Write to BOTH localStorage and in-memory state: App.tsx mounts a useEffect
    // that calls `rehydrateInvites(userId)`, which reads from localStorage and
    // would otherwise clobber an in-memory-only seed.
    const membershipKey = projectMembershipStorageKey('analyst@local');
    localStorage.setItem(membershipKey, JSON.stringify([testInvite]));
    useProjectMembershipStore.setState({ invitesByUser: { [membershipKey]: [testInvite] } });
  });

  afterEach(() => {
    // Restore stores to their initial state after each test.
    useProjectStore.setState({ rawData: [], outcome: null, factors: [] });
    usePanelsStore.setState(initialPanelsState);
    useProjectMembershipStore.setState(useProjectMembershipStore.getInitialState());
    localStorage.removeItem(projectMembershipStorageKey('analyst@local'));
  });

  it('renders PendingInvitesBanner above the launchpad when on the Home view with pending invites', async () => {
    await act(async () => {
      render(
        <LocaleProvider>
          <App />
        </LocaleProvider>
      );
    });

    expect(screen.getByRole('region', { name: /pending invitations/i })).toBeInTheDocument();
  });
});
