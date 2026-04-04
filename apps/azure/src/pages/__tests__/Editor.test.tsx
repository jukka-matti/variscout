import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Editor } from '../Editor';
import * as DataContextModule from '../../context/DataContext';
import * as StorageModule from '../../services/storage';
import { usePanelsStore } from '../../features/panels/panelsStore';

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

// ── Mock @variscout/core ──

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    parseText: vi.fn(async () => [{ Weight: 10, Machine: 'A' }]),
    detectColumns: vi.fn(() => ({ outcome: 'Weight', factors: ['Machine'], columnAnalysis: [] })),
    detectWideFormat: vi.fn(() => ({ isWideFormat: false, channels: [] })),
    detectYamazumiFormat: vi.fn(() => ({
      isYamazumiFormat: false,
      confidence: 'low',
      suggestedMapping: {},
      reason: '',
    })),
    validateData: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
    downloadCSV: vi.fn(),
    getNelsonRule2ViolationPoints: vi.fn(() => []),
    calculateStats: vi.fn(() => ({ mean: 10, ucl: 12, lcl: 8 })),
    hasTeamFeatures: vi.fn(() => false),
    isTeamPlan: vi.fn(() => false),
    hasKnowledgeBase: vi.fn(() => false),
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

vi.mock('@variscout/ui', () => ({
  ColumnMapping: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (outcome: string, factors: string[]) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="column-mapping">
      <button onClick={() => onConfirm('Weight', ['Machine'])}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  DataTableModalBase: () => null,
  InvestigationPrompt: () => null,
  CoScoutPanelBase: () => null,
  AIOnboardingTooltip: () => null,
  SessionClosePrompt: () => null,
  useIsMobile: () => false,
  BREAKPOINTS: { phone: 640, mobile: 768, desktop: 1024, large: 1280 },
}));

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

vi.mock('../../hooks', () => ({
  useFilterNavigation: () => ({
    filterStack: [],
    applyFilter: vi.fn(),
    clearFilters: vi.fn(),
    updateFilterValues: vi.fn(),
    removeFilter: vi.fn(),
  }),
}));

// ── Mock storage ──

vi.mock('../../services/storage', () => ({
  useStorage: vi.fn(() => ({
    saveProject: vi.fn(),
    listProjects: vi.fn(() => Promise.resolve([])),
    syncStatus: { status: 'synced', message: 'Synced' },
  })),
  updateLastViewedAt: vi.fn(),
  classifySyncError: vi.fn(() => ({
    category: 'unknown',
    retryable: false,
    message: 'Unknown error',
  })),
}));

// ── Mock DataContext ──

vi.mock('../../context/DataContext', () => ({
  useDataStateCtx: vi.fn(),
  useDataActions: vi.fn(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    notifications: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

// ── Test helpers ──

const baseDataState = {
  rawData: [] as Record<string, unknown>[],
  filteredData: [] as Record<string, unknown>[],
  outcome: null as string | null,
  factors: [] as string[],
  specs: {} as Record<string, unknown>,
  stats: null,
  filters: {},
  columnAliases: {},
  measureColumns: null,
  measureLabel: null,
  currentProjectName: 'Test Project',
  currentProjectLocation: 'team' as const,
  hasUnsavedChanges: false,
  stageColumn: null,
  stageOrderMode: 'auto' as const,
  stagedStats: null,
  paretoAggregation: 'count' as const,
  chartTitles: {},
  timeColumn: null,
  selectedPoints: new Set<number>(),
  displayOptions: {},
  dataFilename: null,
  dataQualityReport: null,
  analysisMode: 'standard' as const,
  yamazumiMapping: null,
  viewState: null,
};

const baseDataActions = {
  setOutcome: vi.fn(),
  setRawData: vi.fn(),
  setFactors: vi.fn(),
  setSpecs: vi.fn(),
  setFilters: vi.fn(),
  setDataFilename: vi.fn(),
  setDataQualityReport: vi.fn(),
  setMeasureColumns: vi.fn(),
  setMeasureLabel: vi.fn(),
  setStageColumn: vi.fn(),
  setStageOrderMode: vi.fn(),
  setParetoAggregation: vi.fn(),
  setChartTitles: vi.fn(),
  setColumnAliases: vi.fn(),
  setDisplayOptions: vi.fn(),
  saveProject: vi.fn(),
  loadProject: vi.fn(() => Promise.resolve()),
  clearSelection: vi.fn(),
  setAnalysisMode: vi.fn(),
  setYamazumiMapping: vi.fn(),
  setViewState: vi.fn(),
  renameProject: vi.fn(() => Promise.resolve()),
  setFindings: vi.fn(),
  setQuestions: vi.fn(),
  setProcessContext: vi.fn(),
  setCategories: vi.fn(),
  setSubgroupConfig: vi.fn(),
  setCpkTarget: vi.fn(),
};

const defaultProps = {
  projectId: 'test-123',
  onBack: vi.fn(),
};

function renderEditor(stateOverrides: Partial<typeof baseDataState> = {}) {
  vi.mocked(DataContextModule.useDataStateCtx).mockReturnValue({
    ...baseDataState,
    ...stateOverrides,
  } as unknown as ReturnType<typeof DataContextModule.useDataStateCtx>);
  vi.mocked(DataContextModule.useDataActions).mockReturnValue({
    ...baseDataActions,
  } as unknown as ReturnType<typeof DataContextModule.useDataActions>);

  return render(<Editor {...defaultProps} />);
}

// ── Tests ──

describe('Editor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Reset panelsStore activeView to default state
    usePanelsStore.setState({ activeView: 'analysis' });

    // Re-apply storage mock after restoreAllMocks
    vi.mocked(StorageModule.useStorage).mockReturnValue({
      saveProject: vi.fn(),
      listProjects: vi.fn(() => Promise.resolve([])),
      syncStatus: { status: 'synced', message: 'Synced' },
    } as unknown as ReturnType<typeof StorageModule.useStorage>);
  });

  it('renders empty state when rawData is empty', () => {
    renderEditor();

    expect(screen.getByText('Start Your Analysis')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
    expect(screen.getByText('Sample Datasets')).toBeInTheDocument();
  });

  it('shows logo mark and project name in header', () => {
    renderEditor({ currentProjectName: 'My Analysis' });
    expect(screen.getByText('My Analysis')).toBeInTheDocument();
  });

  it('hides sync status indicator on Standard plan', () => {
    renderEditor();

    expect(screen.queryByText('Synced')).not.toBeInTheDocument();
  });

  it('shows Stats sidebar toggle when data is loaded in analysis view', () => {
    usePanelsStore.setState({ activeView: 'analysis' });
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByTestId('btn-stats-sidebar')).toBeInTheDocument();
  });

  it('shows CoScout toggle when data is loaded', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
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
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: null,
    });

    expect(screen.getByTestId('column-mapping')).toBeInTheDocument();
  });

  it('shows project dashboard overview when data is loaded with projectId', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    // With projectId, loads into dashboard (overview) view first
    expect(screen.getByTestId('project-dashboard-mock')).toBeInTheDocument();
    expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
  });

  it('shows analysis view when Analysis tab is clicked', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    // Click "Analysis" tab to switch to editor view
    fireEvent.click(screen.getByTestId('view-toggle-analysis'));

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('shows Add Data button when data is loaded in analysis view', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    // Switch to analysis view (may start in dashboard due to deep link logic)
    fireEvent.click(screen.getByTestId('view-toggle-analysis'));

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
});
