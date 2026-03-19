import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Editor } from '../Editor';
import * as DataContextModule from '../../context/DataContext';
import * as StorageModule from '../../services/storage';

// ── Mock child components ──

vi.mock('../../components/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));

vi.mock('../../components/data/DataPanel', () => ({
  default: () => <div data-testid="data-panel">DataPanel</div>,
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

// ── Mock @variscout/core ──

vi.mock('@variscout/core', () => ({
  parseText: vi.fn(async () => [{ Weight: 10, Machine: 'A' }]),
  detectColumns: vi.fn(() => ({ outcome: 'Weight', factors: ['Machine'] })),
  detectWideFormat: vi.fn(() => ({ isWideFormat: false, channels: [] })),
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
  calculateFactorVariations: vi.fn(() => []),
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
}));

vi.mock('../../hooks/usePhotoComments', () => ({
  usePhotoComments: () => ({
    handleAddPhoto: vi.fn(),
    handleAddCommentWithAuthor: vi.fn(),
  }),
}));

vi.mock('../../auth/getCurrentUser', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({ name: 'Test User', email: 'test@test.com' })),
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
  JourneyPhaseStrip: () => null,
  CoachPopover: () => null,
  MobileCoachSheet: () => null,
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
    syncStatus: { status: 'synced', message: 'Synced' },
  })),
}));

// ── Mock DataContext ──

vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
}));

// ── Test helpers ──

const baseDataCtx = {
  rawData: [] as Record<string, unknown>[],
  filteredData: [] as Record<string, unknown>[],
  outcome: null as string | null,
  factors: [] as string[],
  specs: {} as Record<string, unknown>,
  stats: null,
  filters: {},
  columnAliases: {},
  isPerformanceMode: false,
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
  setOutcome: vi.fn(),
  setRawData: vi.fn(),
  setFactors: vi.fn(),
  setSpecs: vi.fn(),
  setFilters: vi.fn(),
  setDataFilename: vi.fn(),
  setDataQualityReport: vi.fn(),
  setPerformanceMode: vi.fn(),
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
};

const defaultProps = {
  projectId: 'test-123',
  onBack: vi.fn(),
};

function renderEditor(dataOverrides: Partial<typeof baseDataCtx> = {}) {
  vi.mocked(DataContextModule.useData).mockReturnValue({
    ...baseDataCtx,
    ...dataOverrides,
  } as unknown as ReturnType<typeof DataContextModule.useData>);

  return render(<Editor {...defaultProps} />);
}

// ── Tests ──

describe('Editor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Re-apply storage mock after restoreAllMocks
    vi.mocked(StorageModule.useStorage).mockReturnValue({
      saveProject: vi.fn(),
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

  it('shows Back button and project name in header', () => {
    renderEditor({ currentProjectName: 'My Analysis' });

    expect(screen.getByLabelText('Back to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Analysis')).toBeInTheDocument();
  });

  it('hides sync status indicator on Standard plan', () => {
    renderEditor();

    expect(screen.queryByText('Synced')).not.toBeInTheDocument();
  });

  it('shows CSV export button when data is loaded', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByTitle('Export filtered data as CSV')).toBeInTheDocument();
  });

  it('shows What-If Simulator button when data is loaded', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByTitle('What If')).toBeInTheDocument();
  });

  it('shows Findings toggle when data and factors are loaded', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByTitle('Findings')).toBeInTheDocument();
  });

  it('does not show Findings toggle when factors are empty', () => {
    renderEditor({
      rawData: [{ Weight: 10 }],
      filteredData: [{ Weight: 10 }],
      outcome: 'Weight',
      factors: [],
    });

    expect(screen.queryByTitle('Findings')).not.toBeInTheDocument();
  });

  it('shows Data Panel toggle when data is loaded', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByTitle('Show data table')).toBeInTheDocument();
  });

  it('shows Save button', () => {
    renderEditor();

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('disables Save button when no data is loaded', () => {
    renderEditor();

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('shows ColumnMapping when data is loaded but no outcome selected', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: null,
    });

    expect(screen.getByTestId('column-mapping')).toBeInTheDocument();
  });

  it('shows Dashboard when data is loaded and outcome selected', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('shows Add Data button when data is loaded', () => {
    renderEditor({
      rawData: [{ Weight: 10, Machine: 'A' }],
      filteredData: [{ Weight: 10, Machine: 'A' }],
      outcome: 'Weight',
      factors: ['Machine'],
    });

    expect(screen.getByText('Add Data')).toBeInTheDocument();
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

  it('shows ColumnMapping after sample load', () => {
    renderEditor();

    fireEvent.click(screen.getByTestId('sample-coffee'));

    expect(screen.getByTestId('column-mapping')).toBeInTheDocument();
  });
});
