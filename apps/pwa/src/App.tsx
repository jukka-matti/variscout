import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { useData } from './context/DataContext';
import { downloadCSV } from './lib/export';
import SettingsPanel from './components/settings/SettingsPanel';
import DataTableModal from './components/data/DataTableModal';
import DataPanel from './components/data/DataPanel';
import FindingsPanel from './components/FindingsPanel';
import { useFilterNavigation } from './hooks/useFilterNavigation';
import {
  ColumnMapping,
  InvestigationPrompt,
  FindingsWindow,
  openFindingsPopout,
  updateFindingsPopout,
  FINDINGS_ACTION_KEY,
  type FindingsAction,
} from '@variscout/ui';
import { useFindings, useDrillPath } from '@variscout/hooks';
import type { FindingContext } from '@variscout/core';
import Dashboard from './components/Dashboard';
import HomeScreen from './components/HomeScreen';
import PasteScreen from './components/data/PasteScreen';
import ManualEntry from './components/data/ManualEntry';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import WhatIfPage from './components/WhatIfPage';
import { useDataIngestion } from './hooks/useDataIngestion';
import { useEmbedMessaging } from './hooks/useEmbedMessaging';
import { SAMPLES } from '@variscout/data';
import { type ExclusionReason } from '@variscout/core';
import { useControlViolations } from '@variscout/hooks';
import { usePasteImportFlow } from './hooks/usePasteImportFlow';
import { useAppPanels } from './hooks/useAppPanels';

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
  } = useData();

  // Data ingestion must be declared before importFlow since importFlow uses its callbacks.
  // The onWideFormatDetected/onTimeColumnDetected callbacks use importFlow setters,
  // but those are stable React state setters so forward-referencing is safe.
  const ingestion = useDataIngestion({
    onWideFormatDetected: result => {
      importFlowRef.current?.handleWideFormatDetected(result);
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
    paretoMode,
    separateParetoFilename,
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
    handleParetoFileUpload: ingestion.handleParetoFileUpload,
    clearParetoFile: ingestion.clearParetoFile,
  });

  // Ref to allow ingestion callbacks to reach importFlow setters
  const importFlowRef = React.useRef(importFlow);
  importFlowRef.current = importFlow;

  // Panel visibility and UI chrome
  const panels = useAppPanels({
    clearData: ingestion.clearData,
    wideFormatDetection: importFlow.wideFormatDetection,
    setWideFormatDetection: importFlow.setWideFormatDetection,
  });

  // Findings state
  const findingsState = useFindings();
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);

  // Embed mode state
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  const [embedFocusChart, setEmbedFocusChart] = useState<
    'ichart' | 'boxplot' | 'pareto' | 'stats' | null
  >(null);
  const [embedStatsTab, setEmbedStatsTab] = useState<'summary' | 'histogram' | 'normality' | null>(
    null
  );

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

    if (tabParam && ['summary', 'histogram', 'normality'].includes(tabParam)) {
      setEmbedStatsTab(tabParam as 'summary' | 'histogram' | 'normality');
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

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedFindingId]);

  // Findings: pin current filter state (one-click with duplicate detection)
  const handlePinFinding = useCallback(() => {
    // Check for duplicate
    const existing = findingsState.findDuplicate(filters);
    if (existing) {
      panels.setIsFindingsPanelOpen(true);
      setHighlightedFindingId(existing.id);
      return;
    }
    // Build context and create finding immediately
    const context: FindingContext = {
      activeFilters: { ...filters },
      cumulativeScope:
        drillPath.length > 0 ? drillPath[drillPath.length - 1].cumulativeScope * 100 : null,
      stats:
        filteredData.length > 0
          ? {
              mean:
                filteredData.reduce((sum, r) => {
                  const v = Number(r[outcome!]);
                  return isNaN(v) ? sum : sum + v;
                }, 0) / filteredData.length,
              cpk: undefined, // computed stats come from dashboard, keep simple here
              samples: filteredData.length,
            }
          : undefined,
    };
    const newFinding = findingsState.addFinding('', context);
    panels.setIsFindingsPanelOpen(true);
    setHighlightedFindingId(newFinding.id);
  }, [filters, drillPath, filteredData, outcome, findingsState, panels]);

  // Findings: restore filter state
  const handleRestoreFinding = useCallback(
    (id: string) => {
      const ctx = findingsState.getFindingContext(id);
      if (!ctx) return;
      setFilters(ctx.activeFilters);
    },
    [findingsState, filterNav, setFilters]
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

  // Full-page What-If Simulator
  if (panels.isWhatIfPageOpen) {
    return (
      <WhatIfPage
        onBack={() => {
          panels.setIsWhatIfPageOpen(false);
        }}
      />
    );
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

      {/* First-drill investigation prompt */}
      {rawData.length > 0 && outcome && !isEmbedMode && (
        <InvestigationPrompt
          filterCount={filterNav.filterStack.length}
          isFindingsOpen={panels.isFindingsPanelOpen}
          onOpenMindmap={panels.handleToggleFindingsPanel}
        />
      )}

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-hidden relative flex">
        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
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
          ) : (
            <Dashboard
              onPointClick={panels.openDataTableAtRow}
              isPresentationMode={panels.isPresentationMode}
              onExitPresentation={() => panels.setIsPresentationMode(false)}
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
            />
          )}
        </div>

        {/* Data Panel (desktop only, when open) */}
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
      </main>

      {/* Settings Panel (slide-in from right) */}
      <SettingsPanel
        isOpen={panels.isSettingsOpen}
        onClose={() => panels.setIsSettingsOpen(false)}
      />

      {/* Findings Panel (slide-in from right) */}
      {outcome && (
        <FindingsPanel
          isOpen={panels.isFindingsPanelOpen}
          onClose={() => {
            panels.handleCloseFindingsPanel();
            setHighlightedFindingId(null);
          }}
          findings={findingsState.findings}
          onEditFinding={findingsState.editFinding}
          onDeleteFinding={findingsState.deleteFinding}
          onRestoreFinding={handleRestoreFinding}
          onSetFindingStatus={findingsState.setFindingStatus}
          onSetFindingTag={findingsState.setFindingTag}
          onAddComment={findingsState.addFindingComment}
          onEditComment={findingsState.editFindingComment}
          onDeleteComment={findingsState.deleteFindingComment}
          columnAliases={columnAliases}
          drillPath={drillPath}
          activeFindingId={highlightedFindingId}
          onPopout={handleOpenFindingsPopout}
        />
      )}

      <DataTableModal
        isOpen={panels.isDataTableOpen}
        onClose={panels.handleCloseDataTable}
        highlightRowIndex={panels.highlightRowIndex ?? undefined}
        showExcludedOnly={panels.showExcludedOnly}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
      />

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
    </div>
  );
}

export default App;
