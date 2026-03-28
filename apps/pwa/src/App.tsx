import React, { Suspense, useCallback, useState, useEffect, useMemo } from 'react';
import { useData } from './context/DataContext';
import { downloadCSV } from './lib/export';
import { useFilterNavigation } from './hooks/useFilterNavigation';
import {
  ColumnMapping,
  FindingsWindow,
  openFindingsPopout,
  updateFindingsPopout,
  FINDINGS_ACTION_KEY,
  type FindingsAction,
  YamazumiDetectedModal,
  CapabilitySuggestionModal,
  MobileTabBar,
  type MobileTab,
  useIsMobile,
  BREAKPOINTS,
} from '@variscout/ui';
import { Beaker, Settings, Download, Table2, RotateCcw } from 'lucide-react';
import {
  useFindings,
  useDrillPath,
  buildFindingContext,
  buildFindingSource,
} from '@variscout/hooks';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import { useDataIngestion } from './hooks/useDataIngestion';
import { useEmbedMessaging } from './hooks/useEmbedMessaging';
import { SAMPLES } from '@variscout/data';
import { type ExclusionReason, toNumericValue } from '@variscout/core';
import { resolveMode } from '@variscout/core/strategy';
import { computeCenteringOpportunity } from '@variscout/core/variation';
import { useControlViolations } from '@variscout/hooks';
import { usePasteImportFlow } from './hooks/usePasteImportFlow';
import { useAppPanels } from './hooks/useAppPanels';

// Lazy-loaded heavy components for code splitting
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const HomeScreen = React.lazy(() => import('./components/HomeScreen'));
const PasteScreen = React.lazy(() => import('./components/data/PasteScreen'));
const ManualEntry = React.lazy(() => import('./components/data/ManualEntry'));
const WhatIfPage = React.lazy(() => import('./components/WhatIfPage'));
const SettingsPanel = React.lazy(() => import('./components/settings/SettingsPanel'));
const DataTableModal = React.lazy(() => import('./components/data/DataTableModal'));
const DataPanel = React.lazy(() => import('./components/data/DataPanel'));
const FindingsPanel = React.lazy(() => import('./components/FindingsPanel'));
const YamazumiDashboard = React.lazy(() => import('./components/YamazumiDashboard'));
const StatsPanel = React.lazy(() => import('./components/StatsPanel'));

const LazyFallback = () => (
  <div className="flex items-center justify-center h-dvh">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

function App() {
  // Popout window route: render standalone FindingsWindow
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'findings') {
    return <FindingsWindow />;
  }

  return <AppMain />;
}

function AppMain() {
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
    filters,
    setFilters,
    columnAliases,
    setColumnAliases,
    selectedPoints,
    togglePointSelection,
    clearSelection,
    analysisMode,
    yamazumiMapping,
    setAnalysisMode,
    setYamazumiMapping,
    displayOptions,
    setDisplayOptions,
    setSubgroupConfig,
    stats,
    cpkTarget,
    setCpkTarget,
  } = useData();

  // Data ingestion must be declared before importFlow since importFlow uses its callbacks.
  // The onWideFormatDetected/onTimeColumnDetected callbacks use importFlow setters,
  // but those are stable React state setters so forward-referencing is safe.
  const ingestion = useDataIngestion({
    onWideFormatDetected: result => {
      importFlowRef.current?.handleWideFormatDetected(result);
    },
    onYamazumiDetected: result => {
      importFlowRef.current?.handleYamazumiDetected(result);
    },
    onTimeColumnDetected: prompt => {
      importFlowRef.current?.setTimeExtractionPrompt(prompt);
      if (prompt.hasTimeComponent) {
        importFlowRef.current?.setTimeExtractionConfig(prev => ({ ...prev, extractHour: true }));
      }
    },
    getRawData: () => rawData,
    getOutcome: () => outcome,
    getFactors: () => factors,
  });

  const importFlow = usePasteImportFlow({
    rawData,
    outcome,
    factors,
    columnAliases,
    dataFilename,
    dataQualityReport,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    clearData: ingestion.clearData,
    clearSelection,
    applyTimeExtraction: ingestion.applyTimeExtraction,
  });

  // Ref to allow ingestion callbacks to reach importFlow setters
  const importFlowRef = React.useRef(importFlow);
  importFlowRef.current = importFlow;

  // Panel visibility and UI chrome
  const panels = useAppPanels({
    clearData: ingestion.clearData,
    wideFormatDetection: importFlow.wideFormatDetection,
    dismissWideFormat: importFlow.handleDismissWideFormat,
  });

  // Findings state
  const findingsState = useFindings();
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);

  // Mobile tab bar (phone only, <640px)
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('analysis');

  // Reset mobile tab when data is cleared
  useEffect(() => {
    if (rawData.length === 0) {
      setMobileActiveTab('analysis');
    }
  }, [rawData.length]);

  const handleMobileTabChange = useCallback(
    (tab: MobileTab) => {
      setMobileActiveTab(tab);
      if (tab === 'findings') {
        panels.setIsFindingsPanelOpen(true);
      } else if (tab === 'analysis') {
        panels.setIsFindingsPanelOpen(false);
      }
      // 'more' is handled by the bottom sheet overlay
    },
    [panels]
  );

  // Capability suggestion modal state
  const [showCapabilitySuggestion, setShowCapabilitySuggestion] = useState(false);
  const [capabilitySuggestionDismissed, setCapabilitySuggestionDismissed] = useState(false);

  // Embed mode state
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  const [embedFocusChart, setEmbedFocusChart] = useState<
    'ichart' | 'boxplot' | 'pareto' | 'stats' | null
  >(null);
  const [embedStatsTab, setEmbedStatsTab] = useState<'summary' | 'data' | 'whatif' | null>(null);

  // Embed messaging
  const { highlightedChart, highlightIntensity, notifyChartClicked } =
    useEmbedMessaging(isEmbedMode);

  // Filter navigation
  const filterNav = useFilterNavigation({
    enableHistory: true,
    enableUrlSync: true,
  });

  // Drill path for findings panel footer
  const { drillPath } = useDrillPath(rawData, filterNav.filterStack, outcome, specs);

  // Handle URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sampleKey = params.get('sample');
    const embedParam = params.get('embed');
    const chartParam = params.get('chart');
    const tabParam = params.get('tab');
    const viewParam = params.get('view');

    if (viewParam === 'whatif') {
      panels.setIsWhatIfPageOpen(true);
    }

    if (embedParam === 'true') {
      setIsEmbedMode(true);
    }

    if (chartParam && ['ichart', 'boxplot', 'pareto', 'stats'].includes(chartParam)) {
      setEmbedFocusChart(chartParam as 'ichart' | 'boxplot' | 'pareto' | 'stats');
    }

    if (tabParam && ['summary', 'data', 'whatif'].includes(tabParam)) {
      setEmbedStatsTab(tabParam as 'summary' | 'data' | 'whatif');
    }

    if (sampleKey && rawData.length === 0) {
      const sample = SAMPLES.find(s => s.urlKey === sampleKey);
      if (sample) {
        ingestion.loadSample(sample);
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

  // Control violations for DataPanel annotations
  const controlViolations = useControlViolations(filteredData, outcome, specs);

  // Complement stats for Target Discovery in sidebar
  const isDrilling = Object.keys(filters).length > 0;
  const complementInsight = useMemo(() => {
    if (!isDrilling || !outcome || !filteredData || filteredData.length >= rawData.length)
      return null;
    const filteredSet = new Set(filteredData);
    const compRows = rawData.filter(r => !filteredSet.has(r));
    const values = compRows
      .map(r => toNumericValue(r[outcome]))
      .filter((v): v is number => v !== undefined);
    if (values.length < 2) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev, count: values.length };
  }, [isDrilling, outcome, filteredData, rawData]);

  const centeringOpp = useMemo(() => (stats ? computeCenteringOpportunity(stats) : null), [stats]);

  // Capability suggestion: show when specs are set and no other detection modal is showing
  useEffect(() => {
    if (
      rawData.length > 0 &&
      (specs?.usl !== undefined || specs?.lsl !== undefined) &&
      (factors.length > 0 || rawData.length >= 10) &&
      !capabilitySuggestionDismissed &&
      !showCapabilitySuggestion &&
      !importFlow.yamazumiDetection &&
      !importFlow.wideFormatDetection
    ) {
      setShowCapabilitySuggestion(true);
    }
  }, [
    rawData.length,
    specs,
    factors.length,
    capabilitySuggestionDismissed,
    showCapabilitySuggestion,
    importFlow.yamazumiDetection,
    importFlow.wideFormatDetection,
  ]);

  const handleExport = useCallback(async () => {
    const node = document.getElementById('dashboard-export-container');
    if (!node) return;

    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: document.documentElement.dataset.theme === 'dark' ? '#0f172a' : '#f8fafc',
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

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedFindingId]);

  // Findings: pin current filter state (one-click with duplicate detection)
  const handlePinFinding = useCallback(() => {
    const existing = findingsState.findDuplicate(filters);
    if (existing) {
      panels.setIsFindingsPanelOpen(true);
      setHighlightedFindingId(existing.id);
      return;
    }
    const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
    const newFinding = findingsState.addFinding('', context);
    panels.setIsFindingsPanelOpen(true);
    setHighlightedFindingId(newFinding.id);
  }, [filters, drillPath, filteredData, outcome, specs, findingsState, panels]);

  // Chart observation: create a Finding with source metadata
  const handleAddChartObservation = useCallback(
    (
      chartType: 'boxplot' | 'pareto' | 'ichart',
      categoryKey?: string,
      _noteText?: string,
      anchorX?: number,
      anchorY?: number
    ) => {
      const source = buildFindingSource(chartType, categoryKey, anchorX, anchorY);
      const existing = findingsState.findDuplicateSource(source);
      if (existing) {
        panels.setIsFindingsPanelOpen(true);
        setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding('', context, source);
      panels.setIsFindingsPanelOpen(true);
      setHighlightedFindingId(newFinding.id);
    },
    [filters, drillPath, filteredData, outcome, specs, findingsState, panels]
  );

  // Chart findings grouped by chart type for inline annotation display
  const chartFindings = useMemo(
    () => ({
      boxplot: findingsState.getChartFindings('boxplot'),
      pareto: findingsState.getChartFindings('pareto'),
      ichart: findingsState.getChartFindings('ichart'),
    }),
    [findingsState]
  );

  // Findings: restore filter state
  const handleRestoreFinding = useCallback(
    (id: string) => {
      const ctx = findingsState.getFindingContext(id);
      if (!ctx) return;
      setFilters(ctx.activeFilters);
    },
    [findingsState, setFilters]
  );

  // Findings popout: open in separate window
  const popupRef = React.useRef<Window | null>(null);
  const handleOpenFindingsPopout = useCallback(() => {
    popupRef.current = openFindingsPopout(findingsState.findings, columnAliases, drillPath);
  }, [findingsState.findings, columnAliases, drillPath]);

  // Findings popout: sync data when findings/drillPath change
  useEffect(() => {
    if (!popupRef.current || popupRef.current.closed) return;
    updateFindingsPopout(findingsState.findings, columnAliases, drillPath);
  }, [findingsState.findings, columnAliases, drillPath]);

  // Findings popout: listen for actions from popout window
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== FINDINGS_ACTION_KEY || !e.newValue) return;
      try {
        const action = JSON.parse(e.newValue) as FindingsAction;
        switch (action.type) {
          case 'edit':
            if (action.text !== undefined) findingsState.editFinding(action.id, action.text);
            break;
          case 'delete':
            findingsState.deleteFinding(action.id);
            break;
          case 'set-status':
            if (action.status) findingsState.setFindingStatus(action.id, action.status);
            break;
          case 'set-tag':
            findingsState.setFindingTag(action.id, action.tag ?? null);
            break;
          case 'add-comment':
            if (action.text !== undefined) findingsState.addFindingComment(action.id, action.text);
            break;
          case 'edit-comment':
            if (action.commentId && action.text !== undefined)
              findingsState.editFindingComment(action.id, action.commentId, action.text);
            break;
          case 'delete-comment':
            if (action.commentId) findingsState.deleteFindingComment(action.id, action.commentId);
            break;
        }
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [findingsState]);

  const isOnline = useOnlineStatus();

  // Full-page What-If Simulator
  if (panels.isWhatIfPageOpen) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <WhatIfPage
          onBack={() => {
            panels.setIsWhatIfPageOpen(false);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div
      className={`flex flex-col h-dvh bg-surface text-content font-sans selection:bg-blue-500/30${isPhone && rawData.length > 0 ? ' pb-[50px]' : ''}`}
    >
      {/* Offline status banner */}
      {!isOnline && (
        <div
          className="bg-amber-600 text-white text-center text-sm py-1.5 px-4 font-medium"
          role="alert"
        >
          You are offline. Analysis continues to work.
        </div>
      )}
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
          isDataPanelOpen={panels.isDataPanelOpen}
          isFindingsPanelOpen={panels.isFindingsPanelOpen}
          onNewAnalysis={panels.handleResetRequest}
          onToggleDataPanel={panels.handleToggleDataPanel}
          onToggleFindingsPanel={panels.handleToggleFindingsPanel}
          onOpenDataTable={() => {
            panels.setHighlightRowIndex(null);
            panels.setIsDataTableOpen(true);
          }}
          onExportCSV={handleExportCSV}
          onExportImage={handleExport}
          onEnterPresentationMode={() => panels.setIsPresentationMode(true)}
          onOpenSettings={() => panels.setIsSettingsOpen(true)}
          onReset={panels.handleResetRequest}
          onOpenSpecEditor={() => panels.setOpenSpecEditorRequested(true)}
          onOpenWhatIf={rawData.length > 0 ? () => panels.setIsWhatIfPageOpen(true) : undefined}
          isWhatIfOpen={panels.isWhatIfPageOpen}
          isStatsSidebarOpen={panels.isStatsSidebarOpen}
          onToggleStatsSidebar={rawData.length > 0 ? panels.handleToggleStatsSidebar : undefined}
        />
      )}

      {/* Reset confirmation modal */}
      {panels.showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-secondary border border-edge rounded-xl shadow-xl p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-2">Reset Analysis?</h3>
            <p className="text-xs text-content-secondary mb-4">
              All data will be cleared. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => panels.setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={panels.handleResetConfirm}
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
        {/* Stats Sidebar (left) */}
        {panels.isStatsSidebarOpen && rawData.length > 0 && outcome && (
          <div className="hidden lg:flex flex-col w-80 flex-shrink-0 border-r border-edge bg-surface-secondary overflow-y-auto">
            <Suspense fallback={null}>
              <StatsPanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
                cpkTarget={cpkTarget}
                sampleCount={filteredData?.length}
                isDrilling={isDrilling}
                complement={complementInsight}
                centeringOpportunity={centeringOpp}
              />
            </Suspense>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Suspense fallback={<LazyFallback />}>
            {importFlow.isPasteMode ? (
              <PasteScreen
                onAnalyze={importFlow.handlePasteAnalyze}
                onCancel={importFlow.handlePasteCancel}
                error={importFlow.pasteError}
              />
            ) : importFlow.isManualEntry ? (
              <ManualEntry
                onAnalyze={importFlow.handleManualDataAnalyze}
                onCancel={importFlow.handleManualEntryCancel}
              />
            ) : rawData.length === 0 ? (
              <HomeScreen
                onLoadSample={ingestion.loadSample}
                onOpenPaste={importFlow.handleOpenPaste}
                onOpenManualEntry={importFlow.handleOpenManualEntry}
              />
            ) : importFlow.isMapping ? (
              <ColumnMapping
                columnAnalysis={importFlow.mappingColumnAnalysis}
                availableColumns={Object.keys(rawData[0])}
                previewRows={rawData.slice(0, 5)}
                totalRows={rawData.length}
                columnAliases={columnAliases}
                onColumnRename={importFlow.handleColumnRename}
                initialOutcome={outcome}
                initialFactors={factors}
                datasetName={dataFilename || undefined}
                onConfirm={importFlow.handleMappingConfirm}
                onCancel={importFlow.handleMappingCancel}
                dataQualityReport={dataQualityReport}
                onViewExcludedRows={panels.openDataTableExcluded}
                onViewAllData={panels.openDataTableAll}
                paretoMode={paretoMode}
                separateParetoFilename={separateParetoFilename}
                onParetoFileUpload={ingestion.handleParetoFileUpload}
                onClearParetoFile={ingestion.clearParetoFile}
                timeColumn={importFlow.timeExtractionPrompt?.timeColumn}
                hasTimeComponent={importFlow.timeExtractionPrompt?.hasTimeComponent}
                onTimeExtractionChange={importFlow.setTimeExtractionConfig}
                mode={importFlow.isMappingReEdit ? 'edit' : 'setup'}
              />
            ) : resolveMode(analysisMode) === 'yamazumi' && yamazumiMapping ? (
              <Suspense fallback={null}>
                <YamazumiDashboard
                  mapping={yamazumiMapping}
                  onBarClick={key =>
                    filterNav.applyFilter({
                      type: 'filter',
                      source: 'pareto',
                      factor: yamazumiMapping.stepColumn,
                      values: [key],
                    })
                  }
                  onTaktTimeChange={taktTime =>
                    setYamazumiMapping({ ...yamazumiMapping, taktTime })
                  }
                />
              </Suspense>
            ) : (
              <Dashboard
                onPointClick={panels.openDataTableAtRow}
                isPresentationMode={panels.isPresentationMode}
                onExitPresentation={() => panels.setIsPresentationMode(false)}
                hideStatsInGrid={panels.isStatsSidebarOpen}
                onExportCSV={handleExportCSV}
                onExportImage={handleExport}
                onEnterPresentationMode={() => panels.setIsPresentationMode(true)}
                highlightedChart={highlightedChart}
                highlightIntensity={highlightIntensity}
                onChartClick={isEmbedMode ? notifyChartClicked : undefined}
                embedFocusChart={embedFocusChart}
                embedStatsTab={embedStatsTab}
                onManageFactors={importFlow.openFactorManager}
                openSpecEditorRequested={panels.openSpecEditorRequested}
                onSpecEditorOpened={() => panels.setOpenSpecEditorRequested(false)}
                highlightedPointIndex={panels.highlightedChartPoint}
                filterNav={filterNav}
                onPinFinding={handlePinFinding}
                findingsCallbacks={{
                  onAddChartObservation: handleAddChartObservation,
                  chartFindings,
                  onEditFinding: findingsState.editFinding,
                  onDeleteFinding: findingsState.deleteFinding,
                }}
                findings={findingsState.findings}
              />
            )}
          </Suspense>
        </div>

        {/* Findings Panel (inline desktop, or mobile when findings tab active) */}
        <Suspense fallback={null}>
          {(panels.isDesktop || (isPhone && mobileActiveTab === 'findings')) && outcome && (
            <FindingsPanel
              isOpen={panels.isDesktop ? panels.isFindingsPanelOpen : true}
              onClose={() => {
                if (isPhone) {
                  setMobileActiveTab('analysis');
                }
                panels.handleCloseFindingsPanel();
                setHighlightedFindingId(null);
              }}
              findings={findingsState.findings}
              onEditFinding={findingsState.editFinding}
              onDeleteFinding={findingsState.deleteFinding}
              onRestoreFinding={handleRestoreFinding}
              onSetFindingStatus={findingsState.setFindingStatus}
              onSetFindingTag={findingsState.setFindingTag}
              onAddComment={(id, text) => findingsState.addFindingComment(id, text)}
              onEditComment={findingsState.editFindingComment}
              onDeleteComment={findingsState.deleteFindingComment}
              columnAliases={columnAliases}
              drillPath={drillPath}
              activeFindingId={highlightedFindingId}
              onPopout={handleOpenFindingsPopout}
              maxStatuses={3}
            />
          )}
        </Suspense>

        {/* Data Panel (desktop only, when open) */}
        <Suspense fallback={null}>
          {panels.isDesktop && rawData.length > 0 && !importFlow.isMapping && (
            <DataPanel
              isOpen={panels.isDataPanelOpen}
              onClose={panels.handleCloseDataPanel}
              highlightRowIndex={panels.highlightRowIndex}
              onRowClick={panels.handleDataPanelRowClick}
              excludedRowIndices={excludedRowIndices}
              excludedReasons={excludedReasons}
              controlViolations={controlViolations}
              selectedIndices={selectedPoints}
              onToggleSelection={togglePointSelection}
            />
          )}
        </Suspense>
      </main>

      {/* Settings Panel (slide-in from right) */}
      <Suspense fallback={null}>
        <SettingsPanel
          isOpen={panels.isSettingsOpen}
          onClose={() => panels.setIsSettingsOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DataTableModal
          isOpen={panels.isDataTableOpen}
          onClose={panels.handleCloseDataTable}
          highlightRowIndex={panels.highlightRowIndex ?? undefined}
          showExcludedOnly={panels.showExcludedOnly}
          excludedRowIndices={excludedRowIndices}
          excludedReasons={excludedReasons}
        />
      </Suspense>

      {/* Hide footer in embed mode */}
      {!isEmbedMode && (
        <AppFooter filteredCount={filteredData.length} totalCount={rawData.length} />
      )}

      {/* Wide Format Detection -- inform user Performance Mode is Azure-only */}
      {importFlow.wideFormatDetection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-secondary border border-edge rounded-xl shadow-xl p-5 w-full max-w-sm">
            <p className="text-sm text-content mb-3">
              {importFlow.wideFormatDetection.channels.length} measure columns detected —
              Performance Mode is available in the Azure App.
            </p>
            <div className="flex justify-end">
              <button
                onClick={importFlow.handleDismissWideFormat}
                className="px-4 py-2 text-sm font-medium text-white bg-surface-tertiary hover:bg-surface-elevated rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yamazumi Detection Modal */}
      {importFlow.yamazumiDetection && (
        <YamazumiDetectedModal
          detection={importFlow.yamazumiDetection}
          onEnable={taktTime => {
            const m = importFlow.yamazumiDetection!.suggestedMapping;
            setAnalysisMode('yamazumi');
            setYamazumiMapping({
              activityTypeColumn: m.activityTypeColumn!,
              cycleTimeColumn: m.cycleTimeColumn!,
              stepColumn: m.stepColumn!,
              activityColumn: m.activityColumn,
              reasonColumn: m.reasonColumn,
              productColumn: m.productColumn,
              waitTimeColumn: m.waitTimeColumn,
              taktTime,
            });
            importFlow.handleDismissYamazumi();
          }}
          onDecline={() => importFlow.handleDismissYamazumi()}
        />
      )}

      {/* Capability Suggestion Modal */}
      {showCapabilitySuggestion && (
        <CapabilitySuggestionModal
          onStartCapability={config => {
            setDisplayOptions({ ...displayOptions, standardIChartMetric: 'capability' });
            setSubgroupConfig(config);
            setShowCapabilitySuggestion(false);
            setCapabilitySuggestionDismissed(true);
          }}
          onStartStandard={() => {
            setShowCapabilitySuggestion(false);
            setCapabilitySuggestionDismissed(true);
          }}
          factorColumns={factors}
          dataFilename={dataFilename}
          outcome={outcome}
          rowCount={rawData.length}
          specs={specs}
          stats={stats}
          cpkTarget={cpkTarget}
          onSpecsChange={setSpecs}
          onCpkTargetChange={setCpkTarget}
        />
      )}

      {/* Mobile Tab Bar (phone only) */}
      {isPhone && rawData.length > 0 && (
        <MobileTabBar
          activeTab={mobileActiveTab}
          onTabChange={handleMobileTabChange}
          findingsCount={findingsState.findings.length}
          showImproveTab={false}
        />
      )}

      {/* More bottom sheet (phone only) */}
      {mobileActiveTab === 'more' && isPhone && rawData.length > 0 && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileActiveTab('analysis')}
          />
          <div className="fixed bottom-[50px] left-0 right-0 bg-surface-primary border-t border-edge rounded-t-2xl z-50 animate-slide-up safe-area-bottom">
            <div className="py-2">
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('analysis');
                  panels.setIsWhatIfPageOpen(true);
                }}
              >
                <Beaker size={18} className="text-content-secondary" />
                What-If Simulator
              </button>
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('analysis');
                  panels.setIsSettingsOpen(true);
                }}
              >
                <Settings size={18} className="text-content-secondary" />
                Settings
              </button>
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('analysis');
                  handleExportCSV();
                }}
              >
                <Download size={18} className="text-content-secondary" />
                Export CSV
              </button>
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-content hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('analysis');
                  panels.setHighlightRowIndex(null);
                  panels.setIsDataTableOpen(true);
                }}
              >
                <Table2 size={18} className="text-content-secondary" />
                Data Table
              </button>
              <div className="border-t border-edge my-1" />
              <button
                className="flex items-center gap-3 w-full px-5 py-3 min-h-[44px] text-sm text-red-400 hover:bg-surface-secondary transition-colors"
                onClick={() => {
                  setMobileActiveTab('analysis');
                  panels.handleResetRequest();
                }}
              >
                <RotateCcw size={18} />
                New Analysis
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
