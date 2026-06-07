import 'fake-indexeddb/auto';
import { vi } from 'vitest';
import type { AnalysisBrief, DefectMapping, WideFormatDetection } from '@variscout/core';

const stageFiveCapture = vi.hoisted(() => ({
  onOpenInvestigation: undefined as ((brief: AnalysisBrief) => void) | undefined,
}));

const importFlowMock = vi.hoisted(() => ({
  current: null as null | Record<string, unknown>,
}));

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    PerformanceDetectedModal: () => <div data-testid="performance-detected-modal" />,
    DefectDetectedModal: () => <div data-testid="defect-detected-modal" />,
    CapabilitySuggestionModal: () => <div data-testid="capability-suggestion-modal" />,
    StageFiveModal: (props: { onOpenInvestigation: (brief: AnalysisBrief) => void }) => {
      stageFiveCapture.onOpenInvestigation = props.onOpenInvestigation;
      return null;
    },
  };
});

vi.mock('../hooks/usePasteImportFlow', async importOriginal => {
  const actual = await importOriginal<typeof import('../hooks/usePasteImportFlow')>();
  return {
    ...actual,
    usePasteImportFlow: vi.fn(() => importFlowMock.current),
  };
});

vi.mock('../components/views/FrameView', () => ({
  default: (props: {
    onAcceptWideFormatDetection?: (columns: string[], label: string) => void;
    onAcceptDefectDetection?: (mapping: DefectMapping) => void;
  }) => (
    <div data-testid="frame-view-stub">
      <button
        type="button"
        data-testid="mock-accept-wide"
        onClick={() => props.onAcceptWideFormatDetection?.(['V1', 'V2', 'V3', 'V4'], 'Channel')}
      >
        accept wide
      </button>
      <button
        type="button"
        data-testid="mock-accept-defect"
        onClick={() =>
          props.onAcceptDefectDetection?.({
            dataShape: 'event-log',
            aggregationUnit: 'Date',
            defectTypeColumn: 'Defect_Type',
            unitsProducedColumn: 'Units_Produced',
          })
        }
      >
        accept defect
      </button>
    </div>
  ),
}));

vi.mock('../components/Dashboard', () => ({
  default: () => <div data-testid="dashboard-stub">Dashboard</div>,
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

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { LocaleProvider } from '../context/LocaleContext';
import { registerLocaleLoaders, type MessageCatalog } from '@variscout/core';
import { initialPanelsState, usePanelsStore } from '../features/panels/panelsStore';
import { useProjectStore } from '@variscout/stores';

registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>(
    '../../../../packages/core/src/i18n/messages/*.ts',
    { eager: false }
  )
);

const WIDE_DETECTION: WideFormatDetection = {
  isWideFormat: true,
  confidence: 'high',
  reason: '4/4 columns match channel naming patterns',
  metadataColumns: ['Batch'],
  channels: [
    { id: 'V1', label: 'V1', n: 12, preview: { min: 10, max: 14, mean: 12 }, matchedPattern: true },
    { id: 'V2', label: 'V2', n: 12, preview: { min: 11, max: 15, mean: 13 }, matchedPattern: true },
    { id: 'V3', label: 'V3', n: 12, preview: { min: 9, max: 13, mean: 11 }, matchedPattern: true },
    { id: 'V4', label: 'V4', n: 12, preview: { min: 12, max: 16, mean: 14 }, matchedPattern: true },
  ],
};

function baseImportFlow(overrides: Record<string, unknown> = {}) {
  return {
    isPasteMode: false,
    pasteError: null,
    isMapping: false,
    isMappingReEdit: false,
    isManualEntry: false,
    wideFormatDetection: null,
    defectDetection: null,
    timeExtractionPrompt: null,
    setTimeExtractionPrompt: vi.fn(),
    timeExtractionConfig: {},
    setTimeExtractionConfig: vi.fn(),
    quietTimeExtraction: null,
    dismissQuietTimeExtraction: vi.fn(),
    undoQuietTimeExtraction: vi.fn(),
    suggestedStack: undefined,
    stackConfig: null,
    matchSummary: undefined,
    handlePasteAnalyze: vi.fn(),
    handlePasteCancel: vi.fn(),
    handleOpenPaste: vi.fn(),
    handleManualDataAnalyze: vi.fn(),
    handleManualCancel: vi.fn(),
    handleMappingConfirm: vi.fn(),
    handleMappingCancel: vi.fn(),
    openFactorManager: vi.fn(),
    handleColumnRename: vi.fn(),
    handleWideFormatDetected: vi.fn(),
    handleDismissWideFormat: vi.fn(),
    handleDefectDetected: vi.fn(),
    handleDismissDefect: vi.fn(),
    handleTimeExtractionApply: vi.fn(),
    handleTimeExtractionSkip: vi.fn(),
    handleStackConfigChange: vi.fn(),
    acceptMatchSummary: vi.fn(),
    cancelMatchSummary: vi.fn(),
    ...overrides,
  };
}

function renderApp() {
  return render(
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
}

describe('PWA mode detections re-frame b0', () => {
  beforeEach(() => {
    importFlowMock.current = baseImportFlow();
    usePanelsStore.setState({ ...initialPanelsState, activeView: 'frame' });
    useProjectStore.setState({
      rawData: [{ Date: '2026-05-01', Defect_Type: 'Scratch', Units_Produced: 100 }],
      outcome: null,
      factors: [],
      analysisMode: 'standard',
      measureColumns: [],
      measureLabel: 'Measure',
      defectMapping: null,
      processContext: null,
    });
  });

  afterEach(() => {
    importFlowMock.current = baseImportFlow();
    usePanelsStore.setState(initialPanelsState);
    useProjectStore.setState({
      rawData: [],
      outcome: null,
      factors: [],
      analysisMode: 'standard',
      measureColumns: [],
      measureLabel: 'Measure',
      defectMapping: null,
      processContext: null,
    });
  });

  it('accepting the performance banner writes mode and channel configuration', async () => {
    const handleDismissWideFormat = vi.fn();
    importFlowMock.current = baseImportFlow({
      wideFormatDetection: WIDE_DETECTION,
      handleDismissWideFormat,
    });

    await act(async () => {
      renderApp();
    });

    expect(screen.getByTestId('frame-view-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('performance-detected-modal')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-accept-wide'));
    });

    const state = useProjectStore.getState();
    expect(state.analysisMode).toBe('performance');
    expect(state.measureColumns).toEqual(['V1', 'V2', 'V3', 'V4']);
    expect(state.measureLabel).toBe('Channel');
    expect(handleDismissWideFormat).toHaveBeenCalledTimes(1);
  });

  it('accepting the defect banner writes mode and mapping without writing active Y', async () => {
    const handleDismissDefect = vi.fn();
    importFlowMock.current = baseImportFlow({
      defectDetection: {
        isDefectFormat: true,
        confidence: 'high',
        dataShape: 'event-log',
        suggestedMapping: { aggregationUnit: 'Date', defectTypeColumn: 'Defect_Type' },
      },
      handleDismissDefect,
    });

    await act(async () => {
      renderApp();
    });

    expect(screen.getByTestId('frame-view-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('defect-detected-modal')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-accept-defect'));
    });

    const state = useProjectStore.getState();
    expect(state.analysisMode).toBe('defect');
    expect(state.outcome).toBeNull();
    expect(state.defectMapping).toEqual({
      dataShape: 'event-log',
      aggregationUnit: 'Date',
      defectTypeColumn: 'Defect_Type',
      unitsProducedColumn: 'Units_Produced',
    });
    expect(handleDismissDefect).toHaveBeenCalledTimes(1);
  });
});
