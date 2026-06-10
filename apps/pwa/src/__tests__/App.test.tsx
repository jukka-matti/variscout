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
import Dexie from 'dexie';
import type { AnalysisBrief } from '@variscout/core';

// Capture the StageFiveModal onOpenInvestigation callback for Stage-5 draft tests.
const stageFiveCapture = vi.hoisted(() => ({
  onOpenInvestigation: undefined as ((brief: AnalysisBrief) => void) | undefined,
}));

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    CapabilitySuggestionModal: () => <div data-testid="capability-suggestion-modal" />,
    StageFiveModal: (props: { onOpenInvestigation: (brief: AnalysisBrief) => void }) => {
      stageFiveCapture.onOpenInvestigation = props.onOpenInvestigation;
      return null;
    },
  };
});

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

import { render, act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { LocaleProvider } from '../context/LocaleContext';
import { db } from '../db/schema';
import { registerLocaleLoaders, type MessageCatalog } from '@variscout/core';
import { usePanelsStore, initialPanelsState } from '../features/panels/panelsStore';
import {
  useProjectStore,
  useAnalyzeStore,
  useProjectMembershipStore,
  projectMembershipStorageKey,
  type DocumentSnapshot,
} from '@variscout/stores';

// Register locale loaders (mirrors main.tsx) so useTranslation works.
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>(
    '../../../../packages/core/src/i18n/messages/*.ts',
    { eager: false }
  )
);

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

async function seedLegacyDocumentSnapshot(processGoal: string) {
  db.close();
  await db.delete();

  const legacyDb = new Dexie('variscout-pwa-normalized');
  legacyDb.version(11).stores(LEGACY_DOCUMENT_SNAPSHOT_STORES);
  await legacyDb.open();
  await legacyDb.table('meta').put({ key: 'persistence.optIn', value: true });
  await legacyDb.table('documentSnapshots').put({
    key: 'current',
    savedAt: new Date().toISOString(),
    snapshot: {
      schemaVersion: 1,
      hubId: 'legacy-hub',
      hub: {
        id: 'legacy-hub',
        name: 'Legacy hub',
        processGoal,
        createdAt: 1_700_000_000_000,
        deletedAt: null,
      },
      project: {
        projectId: 'legacy-hub',
        projectName: 'Legacy hub',
        rawData: [{ value: 1 }],
        outcome: 'value',
        factors: [],
        specs: {},
        analysisMode: 'standard',
        processContext: { processHubId: 'legacy-hub' },
        entryScenario: null,
      },
      analyze: { findings: [], categories: [], hypotheses: [], causalLinks: [], scopes: [] },
      canvas: {
        canonicalMap: {
          version: 1,
          nodes: [],
          tributaries: [],
          assignments: {},
          arrows: [],
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
        outcomes: [],
        primaryScopeDimensions: [],
        canonicalMapVersion: 'canvas-map-0',
      },
      improvementProject: null,
    } satisfies DocumentSnapshot,
  });
  legacyDb.close();
  await db.open();
}

function renderApp() {
  return render(
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
}

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
      renderApp();
    });

    const warningCalls = consoleError.mock.calls.filter(
      (args: unknown[]) =>
        typeof args[0] === 'string' && /Cannot update a component.*while rendering/i.test(args[0])
    );

    expect(warningCalls).toHaveLength(0);
  });

  it('calling showFrame() after mount does not produce a setState-in-render warning', async () => {
    await act(async () => {
      renderApp();
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

describe('PWA export-only startup persistence', () => {
  beforeEach(async () => {
    useProjectStore.setState({ rawData: [], outcome: null, factors: [] });
    usePanelsStore.setState(initialPanelsState);
  });

  afterEach(async () => {
    useProjectStore.setState({ rawData: [], outcome: null, factors: [] });
    usePanelsStore.setState(initialPanelsState);
  });

  it('does not hydrate from a stale browser documentSnapshots row on startup', async () => {
    await seedLegacyDocumentSnapshot('Stale browser snapshot should stay ignored.');

    const { unmount } = renderApp();

    expect(await screen.findByTestId('home-paste-button')).toBeInTheDocument();
    await expect(screen.findByTestId('goal-banner', {}, { timeout: 500 })).rejects.toThrow();
    expect(screen.queryByTestId('save-to-browser-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('save-to-browser-saved')).not.toBeInTheDocument();

    unmount();
  });
});

const capabilityRows = Array.from({ length: 12 }, (_, index) => ({
  Cycle_Time: 40 + index,
  Machine: index % 2 === 0 ? 'A' : 'B',
}));

function setCapabilitySuggestionFixture(processMapNodes: Array<{ id: string; name: string }>) {
  useProjectStore.setState({
    rawData: capabilityRows,
    outcome: 'Cycle_Time',
    factors: ['Machine'],
    specs: { usl: 60 },
    processContext: {
      processMap: {
        version: 1,
        nodes: processMapNodes.map((node, order) => ({ ...node, order })),
        tributaries: [],
        createdAt: '2026-06-06T00:00:00.000Z',
        updatedAt: '2026-06-06T00:00:00.000Z',
      },
    },
  });
  usePanelsStore.setState({ ...initialPanelsState, activeView: 'frame' });
}

describe('CapabilitySuggestionModal — FSJ-5 PWA retirement', () => {
  beforeEach(() => {
    useProjectStore.setState({
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      processContext: null,
    });
    usePanelsStore.setState(initialPanelsState);
  });

  afterEach(() => {
    useProjectStore.setState({
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      processContext: null,
    });
    usePanelsStore.setState(initialPanelsState);
  });

  it('does not render over the Process b0 landing surface', async () => {
    setCapabilitySuggestionFixture([]);

    await act(async () => {
      renderApp();
    });

    expect(screen.getByTestId('frame-view-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('capability-suggestion-modal')).toBeNull();
  });

  it('does not render after the Process surface has an authored step', async () => {
    setCapabilitySuggestionFixture([{ id: 'step-1', name: 'Bake' }]);

    await act(async () => {
      renderApp();
    });

    expect(screen.queryByTestId('capability-suggestion-modal')).toBeNull();
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

describe('PendingInvitesBanner — mounted in App.tsx Home view (Workspace Project launchpad path)', () => {
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
      renderApp();
    });

    expect(screen.getByRole('region', { name: /pending invitations/i })).toBeInTheDocument();
  });
});

describe('Stage-5 hypothesisDraft → proposed Hypothesis hub (PO-6)', () => {
  beforeEach(async () => {
    useAnalyzeStore.setState({ hypotheses: [] });
    usePanelsStore.setState(initialPanelsState);
    stageFiveCapture.onOpenInvestigation = undefined;
    await act(async () => {
      renderApp();
    });
  });

  afterEach(() => {
    useAnalyzeStore.setState({ hypotheses: [] });
    usePanelsStore.setState(initialPanelsState);
  });

  it('Stage-5 hypothesisDraft creates exactly one proposed hub', () => {
    act(() => {
      stageFiveCapture.onOpenInvestigation!({ hypothesisDraft: 'Resin lot drift' });
    });
    const hubs = useAnalyzeStore.getState().hypotheses;
    expect(hubs).toHaveLength(1);
    expect(hubs[0].name).toBe('Resin lot drift');
    expect(hubs[0].status).toBe('proposed');
  });

  it('NEGATIVE: a blank brief creates zero hubs', () => {
    act(() => {
      stageFiveCapture.onOpenInvestigation!({});
    });
    expect(useAnalyzeStore.getState().hypotheses).toHaveLength(0);
  });
});
