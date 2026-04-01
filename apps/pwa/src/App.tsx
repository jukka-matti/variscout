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
  PerformanceDetectedModal,
  CapabilitySuggestionModal,
  MobileTabBar,
  type MobileTab,
  useIsMobile,
  BREAKPOINTS,
  QuestionsTabView,
  JournalTabView,
  type PIOverflowView,
} from '@variscout/ui';
import { Beaker, Settings, Download, Table2, RotateCcw, FileText } from 'lucide-react';
import {
  useFindings,
  useHypotheses,
  useDrillPath,
  buildFindingContext,
  buildFindingSource,
  useJournalEntries,
} from '@variscout/hooks';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import { useDataIngestion } from './hooks/useDataIngestion';
import { useEmbedMessaging } from './hooks/useEmbedMessaging';
import { SAMPLES } from '@variscout/data';
import { type ExclusionReason, toNumericValue } from '@variscout/core';
import { resolveMode, getStrategy } from '@variscout/core/strategy';
import { computeCenteringOpportunity } from '@variscout/core/variation';
import { useQuestionGeneration } from '@variscout/hooks';
import { usePasteImportFlow } from './hooks/usePasteImportFlow';
import { useAppPanels } from './hooks/useAppPanels';
import { useFindingsStore } from './features/findings/findingsStore';
import { useProjectionStore } from './features/projection/projectionStore';
import { useInvestigationStore } from './features/investigation/investigationStore';
import { useInvestigationOrchestration } from './features/investigation/useInvestigationOrchestration';
import { useImprovementOrchestration } from './features/improvement/useImprovementOrchestration';

// Lazy-loaded heavy components for code splitting
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const HomeScreen = React.lazy(() => import('./components/HomeScreen'));
const PasteScreen = React.lazy(() => import('./components/data/PasteScreen'));
const ManualEntry = React.lazy(() => import('./components/data/ManualEntry'));
const WhatIfPage = React.lazy(() => import('./components/WhatIfPage'));
const SettingsPanel = React.lazy(() => import('./components/settings/SettingsPanel'));
const DataTableModal = React.lazy(() => import('./components/data/DataTableModal'));
const FindingsPanel = React.lazy(() => import('./components/FindingsPanel'));
const YamazumiDashboard = React.lazy(() => import('./components/YamazumiDashboard'));
const StatsPanel = React.lazy(() => import('./components/StatsPanel'));
const InvestigationView = React.lazy(() => import('./components/views/InvestigationView'));
const ImprovementView = React.lazy(() => import('./components/views/ImprovementView'));
const ReportView = React.lazy(() => import('./components/views/ReportView'));

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
    hypotheses,
    setHypotheses,
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

  // Findings state — useFindings is the CRUD engine, store is the read-side cache
  const findingsState = useFindings();
  useEffect(() => {
    useFindingsStore.getState().syncFindings(findingsState.findings);
  }, [findingsState.findings]);
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const setHighlightedFindingId = useFindingsStore(s => s.setHighlightedFindingId);

  // Hypotheses + orchestration
  const hypothesesState = useHypotheses({
    initialHypotheses: hypotheses,
    onHypothesesChange: setHypotheses,
  });

  // Question-driven investigation (ADR-053)
  const resolved = resolveMode(analysisMode ?? 'standard');
  const {
    questions: factorIntelQuestions,
    handleQuestionClick,
    factorRequest,
  } = useQuestionGeneration({
    filteredData: filteredData ?? [],
    outcome,
    factors,
    hypothesesState,
    mode: resolved,
  });

  // PI Panel: journal entries (session-only; clears on refresh — PWA has no persistence)
  const journalEntries = useJournalEntries({
    findings: findingsState.findings,
    questions: factorIntelQuestions,
  });

  // PI Panel: open question count for badge
  const openQuestionCount = useMemo(
    () =>
      factorIntelQuestions.filter(q => q.status === 'untested' || q.status === 'partial').length,
    [factorIntelQuestions]
  );

  // PI Panel: overflow view state (local — PWA has no Zustand panels store for this)
  const [piOverflowView, setPIOverflowView] = useState<PIOverflowView>(null);

  const investigation = useInvestigationOrchestration({
    hypothesesState,
    findingsState: {
      findings: findingsState.findings,
      linkHypothesis: findingsState.linkHypothesis,
      setFindingStatus: findingsState.setFindingStatus,
      addAction: findingsState.addAction,
    },
    processContext: undefined,
    stats,
  });

  const improvementOrch = useImprovementOrchestration({
    hypothesesState,
    findingsState: {
      findings: findingsState.findings,
      addAction: findingsState.addAction,
    },
  });

  const investigationHypothesesMap = useInvestigationStore(s => s.hypothesesMap);

  // Mobile tab bar (phone only, <640px)
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('analysis');

  // Reset mobile tab and workspace when data is cleared
  useEffect(() => {
    if (rawData.length === 0) {
      setMobileActiveTab('analysis');
      panels.showAnalysis();
    }
  }, [rawData.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMobileTabChange = useCallback(
    (tab: MobileTab) => {
      setMobileActiveTab(tab);
      if (tab === 'findings') {
        panels.showInvestigation();
      } else if (tab === 'analysis') {
        panels.showAnalysis();
      } else if (tab === 'improve') {
        panels.showImprovement();
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

  // Sync complement + drilling state to projection store (sidebar reads from store)
  useEffect(() => {
    useProjectionStore.setState({
      complement: complementInsight,
      isDrilling,
      centeringOpportunity: centeringOpp,
    });
  }, [complementInsight, isDrilling, centeringOpp]);

  const projIsDrilling = useProjectionStore(s => s.isDrilling);
  const projComplement = useProjectionStore(s => s.complement);
  const projCentering = useProjectionStore(s => s.centeringOpportunity);
  const projActive = useProjectionStore(s => s.activeProjection);

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
          isFindingsPanelOpen={panels.isFindingsPanelOpen}
          onNewAnalysis={panels.handleResetRequest}
          onToggleFindingsPanel={panels.handleToggleFindingsPanel}
          onOpenDataTable={() => {
            panels.setHighlightRowIndex(null);
            panels.setIsDataTableOpen(true);
          }}
          onExportCSV={handleExportCSV}
          onExportImage={handleExport}
          onOpenSettings={() => panels.setIsSettingsOpen(true)}
          onReset={panels.handleResetRequest}
          onOpenSpecEditor={() => panels.setOpenSpecEditorRequested(true)}
          onOpenWhatIf={rawData.length > 0 ? () => panels.setIsWhatIfPageOpen(true) : undefined}
          isWhatIfOpen={panels.isWhatIfPageOpen}
          isStatsSidebarOpen={panels.isStatsSidebarOpen}
          onToggleStatsSidebar={rawData.length > 0 ? panels.handleToggleStatsSidebar : undefined}
          hideFindings={panels.activeView === 'investigation'}
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
                isDrilling={projIsDrilling}
                complement={projComplement}
                centeringOpportunity={projCentering}
                activeProjection={projActive}
                renderQuestionsTab={() => (
                  <QuestionsTabView
                    questions={factorIntelQuestions}
                    findings={findingsState.findings}
                    onQuestionClick={handleQuestionClick}
                    evidenceLabel={getStrategy(resolved).questionStrategy.evidenceLabel}
                  />
                )}
                renderJournalTab={() => <JournalTabView entries={journalEntries} />}
                openQuestionCount={openQuestionCount}
                overflowView={piOverflowView}
                onOverflowViewChange={setPIOverflowView}
              />
            </Suspense>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Workspace tabs — visible when data is loaded and past mapping */}
          {rawData.length > 0 &&
            !importFlow.isPasteMode &&
            !importFlow.isManualEntry &&
            !importFlow.isMapping &&
            !isEmbedMode &&
            !isPhone && (
              <div className="flex border-b border-edge flex-shrink-0 bg-surface">
                {(
                  [
                    { id: 'analysis', label: 'Analysis' },
                    { id: 'investigation', label: 'Investigation' },
                    { id: 'improvement', label: 'Improvement' },
                    { id: 'report', label: 'Report' },
                  ] as const
                ).map(ws => (
                  <button
                    key={ws.id}
                    className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                      panels.activeView === ws.id
                        ? 'border-blue-500 text-blue-500'
                        : 'border-transparent text-content-secondary hover:text-content hover:border-content-tertiary'
                    }`}
                    onClick={() => {
                      if (ws.id === 'analysis') panels.showAnalysis();
                      else if (ws.id === 'investigation') panels.showInvestigation();
                      else if (ws.id === 'improvement') panels.showImprovement();
                      else if (ws.id === 'report') panels.showReport();
                    }}
                  >
                    {ws.label}
                  </button>
                ))}
              </div>
            )}

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
                suggestedStack={importFlow.suggestedStack}
                onStackConfigChange={importFlow.handleStackConfigChange}
                rowLimit={50000}
              />
            ) : panels.activeView === 'investigation' ? (
              <InvestigationView
                filteredData={filteredData ?? []}
                outcome={outcome}
                factors={factors}
                findingsState={findingsState}
                handleRestoreFinding={handleRestoreFinding}
                handleSetFindingStatus={investigation.handleSetFindingStatus}
                drillPath={drillPath}
                hypothesesState={hypothesesState}
                handleCreateHypothesis={investigation.handleCreateHypothesis}
                factorIntelQuestions={factorIntelQuestions}
                handleQuestionClick={handleQuestionClick}
                columnAliases={columnAliases}
                resolvedMode={resolved}
              />
            ) : panels.activeView === 'improvement' ? (
              <ImprovementView
                hypothesesState={hypothesesState}
                onBack={panels.showAnalysis}
                handleConvertIdeasToActions={improvementOrch.handleConvertIdeasToActions}
              />
            ) : panels.activeView === 'report' ? (
              <ReportView
                onClose={panels.showAnalysis}
                stats={stats}
                specs={specs}
                findings={findingsState.findings}
                hypotheses={hypothesesState.hypotheses}
                columnAliases={columnAliases}
                dataFilename={dataFilename}
                sampleCount={filteredData?.length ?? 0}
                analysisMode={analysisMode}
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
                hideStatsInGrid={panels.isStatsSidebarOpen}
                onExportCSV={handleExportCSV}
                onExportImage={handleExport}
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
                requestedFactor={factorRequest}
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
        {/* Hidden when in investigation workspace — the workspace IS the findings view */}
        <Suspense fallback={null}>
          {panels.activeView !== 'investigation' &&
            (panels.isDesktop || (isPhone && mobileActiveTab === 'findings')) &&
            outcome && (
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
                onSetFindingStatus={investigation.handleSetFindingStatus}
                onSetFindingTag={findingsState.setFindingTag}
                onAddComment={(id, text) => findingsState.addFindingComment(id, text)}
                onEditComment={findingsState.editFindingComment}
                onDeleteComment={findingsState.deleteFindingComment}
                columnAliases={columnAliases}
                drillPath={drillPath}
                activeFindingId={highlightedFindingId}
                onPopout={handleOpenFindingsPopout}
                maxStatuses={3}
                onCreateHypothesis={investigation.handleCreateHypothesis}
                hypothesesMap={investigationHypothesesMap}
                questions={factorIntelQuestions}
                evidenceLabel={getStrategy(resolved).questionStrategy.evidenceLabel}
                onQuestionClick={handleQuestionClick}
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

      {/* Wide Format Detection — Performance Mode */}
      {importFlow.wideFormatDetection && (
        <PerformanceDetectedModal
          detection={importFlow.wideFormatDetection}
          onEnable={(_columns, _label) => {
            setAnalysisMode('performance');
            importFlow.handleDismissWideFormat();
          }}
          onDecline={importFlow.handleDismissWideFormat}
        />
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
          showImproveTab={true}
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
                  panels.showReport();
                }}
              >
                <FileText size={18} className="text-content-secondary" />
                Report
              </button>
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
