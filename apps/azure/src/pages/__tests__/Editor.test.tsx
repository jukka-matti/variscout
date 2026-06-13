import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';

// ── Provide IndexedDB polyfill for Zustand persist middleware (preferencesStore) ──
import 'fake-indexeddb/auto';

import { Editor } from '../Editor';
import * as StorageModule from '../../services/storage';
import { azurePersistenceAdapter } from '../../lib/persistenceAdapter';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useUnsavedHubsStore } from '../../features/hubs/unsavedHubsStore';
import {
  useProjectStore,
  useAnalyzeStore,
  usePreferencesStore,
  useProjectMembershipStore,
  getProjectMembershipInitialState,
  projectMembershipStorageKey,
} from '@variscout/stores';
import type { Invitation } from '@variscout/core/projectMembership';
import type {
  AnalysisBrief,
  DefectDetection,
  DefectMapping,
  WideFormatDetection,
} from '@variscout/core';
import {
  computeDefectRates,
  detectColumns,
  detectDefectFormat,
  detectWideFormat,
  parseText,
} from '@variscout/core';

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

vi.mock('../../components/editor/FrameView', () => ({
  default: (props: {
    defectDetection?: DefectDetection | null;
    onAcceptDefectDetection?: (mapping: DefectMapping) => void;
    onDismissDefectDetection?: () => void;
    wideFormatDetection?: WideFormatDetection | null;
    onAcceptWideFormatDetection?: (columns: string[], label: string) => void;
    onDismissWideFormatDetection?: () => void;
  }) => (
    <div data-testid="frame-view">
      {props.defectDetection ? (
        <>
          <button
            type="button"
            onClick={() =>
              props.onAcceptDefectDetection?.({
                dataShape: props.defectDetection!.dataShape,
                aggregationUnit: props.defectDetection!.suggestedMapping.aggregationUnit ?? 'Batch',
                defectTypeColumn: props.defectDetection!.suggestedMapping.defectTypeColumn,
                unitsProducedColumn: props.defectDetection!.suggestedMapping.unitsProducedColumn,
              })
            }
          >
            Accept defect mode
          </button>
          <button type="button" onClick={() => props.onDismissDefectDetection?.()}>
            Dismiss defect mode
          </button>
        </>
      ) : null}
      {props.wideFormatDetection ? (
        <>
          <button
            type="button"
            onClick={() =>
              props.onAcceptWideFormatDetection?.(
                props.wideFormatDetection!.channels.map(channel => channel.id),
                'Channel'
              )
            }
          >
            Accept performance mode
          </button>
          <button type="button" onClick={() => props.onDismissWideFormatDetection?.()}>
            Dismiss performance mode
          </button>
        </>
      ) : null}
    </div>
  ),
}));

vi.mock('../../components/WhatIfPage', () => ({
  default: () => <div data-testid="what-if-page">WhatIfPage</div>,
}));

vi.mock('../../components/ProjectDashboard', () => ({
  default: () => <div data-testid="project-dashboard-mock">ProjectDashboard</div>,
}));

// FSJ-3b: HubCreationFlow deleted — the wizard demoted to ColumnMapping-only.
// Editor now renders @variscout/ui's ColumnMapping directly (mocked below), so
// the old '../../features/hubCreation' router mock retired. The mapping path is
// exercised via the ColumnMapping mock's data-testid="column-mapping".

// ── Mock @variscout/core ──

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    parseText: vi.fn(async () => [{ Weight: 10, Machine: 'A' }]),
    detectColumns: vi.fn(() => ({ outcome: 'Weight', factors: ['Machine'], columnAnalysis: [] })),
    detectWideFormat: vi.fn(() => ({
      isWideFormat: false,
      channels: [],
      metadataColumns: [],
      confidence: 'low',
      reason: 'No wide format detected',
    })),
    detectDefectFormat: vi.fn(() => ({
      isDefectFormat: false,
      confidence: 'low',
      dataShape: 'event-log',
      suggestedMapping: {},
    })),
    computeDefectRates: vi.fn(() => ({
      data: [{ Batch: 'B1', DefectRate: 0.1, DefectCount: 1 }],
      outcomeColumn: 'DefectRate',
      factors: ['Batch'],
    })),
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
    useGlossary: () => ({ getTerm: (key: string) => key }),
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
    saveProject: vi.fn(() => Promise.resolve({ status: 'saved' as const })),
    pendingConflict: null,
    dismissConflict: vi.fn(),
    reloadProjectFromCloud: vi.fn(() => Promise.resolve(null)),
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
    vi.mocked(parseText).mockResolvedValue([{ Weight: 10, Machine: 'A' }]);
    vi.mocked(detectColumns).mockReturnValue({
      outcome: 'Weight',
      factors: ['Machine'],
      columnAnalysis: [],
      timeColumn: null,
      confidence: 'high',
    });
    vi.mocked(detectWideFormat).mockReturnValue({
      isWideFormat: false,
      channels: [],
      metadataColumns: [],
      confidence: 'low',
      reason: 'No wide format detected',
    });
    vi.mocked(detectDefectFormat).mockReturnValue({
      isDefectFormat: false,
      confidence: 'low',
      dataShape: 'event-log',
      suggestedMapping: {},
    });
    vi.mocked(computeDefectRates).mockReturnValue({
      data: [{ Batch: 'B1', DefectRate: 0.1, DefectCount: 1 }],
      outcomeColumn: 'DefectRate',
      factors: ['Batch'],
    });

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
    useUnsavedHubsStore.setState(useUnsavedHubsStore.getInitialState(), true);
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
      viewState: { activeView: 'explore' },
    });

    expect(screen.getByTestId('btn-stats-sidebar')).toBeInTheDocument();
  });

  it('shows CoScout toggle when data is loaded on a supported loop surface', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.queryByTestId('btn-coscout')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('workflow-tab-explore'));

    expect(screen.getByTestId('btn-coscout')).toBeInTheDocument();
  });

  it('does not show CoScout toggle on Home', () => {
    usePanelsStore.setState({ activeView: 'home' });
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.queryByTestId('btn-coscout')).not.toBeInTheDocument();
  });

  it('does not render a Save button (auto-save only)', () => {
    renderEditor();

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });

  it('shows ColumnMapping (no goal-form vestibule) when data is loaded but no outcome selected (FSJ-3b spec §2/§3)', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: null,
    });

    // Wizard demoted to ColumnMapping-only.
    expect(screen.getByTestId('column-mapping')).toBeInTheDocument();
    // Negative control: the Stage-1 HubGoalForm vestibule is retired and never
    // renders on the mapping path (provisioning moved to paste-analyzed time).
    expect(screen.queryByTestId('hub-creation-stage1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hub-goal-form')).not.toBeInTheDocument();
  });

  it('shows project dashboard overview when data is loaded with projectId', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    // With projectId, loads into Home overview first.
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

  it('skips ColumnMapping for a measurement-shaped paste — lands at b0 (FSJ-3b spec §4.1)', async () => {
    // FSJ-3b: the mocked paste is measurement-shaped (detectColumns returns an outcome,
    // detectDefectFormat returns isDefectFormat:false, detectWideFormat returns
    // isWideFormat:false). The pipeline fires onFreshPasteLanded → Editor's
    // handleFreshPasteLanded → landFreshEntryOnProcess → showFrame.
    // Full landed contract: no mapping vestibule + panelsStore.activeView='frame' +
    // an unsaved hub registered (Untitled pair provisioned).
    renderEditor();

    fireEvent.click(screen.getByText('Paste Data'));

    // PasteScreen renders
    expect(screen.getByTestId('paste-screen')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Analyze'));
    });

    // Mapping vestibule skipped
    expect(screen.queryByTestId('column-mapping')).not.toBeInTheDocument();

    // Process-tab routing: getCurrentUser() resolves async → waitFor the effect
    await waitFor(() => {
      expect(usePanelsStore.getState().activeView).toBe('frame');
    });

    // Untitled pair registered in Word-style in-memory store
    expect(useUnsavedHubsStore.getState().hubs.length).toBeGreaterThan(0);
    const hub = useUnsavedHubsStore.getState().hubs[0];
    expect(hub.improvementProject).toBeDefined();
    expect(hub.improvementProject!.deletedAt).toBeNull();
  });

  it('accepts a defect-shaped b0 proposal inline without writing active Y', async () => {
    vi.mocked(parseText).mockResolvedValue([
      { Batch: 'B1', Defect_Type: 'Scratch', Units_Produced: 10 },
    ]);
    vi.mocked(detectDefectFormat).mockReturnValue({
      isDefectFormat: true,
      confidence: 'high',
      dataShape: 'event-log',
      suggestedMapping: {
        aggregationUnit: 'Batch',
        defectTypeColumn: 'Defect_Type',
        unitsProducedColumn: 'Units_Produced',
      },
    });
    vi.mocked(detectColumns).mockReturnValue({
      outcome: null,
      factors: [],
      confidence: 'low',
      columnAnalysis: [],
      timeColumn: null,
    });
    vi.mocked(computeDefectRates).mockReturnValue({
      data: [{ Batch: 'B1', DefectRate: 0.1, DefectCount: 1 }],
      outcomeColumn: 'DefectRate',
      factors: ['Batch'],
    });

    renderEditor();

    fireEvent.click(screen.getByText('Paste Data'));
    await act(async () => {
      fireEvent.click(screen.getByText('Analyze'));
    });

    expect(screen.queryByTestId('column-mapping')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept defect mode' })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Accept defect mode' }));
    });

    const state = useProjectStore.getState();
    expect(computeDefectRates).not.toHaveBeenCalled();
    expect(state.analysisMode).toBe('defect');
    expect(state.defectMapping).toEqual({
      dataShape: 'event-log',
      aggregationUnit: 'Batch',
      defectTypeColumn: 'Defect_Type',
      unitsProducedColumn: 'Units_Produced',
    });
    expect(state.outcome).toBeNull();
    expect(screen.queryByRole('button', { name: 'Accept defect mode' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('column-mapping')).not.toBeInTheDocument();
  });

  it('accepts a wide b0 proposal inline without paste-time performance mutation', async () => {
    vi.mocked(parseText).mockResolvedValue([{ Timestamp: '2026-06-01', V1: 10, V2: 11, V3: 9 }]);
    vi.mocked(detectWideFormat).mockReturnValue({
      isWideFormat: true,
      channels: [
        {
          id: 'V1',
          label: 'V1',
          n: 1,
          preview: { min: 10, max: 10, mean: 10 },
          matchedPattern: true,
        },
        {
          id: 'V2',
          label: 'V2',
          n: 1,
          preview: { min: 11, max: 11, mean: 11 },
          matchedPattern: true,
        },
        { id: 'V3', label: 'V3', n: 1, preview: { min: 9, max: 9, mean: 9 }, matchedPattern: true },
      ],
      metadataColumns: ['Timestamp'],
      confidence: 'high',
      reason: 'Detected sibling measurement columns',
    });
    vi.mocked(detectColumns).mockReturnValue({
      outcome: null,
      factors: [],
      confidence: 'low',
      columnAnalysis: [],
      timeColumn: null,
    });

    renderEditor();

    fireEvent.click(screen.getByText('Paste Data'));
    await act(async () => {
      fireEvent.click(screen.getByText('Analyze'));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept performance mode' })).toBeInTheDocument();
    });
    expect(useProjectStore.getState().analysisMode).toBe('standard');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Accept performance mode' }));
    });

    const state = useProjectStore.getState();
    expect(state.analysisMode).toBe('performance');
    expect(state.measureColumns).toEqual(['V1', 'V2', 'V3']);
    expect(state.measureLabel).toBe('Channel');
    expect(
      screen.queryByRole('button', { name: 'Accept performance mode' })
    ).not.toBeInTheDocument();
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

  // ── GoalBanner opt-in on the Process tab (FSJ-3b, spec §3) ──

  describe('GoalBanner opt-in on the Process tab (FSJ-3b, spec §3)', () => {
    it('(a) goal start-prompt renders on the Process tab when an activeHub exists after a paste lands', async () => {
      // Measurement-shaped paste → onFreshPasteLanded → landFreshEntryOnProcess →
      // registers hub + sets processHubId + showFrame. GoalBanner mounts with
      // startPrompt because activeHub exists and processGoal is empty.
      renderEditor();

      fireEvent.click(screen.getByText('Paste Data'));
      expect(screen.getByTestId('paste-screen')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByText('Analyze'));
      });

      // Wait for frame routing + async user resolution
      await waitFor(() => {
        expect(usePanelsStore.getState().activeView).toBe('frame');
      });

      // GoalBanner start-prompt must be visible (empty goal + startPrompt prop set)
      await waitFor(() => {
        expect(screen.getByTestId('goal-banner-start')).toBeInTheDocument();
      });
    });

    it('(b) entering a goal commits processGoal + derived name onto the unsaved hub (Word-style)', async () => {
      // Setup: navigate to frame with an unsaved hub already registered
      renderEditor();

      fireEvent.click(screen.getByText('Paste Data'));
      await act(async () => {
        fireEvent.click(screen.getByText('Analyze'));
      });
      await waitFor(() => {
        expect(usePanelsStore.getState().activeView).toBe('frame');
      });
      await waitFor(() => {
        expect(screen.getByTestId('goal-banner-start')).toBeInTheDocument();
      });

      // Open the goal edit form
      fireEvent.click(screen.getByTestId('goal-banner-start'));

      // GoalBanner enters edit mode — find the textarea inside the goal-banner
      const goalBanner = screen.getByTestId('goal-banner');
      const textarea = goalBanner.querySelector('textarea')!;
      expect(textarea).not.toBeNull();
      fireEvent.change(textarea, {
        target: { value: 'We injection-mold polypropylene barrels' },
      });
      // Click the Save button within the goal-banner container
      const saveBtn = Array.from(goalBanner.querySelectorAll('button')).find(b =>
        /save/i.test(b.textContent ?? '')
      )!;
      expect(saveBtn).toBeDefined();
      fireEvent.click(saveBtn);

      // commitHubChange writes the unsaved hub in-memory (no IDB/cloud write)
      await waitFor(() => {
        const hubs = useUnsavedHubsStore.getState().hubs;
        const hub = hubs[0];
        expect(hub?.processGoal).toBe('We injection-mold polypropylene barrels');
        // extractHubName derives the name from the narrative
        expect(hub?.name).toBe('We injection-mold polypropylene barrels');
      });
    });

    it('(c) NEGATIVE: no goal banner when activeView is explore (frame-only surface)', async () => {
      // Data loaded, explore tab active — GoalBanner must not render there.
      // The opt-in start-prompt is frame-tab only per spec §3.
      usePanelsStore.setState({ activeView: 'explore' });
      renderEditor({
        rawData: [{ Weight: 10, Machine: 'A' }],
        outcome: 'Weight',
        factors: ['Machine'],
      });

      // Click Explore tab to confirm we are on explore
      fireEvent.click(screen.getByTestId('workflow-tab-explore'));

      expect(screen.queryByTestId('goal-banner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('goal-banner-start')).not.toBeInTheDocument();
    });
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
