import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { useData } from './context/DataContext';
import { downloadCSV } from './lib/export';
import SettingsPanel from './components/settings/SettingsPanel';
import DataTableModal from './components/data/DataTableModal';
import DataPanel from './components/data/DataPanel';
import MindmapPanel from './components/MindmapPanel';
import { useFilterNavigation } from './hooks/useFilterNavigation';
import { ColumnMapping, MindmapWindow, openMindmapPopout } from '@variscout/ui';
import Dashboard from './components/Dashboard';
import HomeScreen from './components/HomeScreen';
import ManualEntry from './components/data/ManualEntry';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import WhatIfPage from './components/WhatIfPage';
import { useDataIngestion } from './hooks/useDataIngestion';
import { useEmbedMessaging } from './hooks/useEmbedMessaging';
import { SAMPLES } from '@variscout/data';
import {
  validateData,
  getNelsonRule2ViolationPoints,
  calculateStats,
  type ExclusionReason,
} from '@variscout/core';
import type { WideFormatDetection } from '@variscout/core';

type AnalysisView = 'dashboard' | 'regression' | 'gagerr';

// Breakpoint for desktop panel (vs modal on mobile)
const DESKTOP_BREAKPOINT = 1024;

function App() {
  const {
    rawData,
    filteredData,
    outcome,
    specs,
    dataFilename,
    dataQualityReport,
    paretoMode,
    separateParetoFilename,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    factors,
    columnAliases,
    // Multi-point selection (Phase 3: Brushing)
    selectedPoints,
    togglePointSelection,
    clearSelection,
  } = useData();

  // State for performance mode auto-detection (wide format dismissal)
  const [wideFormatDetection, setWideFormatDetection] = useState<WideFormatDetection | null>(null);
  // State for manual data entry view
  const [isManualEntry, setIsManualEntry] = useState(false);
  // Callback for wide format detection
  const handleWideFormatDetected = useCallback((result: WideFormatDetection) => {
    setWideFormatDetection(result);
  }, []);

  const {
    handleFileUpload: ingestFile,
    handleParetoFileUpload,
    clearParetoFile,
    loadSample,
    clearData,
    applyTimeExtraction,
  } = useDataIngestion({
    onWideFormatDetected: handleWideFormatDetected,
    onTimeColumnDetected: prompt => {
      setTimeExtractionPrompt(prompt);
      if (prompt.hasTimeComponent) {
        setTimeExtractionConfig(prev => ({ ...prev, extractHour: true }));
      }
    },
    getRawData: () => rawData,
    getOutcome: () => outcome,
    getFactors: () => factors,
  });
  const [isMapping, setIsMapping] = useState(false);
  const [timeExtractionPrompt, setTimeExtractionPrompt] = useState<{
    timeColumn: string;
    hasTimeComponent: boolean;
  } | null>(null);
  const [timeExtractionConfig, setTimeExtractionConfig] = useState({
    extractYear: true,
    extractMonth: true,
    extractWeek: false,
    extractDayOfWeek: true,
    extractHour: false,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [isMindmapPanelOpen, setIsMindmapPanelOpen] = useState(false);
  const [highlightRowIndex, setHighlightRowIndex] = useState<number | null>(null);
  const [showExcludedOnly, setShowExcludedOnly] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isWhatIfPageOpen, setIsWhatIfPageOpen] = useState(false);
  const [activeView, setActiveView] = useState<AnalysisView>('dashboard');
  // Trigger for opening spec editor from MobileMenu
  const [openSpecEditorRequested, setOpenSpecEditorRequested] = useState(false);
  // Track if desktop for panel vs modal
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  );
  // Highlighted point from table row click (for bi-directional sync)
  const [highlightedChartPoint, setHighlightedChartPoint] = useState<number | null>(null);

  // Embed mode - hides header/footer for iframe embedding
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  // Mindmap popout mode - renders only the MindmapWindow component
  const [isMindmapPopoutMode, setIsMindmapPopoutMode] = useState(false);
  // Embed focus chart - when set, Dashboard shows only this chart
  const [embedFocusChart, setEmbedFocusChart] = useState<
    'ichart' | 'boxplot' | 'pareto' | 'stats' | null
  >(null);
  // Embed stats tab - when set, auto-selects this tab in StatsPanel
  const [embedStatsTab, setEmbedStatsTab] = useState<'summary' | 'histogram' | 'normality' | null>(
    null
  );

  // Embed messaging - handles postMessage communication with parent window
  const { highlightedChart, highlightIntensity, notifyChartClicked } =
    useEmbedMessaging(isEmbedMode);

  // Filter navigation for mindmap panel (provides filterStack and applyFilter)
  const { filterStack: mindmapFilterStack, applyFilter: mindmapApplyFilter } =
    useFilterNavigation();

  // Track desktop/mobile for panel behavior
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Handle URL parameters on mount (?sample=xxx&embed=true&chart=ichart&tab=histogram&view=mindmap)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sampleKey = params.get('sample');
    const embedParam = params.get('embed');
    const chartParam = params.get('chart');
    const tabParam = params.get('tab');
    const viewParam = params.get('view');

    // Set popout modes if specified
    if (viewParam === 'mindmap') {
      setIsMindmapPopoutMode(true);
      return; // Don't process other params in popout mode
    }
    if (viewParam === 'whatif') {
      setIsWhatIfPageOpen(true);
    }

    // Set embed mode if specified
    if (embedParam === 'true') {
      setIsEmbedMode(true);
    }

    // Set focus chart if specified (only valid in embed mode)
    if (chartParam && ['ichart', 'boxplot', 'pareto', 'stats'].includes(chartParam)) {
      setEmbedFocusChart(chartParam as 'ichart' | 'boxplot' | 'pareto' | 'stats');
    }

    // Set stats tab if specified (for stats chart embed)
    if (tabParam && ['summary', 'histogram', 'normality'].includes(tabParam)) {
      setEmbedStatsTab(tabParam as 'summary' | 'histogram' | 'normality');
    }

    // Auto-load sample if specified
    if (sampleKey && rawData.length === 0) {
      const sample = SAMPLES.find(s => s.urlKey === sampleKey);
      if (sample) {
        loadSample(sample);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute excluded row data for DataTableModal
  const excludedRowIndices = useMemo(() => {
    if (!dataQualityReport) return undefined;
    return new Set(dataQualityReport.excludedRows.map(r => r.index));
  }, [dataQualityReport]);

  const excludedReasons = useMemo(() => {
    if (!dataQualityReport) return undefined;
    const map = new Map<number, ExclusionReason[]>();
    dataQualityReport.excludedRows.forEach(row => {
      map.set(row.index, row.reasons);
    });
    return map;
  }, [dataQualityReport]);

  // Compute control violations for DataPanel annotations
  const controlViolations = useMemo(() => {
    if (!outcome || filteredData.length === 0) return undefined;

    const map = new Map<number, string[]>();

    // Calculate stats for violation detection
    const values = filteredData
      .map(row => {
        const val = row[outcome];
        return typeof val === 'number' ? val : parseFloat(String(val));
      })
      .filter(v => !isNaN(v));

    if (values.length === 0) return undefined;

    const stats = calculateStats(values);

    // Check each row for violations
    filteredData.forEach((row, index) => {
      const val = row[outcome];
      const numValue = typeof val === 'number' ? val : parseFloat(String(val));
      if (isNaN(numValue)) return;

      const violations: string[] = [];

      // Check control limit violations
      if (numValue > stats.ucl) {
        violations.push('Special Cause: Above UCL');
      } else if (numValue < stats.lcl) {
        violations.push('Special Cause: Below LCL');
      }

      // Check spec limit violations
      if (specs.usl !== undefined && numValue > specs.usl) {
        violations.push('Above USL');
      }
      if (specs.lsl !== undefined && numValue < specs.lsl) {
        violations.push('Below LSL');
      }

      if (violations.length > 0) {
        map.set(index, violations);
      }
    });

    // Check Nelson Rule 2 violations
    const nelsonViolations = getNelsonRule2ViolationPoints(values, stats.mean);
    nelsonViolations.forEach(index => {
      const existing = map.get(index) || [];
      if (!existing.some(v => v.includes('Nelson Rule 2'))) {
        existing.push('Special Cause: Nelson Rule 2 (9 consecutive points on same side of mean)');
        map.set(index, existing);
      }
    });

    return map;
  }, [filteredData, outcome, specs]);

  const handleExport = useCallback(async () => {
    const node = document.getElementById('dashboard-export-container');
    if (!node) return;

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: '#0f172a',
      });
      const link = document.createElement('a');
      link.download = `variscout-analysis-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const filename = `variscout-data-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filteredData, outcome, specs, { filename });
  }, [filteredData, outcome, specs]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: close any open modal
      if (e.key === 'Escape') {
        if (wideFormatDetection) setWideFormatDetection(null);
        else if (showResetConfirm) setShowResetConfirm(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isDataTableOpen) setIsDataTableOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wideFormatDetection, showResetConfirm, isSettingsOpen, isDataTableOpen]);

  const handleMappingConfirm = (newOutcome: string, newFactors: string[]) => {
    setOutcome(newOutcome);
    setFactors(newFactors);
    setIsMapping(false);

    // Apply time extraction if timeColumn exists
    if (timeExtractionPrompt?.timeColumn) {
      applyTimeExtraction(timeExtractionPrompt.timeColumn, timeExtractionConfig);
    }

    setTimeExtractionPrompt(null);
  };

  const handleMappingCancel = () => {
    clearData();
    setIsMapping(false);
  };

  // Open data table with a specific row highlighted (from chart point click)
  const openDataTableAtRow = useCallback(
    (index: number) => {
      setHighlightRowIndex(index);
      if (isDesktop) {
        setIsDataPanelOpen(true);
      } else {
        setIsDataTableOpen(true);
      }
    },
    [isDesktop]
  );

  // Handle row click from data panel (bi-directional sync)
  const handleDataPanelRowClick = useCallback((index: number) => {
    setHighlightedChartPoint(index);
    // Clear highlight after animation
    setTimeout(() => setHighlightedChartPoint(null), 2000);
  }, []);

  // Toggle data panel
  const handleToggleDataPanel = useCallback(() => {
    if (isDesktop) {
      setIsDataPanelOpen(prev => !prev);
    } else {
      setIsDataTableOpen(true);
    }
  }, [isDesktop]);

  // Toggle mindmap panel
  const handleToggleMindmapPanel = useCallback(() => {
    setIsMindmapPanelOpen(prev => !prev);
  }, []);

  // Close mindmap panel
  const handleCloseMindmapPanel = useCallback(() => {
    setIsMindmapPanelOpen(false);
  }, []);

  // Open mindmap in popout window
  const handleOpenMindmapPopout = useCallback(() => {
    if (outcome) {
      openMindmapPopout(rawData, factors, outcome, columnAliases, specs, mindmapFilterStack);
      setIsMindmapPanelOpen(false);
    }
  }, [rawData, factors, outcome, columnAliases, specs, mindmapFilterStack]);

  // Handle drill category from mindmap (applies filter via navigation)
  const handleMindmapDrillCategory = useCallback(
    (factor: string, value: string | number) => {
      mindmapApplyFilter({
        type: 'filter',
        source: 'mindmap',
        factor,
        values: [value],
      });
    },
    [mindmapApplyFilter]
  );

  // Listen for messages from mindmap popout window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'MINDMAP_DRILL_CATEGORY') {
        const { factor, value } = event.data;
        handleMindmapDrillCategory(factor, value);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMindmapDrillCategory]);

  // Close data table and clear highlight
  const handleCloseDataTable = useCallback(() => {
    setIsDataTableOpen(false);
    setHighlightRowIndex(null);
    setShowExcludedOnly(false);
  }, []);

  // Close data panel
  const handleCloseDataPanel = useCallback(() => {
    setIsDataPanelOpen(false);
    setHighlightRowIndex(null);
  }, []);

  // Open data table showing only excluded rows (from validation banner)
  const openDataTableExcluded = useCallback(() => {
    setShowExcludedOnly(true);
    setHighlightRowIndex(null);
    setIsDataTableOpen(true);
  }, []);

  // Open data table showing all rows (from validation banner)
  const openDataTableAll = useCallback(() => {
    setShowExcludedOnly(false);
    setHighlightRowIndex(null);
    setIsDataTableOpen(true);
  }, []);

  // Reset confirmation handlers
  const handleResetRequest = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    clearData();
    setShowResetConfirm(false);
  }, [clearData]);

  // Handle view change from settings
  const handleViewChange = useCallback(
    (view: AnalysisView) => {
      // Clear selection when switching views (Phase 4: Performance Mode Integration)
      clearSelection();
      setActiveView(view);
    },
    [clearSelection]
  );

  // Handle dismissing wide format detection (Performance Mode is Azure-only)
  const handleDismissWideFormat = useCallback(() => {
    setWideFormatDetection(null);
  }, []);

  // Handle manual data entry completion
  const handleManualDataAnalyze = useCallback(
    (
      data: any[],
      config: {
        outcome: string;
        factors: string[];
        specs?: { usl?: number; lsl?: number };
      }
    ) => {
      setRawData(data);
      setDataFilename('Manual Entry');
      setOutcome(config.outcome);
      setFactors(config.factors);

      if (config.specs) {
        setSpecs(config.specs);
      }

      const report = validateData(data, config.outcome);
      setDataQualityReport(report);

      clearSelection();
      setActiveView('dashboard');
      setIsManualEntry(false);
    },
    [setRawData, setDataFilename, setOutcome, setFactors, setSpecs, setDataQualityReport]
  );

  // Handle canceling manual entry
  const handleManualEntryCancel = useCallback(() => {
    setIsManualEntry(false);
  }, []);

  // Handle opening manual entry from home screen
  const handleOpenManualEntry = useCallback(() => {
    setIsManualEntry(true);
  }, []);

  // Render only popout windows in popout mode
  if (isMindmapPopoutMode) {
    return <MindmapWindow />;
  }

  // Full-page What-If Simulator
  if (isWhatIfPageOpen) {
    return <WhatIfPage onBack={() => setIsWhatIfPageOpen(false)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-surface text-content font-sans selection:bg-blue-500/30">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      {/* Hide header in embed mode */}
      {!isEmbedMode && (
        <AppHeader
          hasData={rawData.length > 0}
          dataFilename={dataFilename}
          rowCount={rawData.length}
          isDataPanelOpen={isDataPanelOpen}
          isMindmapPanelOpen={isMindmapPanelOpen}
          onNewAnalysis={handleResetRequest}
          onToggleDataPanel={handleToggleDataPanel}
          onToggleMindmapPanel={handleToggleMindmapPanel}
          onOpenDataTable={() => {
            setHighlightRowIndex(null);
            setIsDataTableOpen(true);
          }}
          onExportCSV={handleExportCSV}
          onExportImage={handleExport}
          onEnterPresentationMode={() => setIsPresentationMode(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onReset={handleResetRequest}
          onOpenSpecEditor={() => setOpenSpecEditorRequested(true)}
        />
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-secondary border border-edge rounded-xl shadow-xl p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-2">Reset Analysis?</h3>
            <p className="text-xs text-content-secondary mb-4">
              All data will be cleared. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-hidden relative flex">
        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isManualEntry ? (
            <ManualEntry onAnalyze={handleManualDataAnalyze} onCancel={handleManualEntryCancel} />
          ) : rawData.length === 0 ? (
            <HomeScreen
              onLoadSample={loadSample}
              onOpenManualEntry={handleOpenManualEntry}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          ) : isMapping ? (
            <ColumnMapping
              availableColumns={Object.keys(rawData[0])}
              initialOutcome={outcome}
              initialFactors={factors}
              datasetName={dataFilename || undefined}
              onConfirm={handleMappingConfirm}
              onCancel={handleMappingCancel}
              dataQualityReport={dataQualityReport}
              onViewExcludedRows={openDataTableExcluded}
              onViewAllData={openDataTableAll}
              paretoMode={paretoMode}
              separateParetoFilename={separateParetoFilename}
              onParetoFileUpload={handleParetoFileUpload}
              onClearParetoFile={clearParetoFile}
              timeColumn={timeExtractionPrompt?.timeColumn}
              hasTimeComponent={timeExtractionPrompt?.hasTimeComponent}
              onTimeExtractionChange={setTimeExtractionConfig}
            />
          ) : (
            <Dashboard
              onPointClick={openDataTableAtRow}
              isPresentationMode={isPresentationMode}
              onExitPresentation={() => setIsPresentationMode(false)}
              highlightedChart={highlightedChart}
              highlightIntensity={highlightIntensity}
              onChartClick={isEmbedMode ? notifyChartClicked : undefined}
              embedFocusChart={embedFocusChart}
              embedStatsTab={embedStatsTab}
              onOpenColumnMapping={() => setIsMapping(true)}
              openSpecEditorRequested={openSpecEditorRequested}
              onSpecEditorOpened={() => setOpenSpecEditorRequested(false)}
              activeView={activeView}
              highlightedPointIndex={highlightedChartPoint}
            />
          )}
        </div>

        {/* Data Panel (desktop only, when open) */}
        {isDesktop && rawData.length > 0 && !isMapping && (
          <DataPanel
            isOpen={isDataPanelOpen}
            onClose={handleCloseDataPanel}
            highlightRowIndex={highlightRowIndex}
            onRowClick={handleDataPanelRowClick}
            excludedRowIndices={excludedRowIndices}
            excludedReasons={excludedReasons}
            controlViolations={controlViolations}
            selectedIndices={selectedPoints}
            onToggleSelection={togglePointSelection}
          />
        )}
      </main>

      {/* Settings Panel (slide-in from right) */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeView={activeView}
        onViewChange={handleViewChange}
        onNewAnalysis={() => {
          setIsSettingsOpen(false);
          handleResetRequest();
        }}
        onOpenWhatIf={() => setIsWhatIfPageOpen(true)}
      />

      {/* Investigation Mindmap Panel (slide-in from right) */}
      {outcome && (
        <MindmapPanel
          isOpen={isMindmapPanelOpen}
          onClose={handleCloseMindmapPanel}
          data={rawData}
          factors={factors}
          outcome={outcome}
          filterStack={mindmapFilterStack}
          specs={specs}
          columnAliases={columnAliases}
          onDrillCategory={handleMindmapDrillCategory}
          onOpenPopout={handleOpenMindmapPopout}
        />
      )}

      <DataTableModal
        isOpen={isDataTableOpen}
        onClose={handleCloseDataTable}
        highlightRowIndex={highlightRowIndex ?? undefined}
        showExcludedOnly={showExcludedOnly}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
      />

      {/* Hide footer in embed mode */}
      {!isEmbedMode && (
        <AppFooter filteredCount={filteredData.length} totalCount={rawData.length} />
      )}

      {/* Wide Format Detection — inform user Performance Mode is Azure-only */}
      {wideFormatDetection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-secondary border border-edge rounded-xl shadow-xl p-5 w-full max-w-sm">
            <p className="text-sm text-content mb-3">
              {wideFormatDetection.channels.length} measure columns detected — Performance Mode is
              available in the Azure App.
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleDismissWideFormat}
                className="px-4 py-2 text-sm font-medium text-white bg-surface-tertiary hover:bg-surface-elevated rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
