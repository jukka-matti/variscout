import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';

// ── Provide IndexedDB polyfill for Zustand persist middleware (preferencesStore) ──
import 'fake-indexeddb/auto';

import { Editor } from '../Editor';
import * as StorageModule from '../../services/storage';
import { azurePersistenceAdapter } from '../../lib/persistenceAdapter';
import { usePanelsStore } from '../../features/panels/panelsStore';
import {
  useProjectStore,
  useAnalyzeStore,
  usePreferencesStore,
  useProjectMembershipStore,
  getProjectMembershipInitialState,
  projectMembershipStorageKey,
} from '@variscout/stores';
import type { Invitation } from '@variscout/core/projectMembership';
import type { AnalysisBrief } from '@variscout/core';

const { mockUseAutoSave, stageFiveCapture } = vi.hoisted(() => ({
  mockUseAutoSave: vi.fn(),
  stageFiveCapture: {
    onOpenInvestigation: undefined as ((brief: AnalysisBrief) => void) | undefined,
  },
}));

// ── Mock child components ──

vi.mock('../../components/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));

vi.mock('../../components/FindingsPanel', () => ({
  default: () => <div data-testid="findings-panel">FindingsPanel</div>,
}));

vi.mock('../../components/data/ManualEntry', () => ({
  default: () => <div data-testid="manual-entry">ManualEntry</div>,
}));

vi.mock('../../components/data/PasteScreen', () => ({
  default: ({
    onAnalyze,
    onCancel,
  }: {
    onAnalyze: (text: string) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="paste-screen">
      <button onClick={() => onAnalyze('Weight\tMachine\n10\tA')}>Analyze</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../../components/WhatIfPage', () => ({
  default: () => <div data-testid="what-if-page">WhatIfPage</div>,
}));

vi.mock('../../components/ProjectDashboard', () => ({
  default: () => <div data-testid="project-dashboard-mock">ProjectDashboard</div>,
}));

/**
 * HubCreationFlow is the Mode B router. In Editor integration tests we care
 * that the mapping UI surfaces — not about Stage 1 internals. Mock it to
 * expose the same data-testid as ColumnMapping so existing routing tests pass.
 */
vi.mock('../../features/hubCreation', () => ({
  HubCreationFlow: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (payload: {
      outcomes: Array<{ columnName: string; characteristicType: string }>;
      primaryScopeDimensions: string[];
      outcome: string;
      factors: string[];
    }) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="column-mapping">
      <button
        onClick={() =>
          onConfirm({
            outcomes: [{ columnName: 'Weight', characteristicType: 'nominalIsBest' }],
            primaryScopeDimensions: ['Machine'],
            outcome: 'Weight',
            factors: ['Machine'],
          })
        }
      >
        Confirm
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// ── Mock @variscout/core ──

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    parseText: vi.fn(async () => [{ Weight: 10, Machine: 'A' }]),
    detectColumns: vi.fn(() => ({ outcome: 'Weight', factors: ['Machine'], columnAnalysis: [] })),
    detectWideFormat: vi.fn(() => ({ isWideFormat: false, channels: [] })),
    validateData: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
    downloadCSV: vi.fn(),
    getNelsonRule2ViolationPoints: vi.fn(() => []),
    calculateStats: vi.fn(() => ({ mean: 10, ucl: 12, lcl: 8 })),
    isPreviewEnabled: vi.fn(() => false),
    buildSuggestedQuestions: vi.fn(() => []),
    computeIdeaImpact: vi.fn(() => null),
    getNelsonRule2Sequences: vi.fn(() => []),
    getNelsonRule3Sequences: vi.fn(() => []),
    calculateStagedComparison: vi.fn(() => null),
    djb2Hash: vi.fn((str: string) => String(str.length)),
    // ADR-029: Action tools
    parseActionMarkers: vi.fn(() => []),
    isDuplicateProposal: vi.fn(() => false),
    formatKnowledgeContext: vi.fn(() => ''),
    computeFilterPreview: vi.fn(() => ({ samples: 0, mean: 0, stdDev: 0 })),
    hashFilterStack: vi.fn(() => ''),
    generateProposalId: vi.fn(() => 'test-proposal-id'),
    getEtaSquared: vi.fn(() => 0),
    groupDataByFactor: vi.fn(() => new Map()),
  };
});

vi.mock('../../hooks/usePhotoComments', () => ({
  usePhotoComments: () => ({
    handleAddPhoto: vi.fn(),
    handleAddCommentWithAuthor: vi.fn(),
  }),
}));

vi.mock('../../auth/getCurrentUser', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({ name: 'Test User', email: 'test@test.com' })),
}));

vi.mock('../../auth/easyAuth', () => ({
  getEasyAuthUser: vi.fn(() =>
    Promise.resolve({
      name: 'Test User',
      email: 'test@test.com',
      userId: 'test-user-id',
      roles: [],
    })
  ),
}));

vi.mock('../../context/LocaleContext', () => ({
  useLocale: () => ({ locale: 'en', isLocaleEnabled: true, setLocale: vi.fn() }),
}));

// ── Mock @variscout/ui ──

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    ColumnMapping: ({
      onConfirm,
      onCancel,
    }: {
      onConfirm: (payload: {
        outcomes: Array<{ columnName: string; characteristicType: string }>;
        primaryScopeDimensions: string[];
        outcome: string;
        factors: string[];
      }) => void;
      onCancel: () => void;
    }) => (
      <div data-testid="column-mapping">
        <button
          onClick={() =>
            onConfirm({
              outcomes: [{ columnName: 'Weight', characteristicType: 'nominalIsBest' }],
              primaryScopeDimensions: ['Machine'],
              outcome: 'Weight',
              factors: ['Machine'],
            })
          }
        >
          Confirm
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ),
    DataTableModalBase: () => null,
    AnalyzePrompt: () => null,
    CoScoutPanelBase: () => null,
    AIOnboardingTooltip: () => null,
    SessionClosePrompt: () => null,
    BrainstormModal: () => null,
    QuestionLinkPrompt: () => null,
    FactorPreviewOverlay: () => null,
    PIPanelBase: () => null,
    StatsTabContent: () => null,
    QuestionsTabContent: () => null,
    JournalTabContent: () => null,
    DocumentShelfBase: () => null,
    WhatIfExplorerPage: () => null,
    StageFiveModal: (props: { onOpenInvestigation: (brief: AnalysisBrief) => void }) => {
      stageFiveCapture.onOpenInvestigation = props.onOpenInvestigation;
      return null;
    },
    computePresets: vi.fn(() => undefined),
    useIsMobile: () => false,
    useGlossary: () => ({ getTerm: (key: string) => key }),
    BREAKPOINTS: { phone: 640, mobile: 768, desktop: 1024, large: 1280 },
  };
});

// ── Mock @variscout/data ──

vi.mock('@variscout/data', () => ({
  SAMPLES: [
    {
      name: 'Coffee Roast',
      description: 'Coffee roasting temperature data',
      icon: 'Coffee',
      urlKey: 'coffee',
      category: 'cases',
      featured: true,
      data: [{ Temp: 200, Roaster: 'A' }],
      config: { outcome: 'Temp', factors: ['Roaster'], specs: {} },
    },
    {
      name: 'Bottleneck',
      description: 'Production bottleneck analysis',
      icon: 'Factory',
      urlKey: 'bottleneck',
      category: 'cases',
      featured: true,
      data: [{ CycleTime: 30, Line: 'L1' }],
      config: { outcome: 'CycleTime', factors: ['Line'], specs: {} },
    },
  ],
}));

// ── Mock hooks ──

vi.mock('../../hooks/useDataIngestion', () => ({
  useDataIngestion: () => ({
    handleFileUpload: vi.fn(),
    loadSample: vi.fn(),
  }),
}));

vi.mock('../../hooks/useAutoSave', () => ({
  useAutoSave: mockUseAutoSave,
}));

vi.mock('../../hooks', () => ({
  useFilterNavigation: () => ({
    filterStack: [],
    applyFilter: vi.fn(),
    clearFilters: vi.fn(),
    updateFilterValues: vi.fn(),
    removeFilter: vi.fn(),
  }),
}));

// ── Mock workers ──

vi.mock('../../workers/useStatsWorker', () => ({
  useStatsWorker: () => null,
}));

// ── Mock local IndexedDB façade ──

vi.mock('../../services/localDb', () => ({
  listProcessHubs: vi.fn(() => Promise.resolve([])),
  saveEvidenceSnapshotToIndexedDB: vi.fn(() => Promise.resolve()),
  listControlRecordsFromIndexedDB: vi.fn(() => Promise.resolve([])),
  listReviewRecordsFromIndexedDB: vi.fn(() => Promise.resolve([])),
  listControlHandoffsFromIndexedDB: vi.fn(() => Promise.resolve([])),
}));

// ── Mock persistence adapter ──

vi.mock('../../lib/persistenceAdapter', () => ({
  azurePersistenceAdapter: {
    saveProject: vi.fn(() => Promise.resolve({ id: 'test', name: 'Test' })),
    loadProject: vi.fn(() => Promise.resolve(null)),
    listProjects: vi.fn(() => Promise.resolve([])),
    deleteProject: vi.fn(() => Promise.resolve()),
    renameProject: vi.fn(() => Promise.resolve()),
    exportProject: vi.fn(),
    importProject: vi.fn(() => Promise.resolve()),
  },
  setDefaultLocation: vi.fn(),
}));

// ── Mock storage ──

vi.mock('../../services/storage', () => ({
  useStorage: vi.fn(() => ({
    saveProject: vi.fn(),
    listProjects: vi.fn(() => Promise.resolve([])),
    listProcessHubs: vi.fn(() =>
      Promise.resolve([{ id: 'general-unassigned', name: 'General / Unassigned', createdAt: '' }])
    ),
    saveProcessHub: vi.fn(),
    listEvidenceSources: vi.fn(() => Promise.resolve([])),
    saveEvidenceSource: vi.fn(),
    listEvidenceSnapshots: vi.fn(() => Promise.resolve([])),
    saveEvidenceSnapshot: vi.fn(),
    syncStatus: { status: 'synced', message: 'Synced' },
  })),
  updateLastViewedAt: vi.fn(),
  classifySyncError: vi.fn(() => ({
    category: 'unknown',
    retryable: false,
    message: 'Unknown error',
  })),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    notifications: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

// ── Test helpers ──

const defaultProps = {
  projectId: 'test-123',
  onBack: vi.fn(),
};

/**
 * Seed Zustand stores with test data (replaces DataContext mocking)
 */
function seedStores(
  overrides: {
    rawData?: Record<string, unknown>[];
    outcome?: string | null;
    factors?: string[];
    specs?: Record<string, unknown>;
    projectName?: string | null;
    projectId?: string | null;
    displayOptions?: Record<string, unknown>;
    dataFilename?: string | null;
    analysisMode?: string;
    viewState?: Record<string, unknown> | null;
  } = {}
) {
  useProjectStore.setState({
    projectId: overrides.projectId ?? null,
    rawData: overrides.rawData ?? [],
    outcome: overrides.outcome ?? null,
    factors: overrides.factors ?? [],
    specs: overrides.specs ?? {},
    projectName: overrides.projectName === undefined ? 'Test Project' : overrides.projectName,
    displayOptions: overrides.displayOptions ?? {},
    dataFilename: overrides.dataFilename ?? null,
    dataQualityReport: null,
    analysisMode: (overrides.analysisMode as 'standard') ?? 'standard',
    filters: {},
    columnAliases: {},
    measureColumns: [],
    measureLabel: 'Measure',
    viewState: (overrides.viewState as null) ?? null,
    subgroupConfig: { method: 'fixed-size', size: 5 },
    cpkTarget: undefined,
    processContext: null,
    hasUnsavedChanges: false,
  } as Partial<ReturnType<typeof useProjectStore.getState>>);

  useAnalyzeStore.setState({
    findings: [],
    questions: [],
    categories: [],
  } as Partial<ReturnType<typeof useAnalyzeStore.getState>>);

  usePreferencesStore.setState({
    aiEnabled: false,
    knowledgeSearchFolder: null,
  } as Partial<ReturnType<typeof usePreferencesStore.getState>>);
}

function renderEditor(
  stateOverrides: Parameters<typeof seedStores>[0] = {},
  propOverrides: Partial<ComponentProps<typeof Editor>> = {}
) {
  seedStores(stateOverrides);
  return render(<Editor {...defaultProps} {...propOverrides} />);
}

// ── Tests ──

describe('Editor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Reset panelsStore activeView to default state
    usePanelsStore.setState({ activeView: 'explore' });

    // Re-apply storage mock after restoreAllMocks
    vi.mocked(StorageModule.useStorage).mockReturnValue({
      saveProject: vi.fn(),
      listProjects: vi.fn(() => Promise.resolve([])),
      listProcessHubs: vi.fn(() =>
        Promise.resolve([{ id: 'general-unassigned', name: 'General / Unassigned', createdAt: '' }])
      ),
      saveProcessHub: vi.fn(),
      listEvidenceSources: vi.fn(() => Promise.resolve([])),
      saveEvidenceSource: vi.fn(),
      listEvidenceSnapshots: vi.fn(() => Promise.resolve([])),
      saveEvidenceSnapshot: vi.fn(),
      syncStatus: { status: 'synced', message: 'Synced' },
    } as unknown as ReturnType<typeof StorageModule.useStorage>);
    vi.mocked(azurePersistenceAdapter.saveProject).mockImplementation(async (name, state) => ({
      id: `id-${name}`,
      name,
      state,
      savedAt: '2026-06-01T00:00:00.000Z',
      rowCount: state.project.rawData.length,
      location: 'personal',
    }));
    mockUseAutoSave.mockClear();

    // Reset stores to clean state
    seedStores();
    useProjectMembershipStore.setState(getProjectMembershipInitialState());
    localStorage.removeItem(projectMembershipStorageKey('test@test.com'));
  });

  it('renders empty state when rawData is empty', () => {
    renderEditor();

    expect(screen.getByText('Start Your Analysis')).toBeInTheDocument();
    expect(screen.getByText('Open from SharePoint')).toBeInTheDocument();
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
    expect(screen.getByText('Sample Datasets')).toBeInTheDocument();
  });

  it('shows logo mark and project name in header', () => {
    renderEditor({ projectName: 'My Analysis' });
    expect(screen.getByText('My Analysis')).toBeInTheDocument();
  });

  it('shows sync status indicator (wedge V1 — sync is always enabled)', () => {
    renderEditor();

    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('shows Stats sidebar toggle when data is loaded in analysis view', () => {
    usePanelsStore.setState({ activeView: 'explore' });
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByTestId('btn-stats-sidebar')).toBeInTheDocument();
  });

  it('shows CoScout toggle when data is loaded', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByTestId('btn-coscout')).toBeInTheDocument();
  });

  it('does not render a Save button (auto-save only)', () => {
    renderEditor();

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });

  it('shows ColumnMapping when data is loaded but no outcome selected', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: null,
    });

    expect(screen.getByTestId('column-mapping')).toBeInTheDocument();
  });

  it('shows project dashboard overview when data is loaded with projectId', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    // With projectId, loads into dashboard (overview) view first
    expect(screen.getByTestId('project-dashboard-mock')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-nav')).toBeInTheDocument();
  });

  it('shows explore view when Explore tab is clicked', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    // Click "Explore" tab to switch to dashboard EDA view
    fireEvent.click(screen.getByTestId('workflow-tab-explore'));

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('shows Add Data button when data is loaded in explore view', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    // Switch to explore view (may start in dashboard due to deep link logic)
    fireEvent.click(screen.getByTestId('workflow-tab-explore'));

    expect(screen.getByTestId('btn-add-data')).toBeInTheDocument();
  });

  it('renders sample dataset tiles in empty state', () => {
    renderEditor();

    expect(screen.getByText('Coffee Roast')).toBeInTheDocument();
    expect(screen.getByText('Bottleneck')).toBeInTheDocument();
    expect(screen.getByText('Coffee roasting temperature data')).toBeInTheDocument();
    expect(screen.getByText('Production bottleneck analysis')).toBeInTheDocument();
  });

  it('shows ColumnMapping after paste analyze', async () => {
    renderEditor();

    fireEvent.click(screen.getByText('Paste Data'));

    // PasteScreen renders
    expect(screen.getByTestId('paste-screen')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Analyze'));
    });

    expect(screen.getByTestId('column-mapping')).toBeInTheDocument();
  });

  it('skips ColumnMapping for pre-configured samples', () => {
    renderEditor();

    fireEvent.click(screen.getByTestId('sample-coffee'));

    // Pre-configured samples (with outcome + factors) skip ColumnMapping
    expect(screen.queryByTestId('column-mapping')).not.toBeInTheDocument();
  });

  it('first Save uses the cleaned data filename and establishes the active Azure identity', async () => {
    const saveToCloud = vi.fn(() => Promise.resolve());
    vi.mocked(StorageModule.useStorage).mockReturnValue({
      saveProject: saveToCloud,
      listProjects: vi.fn(() => Promise.resolve([])),
      listProcessHubs: vi.fn(() =>
        Promise.resolve([{ id: 'general-unassigned', name: 'General / Unassigned', createdAt: '' }])
      ),
      saveProcessHub: vi.fn(),
      listEvidenceSources: vi.fn(() => Promise.resolve([])),
      saveEvidenceSource: vi.fn(),
      listEvidenceSnapshots: vi.fn(() => Promise.resolve([])),
      saveEvidenceSnapshot: vi.fn(),
      syncStatus: { status: 'synced', message: 'Synced' },
    } as unknown as ReturnType<typeof StorageModule.useStorage>);

    renderEditor(
      {
        projectId: null,
        projectName: null,
        dataFilename: 'line_fill_data.csv',
        rawData: [{ Weight: 10, Machine: 'A' }],
        outcome: 'Weight',
        factors: ['Machine'],
      },
      { projectId: null }
    );

    const [onSave] = mockUseAutoSave.mock.calls.at(-1)!;
    await act(async () => {
      await onSave();
    });

    expect(azurePersistenceAdapter.saveProject).toHaveBeenCalledWith(
      'line fill data',
      expect.objectContaining({
        project: expect.objectContaining({ projectName: 'line fill data' }),
      })
    );
    expect(saveToCloud).toHaveBeenCalledWith(
      expect.objectContaining({
        project: expect.objectContaining({ projectName: 'line fill data' }),
      }),
      'line fill data',
      'personal'
    );
    expect(useProjectStore.getState()).toMatchObject({
      projectId: 'id-line fill data',
      projectName: 'line fill data',
    });
  });

  it('Save As creates a fork, makes it active, and does not rename the previous document', async () => {
    const saveToCloud = vi.fn(() => Promise.resolve());
    vi.mocked(StorageModule.useStorage).mockReturnValue({
      saveProject: saveToCloud,
      listProjects: vi.fn(() => Promise.resolve([])),
      listProcessHubs: vi.fn(() =>
        Promise.resolve([{ id: 'general-unassigned', name: 'General / Unassigned', createdAt: '' }])
      ),
      saveProcessHub: vi.fn(),
      listEvidenceSources: vi.fn(() => Promise.resolve([])),
      saveEvidenceSource: vi.fn(),
      listEvidenceSnapshots: vi.fn(() => Promise.resolve([])),
      saveEvidenceSnapshot: vi.fn(),
      syncStatus: { status: 'synced', message: 'Synced' },
    } as unknown as ReturnType<typeof StorageModule.useStorage>);
    vi.spyOn(window, 'prompt').mockReturnValue('Forked Analysis');

    renderEditor({
      projectId: 'id-Original Analysis',
      projectName: 'Original Analysis',
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    fireEvent.click(screen.getByRole('button', { name: /project menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /save as/i }));

    await waitFor(() => {
      expect(azurePersistenceAdapter.saveProject).toHaveBeenCalledWith(
        'Forked Analysis',
        expect.objectContaining({
          project: expect.objectContaining({ projectName: 'Forked Analysis' }),
        })
      );
    });
    expect(azurePersistenceAdapter.renameProject).not.toHaveBeenCalled();
    expect(saveToCloud).toHaveBeenCalledWith(expect.anything(), 'Forked Analysis', 'personal');
    expect(useProjectStore.getState()).toMatchObject({
      projectId: 'id-Forked Analysis',
      projectName: 'Forked Analysis',
    });
  });

  it('autosave is driven by the snapshot fingerprint only for active saved documents', () => {
    renderEditor({
      projectId: 'id-Test Project',
      projectName: 'Test Project',
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    const [, deps] = mockUseAutoSave.mock.calls.at(-1)!;
    expect(deps).toHaveLength(1);
    expect(typeof deps[0]).toBe('string');

    act(() => {
      useProjectStore.getState().setSpecs({ usl: 12 });
    });

    const [, nextDeps, nextEnabled] = mockUseAutoSave.mock.calls.at(-1)!;
    expect(nextDeps).toHaveLength(1);
    expect(nextDeps[0]).not.toBe(deps[0]);
    expect(nextEnabled).toBe(true);
  });

  it('does not autosave unsaved in-memory documents even when content changes', () => {
    renderEditor(
      {
        projectId: null,
        projectName: null,
        rawData: [{ Weight: 10, Machine: 'A' }],
        outcome: 'Weight',
        factors: ['Machine'],
      },
      { projectId: null }
    );

    act(() => {
      useProjectStore.getState().setSpecs({ usl: 12 });
    });

    const [, deps, enabled] = mockUseAutoSave.mock.calls.at(-1)!;
    expect(deps).toHaveLength(1);
    expect(enabled).toBe(false);
  });

  // ── PendingInvitesBanner integration ──

  const inviteA: Invitation = {
    id: 'inv-1',
    projectId: 'ip-1',
    createdAt: 1,
    deletedAt: null,
    userId: 'mira@org',
    displayName: 'Mira',
    role: 'member',
    invitedAt: 1,
    status: 'pending',
  };

  it('does not render the invitations banner when there are no pending invites', () => {
    renderEditor();
    expect(screen.queryByRole('region', { name: /pending invitations/i })).not.toBeInTheDocument();
  });

  it('renders the invitations banner when pending invites exist', async () => {
    // Editor reads currentUser.email as the membership user id (see Editor.tsx);
    // getCurrentUser is mocked to resolve 'test@test.com' at file top.
    // Seed BOTH localStorage and in-memory state: Editor mounts a useEffect that
    // calls `rehydrateInvites(userId)`, which reads from localStorage and would
    // otherwise clobber an in-memory-only seed. Banner appears only after the
    // async getCurrentUser() resolves — use findBy.
    const membershipKey = projectMembershipStorageKey('test@test.com');
    localStorage.setItem(membershipKey, JSON.stringify([inviteA]));
    useProjectMembershipStore.setState({ invitesByUser: { [membershipKey]: [inviteA] } });
    renderEditor();
    expect(await screen.findByRole('region', { name: /pending invitations/i })).toBeInTheDocument();
  });

  // ── Stage-5 hypothesisDraft → proposed Hypothesis hub (PO-6) ──

  describe('Stage-5 hypothesisDraft → proposed Hypothesis hub (PO-6)', () => {
    beforeEach(() => {
      useAnalyzeStore.setState({ hypotheses: [] });
      stageFiveCapture.onOpenInvestigation = undefined;
      renderEditor({
        rawData: [{ Weight: 10, Machine: 'A' }],
        outcome: 'Weight',
        factors: ['Machine'],
      });
    });

    afterEach(() => {
      useAnalyzeStore.setState({ hypotheses: [] });
    });

    it('Stage-5 hypothesisDraft creates exactly one proposed hub', async () => {
      await act(async () => {
        stageFiveCapture.onOpenInvestigation!({ hypothesisDraft: 'Resin lot drift' });
      });
      const hubs = useAnalyzeStore.getState().hypotheses;
      expect(hubs).toHaveLength(1);
      expect(hubs[0].name).toBe('Resin lot drift');
      expect(hubs[0].status).toBe('proposed');
    });

    it('NEGATIVE: a blank brief creates zero hubs', async () => {
      await act(async () => {
        stageFiveCapture.onOpenInvestigation!({});
      });
      expect(useAnalyzeStore.getState().hypotheses).toHaveLength(0);
    });
  });
});
