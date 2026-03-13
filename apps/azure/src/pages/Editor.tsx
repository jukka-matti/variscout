import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useStorage } from '../services/storage';
import { useData } from '../context/DataContext';
import { useDataIngestion } from '../hooks/useDataIngestion';
import { useFilterNavigation } from '../hooks';
import Dashboard from '../components/Dashboard';
import { EditorToolbar } from '../components/EditorToolbar';
import DataPanel from '../components/data/DataPanel';
import DataTableModal from '../components/data/DataTableModal';
import FindingsPanel from '../components/FindingsPanel';
import ManualEntry from '../components/data/ManualEntry';
import PasteScreen from '../components/data/PasteScreen';
import WhatIfPage from '../components/WhatIfPage';
import {
  ColumnMapping,
  InvestigationPrompt,
  openFindingsPopout,
  updateFindingsPopout,
  FINDINGS_ACTION_KEY,
  type FindingsAction,
} from '@variscout/ui';
import { useControlViolations, useFindings, useDrillPath } from '@variscout/hooks';
import { isTeamPlan } from '@variscout/core';
import { buildFindingContext, buildFindingSource } from '@variscout/hooks';
import { usePhotoComments } from '../hooks/usePhotoComments';
import { getCurrentUser, type CurrentUser } from '../auth/getCurrentUser';
import { useDataMerge } from '../hooks/useDataMerge';
import type { ExclusionReason } from '@variscout/core';
import { SAMPLES } from '@variscout/data';
import {
  Upload,
  FileText,
  PenLine,
  ClipboardPaste,
  Database,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import { useEditorPanels } from '../hooks/useEditorPanels';
import { useEditorDataFlow } from '../hooks/useEditorDataFlow';
import { useTeamsShare } from '../hooks/useTeamsShare';
import { useShareFinding } from '../hooks/useShareFinding';
import { buildChartSharePayload } from '../services/shareContent';
import { buildSubPageId } from '../services/deepLinks';
import { setBeforeUnloadHandler } from '../teams';

interface EditorProps {
  projectId: string | null;
  onBack: () => void;
  /** Deep link: auto-open findings panel and highlight this finding */
  initialFindingId?: string;
  /** Deep link: auto-focus this chart type */
  initialChart?: string;
}

export const Editor: React.FC<EditorProps> = ({
  projectId,
  onBack,
  initialFindingId,
  initialChart,
}) => {
  const { syncStatus } = useStorage();
  const {
    rawData,
    filteredData,
    currentProjectName,
    hasUnsavedChanges,
    outcome,
    factors,
    specs,
    columnAliases,
    isPerformanceMode,
    measureColumns,
    measureLabel,
    dataFilename,
    dataQualityReport,
    setOutcome,
    setRawData,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    setColumnAliases,
    filters,
    setFilters,
    displayOptions,
    setDisplayOptions,
    viewState,
    setViewState,
    findings: persistedFindings,
    setFindings: setPersistedFindings,
    currentProjectLocation,
    saveProject,
    loadProject,
  } = useData();

  const ingestion = useDataIngestion({
    onTimeColumnDetected: prompt => {
      dataFlowRef.current?.setTimeExtractionPrompt(prompt);
      if (prompt.hasTimeComponent) {
        dataFlowRef.current?.setTimeExtractionConfig(prev => ({ ...prev, extractHour: true }));
      }
    },
    getRawData: () => rawData,
    getOutcome: () => outcome,
    getFactors: () => factors,
  });
  const isPhone = useIsMobile(BREAKPOINTS.phone);

  // Report view state changes for persistence (merge partial updates)
  const handleViewStateChange = useCallback(
    (partial: Partial<import('@variscout/hooks').ViewState>) => {
      setViewState({ ...(viewState ?? {}), ...partial });
    },
    [viewState, setViewState]
  );

  // Panel visibility and chart/table sync
  const panels = useEditorPanels({
    displayOptions,
    setDisplayOptions,
    viewState,
    onViewStateChange: handleViewStateChange,
  });

  // Phone: data panel opens DataTableModal instead of inline panel
  const handleDataPanelToggle = useCallback(() => {
    if (isPhone) {
      panels.setIsDataTableOpen(true);
    } else {
      panels.setIsDataPanelOpen(prev => !prev);
    }
  }, [isPhone, panels]);

  // Manual data merge (for append mode)
  const dataFlow = useEditorDataFlow({
    rawData,
    outcome,
    factors,
    specs,
    columnAliases,
    dataFilename,
    isPerformanceMode,
    measureColumns,
    measureLabel,
    setRawData,
    setOutcome,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setColumnAliases,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    loadProject,
    handleFileUpload: ingestion.handleFileUpload,
    loadSample: ingestion.loadSample,
    applyTimeExtraction: ingestion.applyTimeExtraction,
  });

  // Ref to allow ingestion callbacks to reach dataFlow setters
  const dataFlowRef = React.useRef(dataFlow);
  dataFlowRef.current = dataFlow;

  // Manual data analyze with append-mode merge
  const { handleManualDataAnalyze } = useDataMerge({
    appendMode: dataFlow.appendMode,
    existingConfig: dataFlow.existingConfig,
    rawData,
    setRawData,
    setDataFilename,
    setOutcome,
    setFactors,
    setSpecs,
    setDataQualityReport,
    setMeasureColumns,
    setMeasureLabel,
    setPerformanceMode,
    onDone: () => {
      dataFlow.manualEntryDone();
    },
  });

  // Load project data when opening an existing project
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (projectId && rawData.length === 0 && !dataFlow.isLoadingProject) {
      dataFlow.startProjectLoad();
      setLoadError(null);
      loadProject(projectId)
        .catch(() => {
          setLoadError('Failed to load project. Please try again.');
        })
        .finally(() => dataFlow.projectLoaded());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // intentionally exclude rawData/dataFlow to avoid re-triggering

  // Filter navigation
  const filterNav = useFilterNavigation({
    enableHistory: false,
    enableUrlSync: false,
  });

  // Findings state (persisted via DataContext)
  const findingsState = useFindings({
    initialFindings: persistedFindings,
    onFindingsChange: setPersistedFindings,
  });
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);

  // Teams share integration
  const { share, setDeepLink } = useTeamsShare();
  const baseUrl = window.location.origin + window.location.pathname;
  const projectName = currentProjectName || 'New Analysis';

  // Deep link: auto-open findings panel and highlight target finding (one-shot)
  const deepLinkConsumedRef = React.useRef(false);
  useEffect(() => {
    if (deepLinkConsumedRef.current || !rawData.length || !outcome) return;
    if (initialFindingId) {
      panels.setIsFindingsOpen(true);
      setHighlightedFindingId(initialFindingId);
    }
    if (initialChart) {
      handleViewStateChange({
        focusedChart: initialChart as 'ichart' | 'boxplot' | 'pareto' | null,
      });
    }
    // Clear deep link params from URL to avoid re-triggering on refresh
    if (initialFindingId || initialChart) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
    deepLinkConsumedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData.length, outcome, initialFindingId, initialChart]);

  // Update Teams deep link context when project/view changes
  useEffect(() => {
    if (!projectName || projectName === 'New Analysis') return;
    const chart = viewState?.focusedChart;
    setDeepLink(buildSubPageId(projectName, chart ? { chart } : {}), projectName);
  }, [projectName, viewState?.focusedChart, setDeepLink]);

  // Share handlers
  const { shareFinding, canMentionInChannel } = useShareFinding({ projectName, baseUrl });

  const handleShareFinding = useCallback(
    async (findingId: string) => {
      const finding = findingsState.findings.find(f => f.id === findingId);
      if (!finding) return;
      await shareFinding(finding, finding.assignee);
    },
    [findingsState.findings, shareFinding]
  );

  const handleShareChart = useCallback(
    (chartType: string) => {
      const payload = buildChartSharePayload(chartType, projectName, baseUrl);
      share(payload);
    },
    [projectName, baseUrl, share]
  );

  // Navigate to chart from finding source badge
  const handleNavigateToChart = useCallback(
    (source: import('@variscout/core').FindingSource) => {
      handleViewStateChange({ focusedChart: source.chart });
    },
    [handleViewStateChange]
  );

  // Current user (for comment author attribution)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  // Photo comments (Team plan only — wires photo processing + upload)
  const { handleAddPhoto, handleCaptureFromTeams, isTeamsCamera, handleAddCommentWithAuthor } =
    usePhotoComments({
      findingsState,
      analysisId: currentProjectName || 'default',
      author: currentUser?.name,
      location: currentProjectLocation,
    });

  // Drill path for findings panel footer
  const { drillPath } = useDrillPath(rawData, filterNav.filterStack, outcome, specs);

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightedFindingId]);

  // Findings: pin current filter state (one-click with duplicate detection)
  const handlePinFinding = useCallback(
    (noteText?: string) => {
      const existing = findingsState.findDuplicate(filters);
      if (existing) {
        panels.setIsFindingsOpen(true);
        setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding(noteText || '', context);
      panels.setIsFindingsOpen(true);
      setHighlightedFindingId(newFinding.id);
    },
    [filters, drillPath, filteredData, outcome, specs, findingsState, panels]
  );

  const handleRestoreFinding = useCallback(
    (id: string) => {
      const ctx = findingsState.getFindingContext(id);
      if (!ctx) return;
      setFilters(ctx.activeFilters);
    },
    [findingsState, setFilters]
  );

  // Chart observation: create a Finding with source metadata
  const handleAddChartObservation = useCallback(
    (
      chartType: 'boxplot' | 'pareto' | 'ichart',
      categoryKey?: string,
      noteText?: string,
      anchorX?: number,
      anchorY?: number
    ) => {
      const source = buildFindingSource(chartType, categoryKey, anchorX, anchorY);
      const existing = findingsState.findDuplicateSource(source);
      if (existing) {
        panels.setIsFindingsOpen(true);
        setHighlightedFindingId(existing.id);
        return;
      }
      const context = buildFindingContext(filters, filteredData, outcome!, specs, drillPath);
      const newFinding = findingsState.addFinding(noteText ?? '', context, source);
      panels.setIsFindingsOpen(true);
      setHighlightedFindingId(newFinding.id);
      return newFinding;
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

  // Grouped findings callbacks for Dashboard → child components
  const findingsCallbacks = useMemo(
    () => ({
      onAddChartObservation: handleAddChartObservation,
      chartFindings,
      onEditFinding: findingsState.editFinding,
      onDeleteFinding: findingsState.deleteFinding,
      canMentionInChannel,
      onShareFinding: shareFinding,
      onSetFindingAssignee: findingsState.setFindingAssignee,
    }),
    [handleAddChartObservation, chartFindings, findingsState, canMentionInChannel, shareFinding]
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

  // Control violations for DataPanel annotations
  const controlViolations = useControlViolations(filteredData, outcome, specs);

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

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = async () => {
    const name = currentProjectName || 'New Analysis';
    setSaveStatus('saving');
    try {
      await saveProject(name);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Register Teams beforeUnload handler for data loss prevention.
  // When the user navigates away from the tab, auto-save if there are unsaved changes.
  useEffect(() => {
    setBeforeUnloadHandler(async () => {
      if (hasUnsavedChanges) {
        const name = currentProjectName || 'New Analysis';
        await saveProject(name);
      }
    });
  }, [hasUnsavedChanges, currentProjectName, saveProject]);

  // If in paste mode, show PasteScreen full screen
  if (dataFlow.isPasteMode) {
    const isAppendPaste = dataFlow.appendMode && rawData.length > 0 && !!outcome;
    return (
      <PasteScreen
        onAnalyze={isAppendPaste ? dataFlow.handleAppendPaste : dataFlow.handlePasteAnalyze}
        onCancel={dataFlow.handlePasteCancel}
        error={dataFlow.pasteError}
        title={isAppendPaste ? 'Paste Additional Data' : undefined}
        submitLabel={isAppendPaste ? 'Add Data' : undefined}
      />
    );
  }

  // If in manual entry mode, show ManualEntry full screen
  if (dataFlow.isManualEntry) {
    return (
      <ManualEntry
        onAnalyze={handleManualDataAnalyze}
        onCancel={dataFlow.handleManualEntryCancel}
        appendMode={dataFlow.appendMode}
        existingConfig={dataFlow.appendMode ? dataFlow.existingConfig : undefined}
        existingRowCount={dataFlow.appendMode ? rawData.length : undefined}
      />
    );
  }

  // If in column mapping mode, show ColumnMapping full screen
  if (dataFlow.isMapping) {
    return (
      <ColumnMapping
        columnAnalysis={dataFlow.mappingColumnAnalysis}
        availableColumns={Object.keys(rawData[0] || {})}
        previewRows={rawData.slice(0, 5)}
        totalRows={rawData.length}
        columnAliases={columnAliases}
        onColumnRename={dataFlow.handleColumnRename}
        initialOutcome={outcome}
        initialFactors={factors}
        datasetName={dataFilename || 'Pasted Data'}
        onConfirm={dataFlow.handleMappingConfirm}
        onCancel={dataFlow.handleMappingCancel}
        dataQualityReport={dataQualityReport}
        maxFactors={6}
        mode={dataFlow.isMappingReEdit ? 'edit' : 'setup'}
        timeColumn={dataFlow.timeExtractionPrompt?.timeColumn}
        hasTimeComponent={dataFlow.timeExtractionPrompt?.hasTimeComponent}
        onTimeExtractionChange={dataFlow.setTimeExtractionConfig}
      />
    );
  }

  // If What-If Simulator is open, show full-page view
  if (panels.isWhatIfOpen) {
    return (
      <WhatIfPage
        onBack={() => {
          panels.setIsWhatIfOpen(false);
        }}
        filterCount={filterNav.filterStack.length}
        filterStack={filterNav.filterStack}
      />
    );
  }

  return (
    <div className={`flex flex-col ${isPhone ? 'h-[calc(100vh-64px)]' : 'h-[calc(100vh-120px)]'}`}>
      <EditorToolbar
        onBack={onBack}
        projectName={currentProjectName || (projectId ? `Analysis ${projectId}` : 'New Analysis')}
        hasUnsavedChanges={hasUnsavedChanges}
        dataState={{
          hasData: rawData.length > 0,
          hasOutcome: !!outcome,
          hasFactors: factors.length > 0,
          filteredData,
          outcome,
          specs,
        }}
        syncState={{
          syncStatus,
          saveStatus,
          onSave: handleSave,
        }}
        panelState={{
          isFindingsOpen: panels.isFindingsOpen,
          isDataPanelOpen: panels.isDataPanelOpen,
          findingsCount: findingsState.findings.length,
          onToggleFindings: () => panels.setIsFindingsOpen(prev => !prev),
          onToggleDataPanel: handleDataPanelToggle,
        }}
        dataActions={{
          onAddPasteData: () => dataFlow.startAppendPaste(),
          onAddFileData: () => dataFlow.startAppendFileUpload(),
          onAddManualData: dataFlow.handleAddMoreData,
          onOpenDataTable: () => panels.setIsDataTableOpen(true),
          onOpenWhatIf: () => panels.setIsWhatIfOpen(true),
          onOpenPresentation: () => panels.setIsPresentationMode(true),
        }}
      />

      {/* Hidden file input for append-mode file upload */}
      <input
        ref={dataFlow.appendFileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={dataFlow.handleAppendFile}
        className="hidden"
      />

      {/* Feedback toast for append operations */}
      {dataFlow.appendFeedback && (
        <div className="flex items-center gap-2 mx-2 mb-2 px-3 py-2 bg-green-900/40 border border-green-700/50 rounded-lg text-sm text-green-300 animate-in fade-in duration-300">
          <Check size={14} className="text-green-400 shrink-0" />
          {dataFlow.appendFeedback}
        </div>
      )}

      {/* First-drill investigation prompt */}
      {rawData.length > 0 && outcome && factors.length > 0 && (
        <InvestigationPrompt
          filterCount={filterNav.filterStack.length}
          isFindingsOpen={panels.isFindingsOpen}
          onOpenFindings={() => panels.setIsFindingsOpen(true)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-surface rounded-xl border border-edge overflow-hidden">
        {rawData.length === 0 ? (
          // Empty State - Upload Data + Sample Datasets
          <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto relative">
            {/* Loading overlay for project load or file parse */}
            {(dataFlow.isLoadingProject || dataFlow.isParsingFile) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={32} className="text-blue-400 animate-spin" />
                  <span className="text-sm text-content">
                    {dataFlow.isLoadingProject ? 'Loading project...' : 'Parsing file...'}
                  </span>
                </div>
              </div>
            )}
            <div className="max-w-lg w-full text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-surface-secondary rounded-full flex items-center justify-center">
                <FileText size={32} className="text-content-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-content mb-2">Start Your Analysis</h3>
              <p className="text-content-secondary mb-6">
                Upload your data, paste from Excel, enter manually, or try a sample dataset.
              </p>

              <input
                ref={dataFlow.fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={dataFlow.handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={dataFlow.triggerFileUpload}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Upload size={20} />
                  Upload File
                </button>

                <button
                  onClick={() => dataFlow.startPaste()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-tertiary text-content rounded-lg hover:bg-surface-tertiary/80 transition-colors font-medium"
                >
                  <ClipboardPaste size={20} />
                  Paste Data
                </button>

                <button
                  onClick={() => dataFlow.startManualEntry()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-tertiary text-content rounded-lg hover:bg-surface-tertiary/80 transition-colors font-medium"
                >
                  <PenLine size={20} />
                  Manual Entry
                </button>
              </div>

              {loadError && (
                <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-lg text-sm text-red-300">
                  {loadError}
                </div>
              )}
              <p className="text-xs text-content-muted mb-6">Supports CSV, XLSX, and XLS files</p>

              {/* Sample Datasets */}
              <div className="text-left">
                <h4 className="text-sm font-medium text-content mb-3 flex items-center gap-2">
                  <Database size={14} />
                  Sample Datasets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLES.filter(s => s.featured || s.category === 'cases')
                    .slice(0, 8)
                    .map(sample => (
                      <button
                        key={sample.urlKey}
                        data-testid={`sample-${sample.urlKey}`}
                        onClick={() => dataFlow.handleLoadSample(sample)}
                        className="text-left p-3 bg-surface-secondary hover:bg-surface-tertiary border border-edge hover:border-blue-500/50 rounded-lg transition-all group"
                      >
                        <span className="text-sm font-medium text-content group-hover:text-blue-300 block truncate">
                          {sample.name}
                        </span>
                        <span className="text-xs text-content-muted line-clamp-1">
                          {sample.description}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : outcome ? (
          // Dashboard with charts, optional data panel, and optional findings
          <div className="flex-1 flex overflow-hidden">
            <Dashboard
              drillFromPerformance={dataFlow.drillFromPerformance}
              onBackToPerformance={dataFlow.handleBackToPerformance}
              onDrillToMeasure={dataFlow.handleDrillToMeasure}
              onPointClick={isPhone ? undefined : panels.handlePointClick}
              highlightedPointIndex={isPhone ? undefined : panels.highlightedChartPoint}
              filterNav={filterNav}
              initialViewState={viewState ?? undefined}
              onViewStateChange={handleViewStateChange}
              isPresentationMode={panels.isPresentationMode}
              onExitPresentation={() => panels.setIsPresentationMode(false)}
              onManageFactors={dataFlow.openFactorManager}
              onPinFinding={handlePinFinding}
              onShareChart={handleShareChart}
              findingsCallbacks={findingsCallbacks}
            />
            {/* FindingsPanel: full-screen overlay on phone, inline sidebar on desktop */}
            {isPhone && panels.isFindingsOpen ? (
              <div className="fixed inset-0 z-40 bg-surface flex flex-col animate-slide-up safe-area-bottom">
                <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
                  <h2 className="text-sm font-semibold text-content">Findings</h2>
                  <button
                    onClick={() => {
                      panels.setIsFindingsOpen(false);
                      setHighlightedFindingId(null);
                    }}
                    className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                    style={{ minWidth: 44, minHeight: 44 }}
                    aria-label="Close findings"
                  >
                    <X size={20} />
                  </button>
                </div>
                <FindingsPanel
                  isOpen={true}
                  onClose={() => {
                    panels.setIsFindingsOpen(false);
                    setHighlightedFindingId(null);
                  }}
                  findings={findingsState.findings}
                  onEditFinding={findingsState.editFinding}
                  onDeleteFinding={findingsState.deleteFinding}
                  onRestoreFinding={handleRestoreFinding}
                  onSetFindingStatus={findingsState.setFindingStatus}
                  onSetFindingTag={findingsState.setFindingTag}
                  onAddComment={handleAddCommentWithAuthor}
                  onEditComment={findingsState.editFindingComment}
                  onDeleteComment={findingsState.deleteFindingComment}
                  onAddPhoto={isTeamPlan() ? handleAddPhoto : undefined}
                  onCaptureFromTeams={
                    isTeamPlan() && isTeamsCamera ? handleCaptureFromTeams : undefined
                  }
                  showAuthors={true}
                  columnAliases={columnAliases}
                  drillPath={drillPath}
                  activeFindingId={highlightedFindingId}
                  onShareFinding={handleShareFinding}
                  onSetFindingAssignee={findingsState.setFindingAssignee}
                  onNavigateToChart={handleNavigateToChart}
                  viewMode={viewState?.findingsViewMode}
                  onViewModeChange={mode => handleViewStateChange({ findingsViewMode: mode })}
                />
              </div>
            ) : (
              <FindingsPanel
                isOpen={panels.isFindingsOpen}
                onClose={() => {
                  panels.setIsFindingsOpen(false);
                  setHighlightedFindingId(null);
                }}
                findings={findingsState.findings}
                onEditFinding={findingsState.editFinding}
                onDeleteFinding={findingsState.deleteFinding}
                onRestoreFinding={handleRestoreFinding}
                onSetFindingStatus={findingsState.setFindingStatus}
                onSetFindingTag={findingsState.setFindingTag}
                onAddComment={handleAddCommentWithAuthor}
                onEditComment={findingsState.editFindingComment}
                onDeleteComment={findingsState.deleteFindingComment}
                onAddPhoto={isTeamPlan() ? handleAddPhoto : undefined}
                onCaptureFromTeams={
                  isTeamPlan() && isTeamsCamera ? handleCaptureFromTeams : undefined
                }
                showAuthors={true}
                columnAliases={columnAliases}
                drillPath={drillPath}
                activeFindingId={highlightedFindingId}
                onPopout={handleOpenFindingsPopout}
                onShareFinding={handleShareFinding}
                onSetFindingAssignee={findingsState.setFindingAssignee}
                onNavigateToChart={handleNavigateToChart}
                viewMode={viewState?.findingsViewMode}
                onViewModeChange={mode => handleViewStateChange({ findingsViewMode: mode })}
              />
            )}
            {/* DataPanel: hidden on phone (use DataTableModal instead) */}
            {!isPhone && (
              <DataPanel
                isOpen={panels.isDataPanelOpen}
                onClose={() => panels.setIsDataPanelOpen(false)}
                highlightRowIndex={panels.highlightRowIndex}
                onRowClick={panels.handleRowClick}
                controlViolations={controlViolations}
                onOpenEditor={() => panels.setIsDataTableOpen(true)}
              />
            )}
          </div>
        ) : (
          // Data loaded but no outcome selected -- column mapping fallback
          <ColumnMapping
            columnAnalysis={dataFlow.mappingColumnAnalysis}
            availableColumns={Object.keys(rawData[0] || {})}
            previewRows={rawData.slice(0, 5)}
            totalRows={rawData.length}
            columnAliases={columnAliases}
            onColumnRename={dataFlow.handleColumnRename}
            initialOutcome={outcome}
            initialFactors={factors}
            datasetName={dataFilename || 'Data'}
            onConfirm={dataFlow.handleMappingConfirm}
            onCancel={dataFlow.handleMappingCancel}
            dataQualityReport={dataQualityReport}
            maxFactors={6}
            timeColumn={dataFlow.timeExtractionPrompt?.timeColumn}
            hasTimeComponent={dataFlow.timeExtractionPrompt?.hasTimeComponent}
            onTimeExtractionChange={dataFlow.setTimeExtractionConfig}
          />
        )}
      </div>

      {/* Data Table Editor Modal */}
      <DataTableModal
        isOpen={panels.isDataTableOpen}
        onClose={() => panels.setIsDataTableOpen(false)}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
        controlViolations={controlViolations}
      />
    </div>
  );
};
