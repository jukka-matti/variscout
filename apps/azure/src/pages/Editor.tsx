import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useStorage } from '../services/storage';
import { useData } from '../context/DataContext';
import { useDataIngestion } from '../hooks/useDataIngestion';
import { useFilterNavigation } from '../hooks';
import Dashboard from '../components/Dashboard';
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
import type { FindingContext } from '@variscout/core';
import { isTeamPlan } from '@variscout/core';
import { usePhotoComments } from '../hooks/usePhotoComments';
import { getCurrentUser, type CurrentUser } from '../auth/getCurrentUser';
import { useDataMerge } from '../hooks/useDataMerge';
import { downloadCSV } from '@variscout/core';
import type { ExclusionReason } from '@variscout/core';
import { SAMPLES } from '@variscout/data';
import {
  Upload,
  ArrowLeft,
  Save,
  FileText,
  Cloud,
  CloudOff,
  PenLine,
  ClipboardPaste,
  Table2,
  Pencil,
  Plus,
  ClipboardList,
  Beaker,
  Download,
  Database,
  RefreshCw,
  ChevronDown,
  Check,
  Maximize2,
  EllipsisVertical,
  X,
} from 'lucide-react';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import { useEditorPanels } from '../hooks/useEditorPanels';
import { useEditorDataFlow } from '../hooks/useEditorDataFlow';
import { useTeamsShare } from '../hooks/useTeamsShare';
import { buildFindingSharePayload, buildChartSharePayload } from '../services/shareContent';
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

  // Add Data dropdown state
  const [addDataOpen, setAddDataOpen] = useState(false);
  const addDataRef = React.useRef<HTMLDivElement>(null);

  // Overflow menu state (phone only)
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!addDataOpen && !overflowOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addDataOpen && addDataRef.current && !addDataRef.current.contains(e.target as Node)) {
        setAddDataOpen(false);
      }
      if (overflowOpen && overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addDataOpen, overflowOpen]);

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
      dataFlow.setIsManualEntry(false);
      dataFlow.setAppendMode(false);
    },
  });

  // Load project data when opening an existing project
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (projectId && rawData.length === 0 && !dataFlow.isLoadingProject) {
      dataFlow.setIsLoadingProject(true);
      setLoadError(null);
      loadProject(projectId)
        .catch(() => {
          setLoadError('Failed to load project. Please try again.');
        })
        .finally(() => dataFlow.setIsLoadingProject(false));
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
  const [deepLinkConsumed, setDeepLinkConsumed] = useState(false);
  useEffect(() => {
    if (deepLinkConsumed || !rawData.length || !outcome) return;
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
    setDeepLinkConsumed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData.length, outcome, initialFindingId, initialChart, deepLinkConsumed]);

  // Update Teams deep link context when project/view changes
  useEffect(() => {
    if (!projectName || projectName === 'New Analysis') return;
    const chart = viewState?.focusedChart;
    setDeepLink(buildSubPageId(projectName, chart ? { chart } : {}), projectName);
  }, [projectName, viewState?.focusedChart, setDeepLink]);

  // Share handlers
  const handleShareFinding = useCallback(
    (findingId: string) => {
      const finding = findingsState.findings.find(f => f.id === findingId);
      if (!finding) return;
      const payload = buildFindingSharePayload(finding, projectName, baseUrl);
      share(payload);
    },
    [findingsState.findings, projectName, baseUrl, share]
  );

  const handleShareChart = useCallback(
    (chartType: string) => {
      const payload = buildChartSharePayload(chartType, projectName, baseUrl);
      share(payload);
    },
    [projectName, baseUrl, share]
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
  const handlePinFinding = useCallback(() => {
    // Check for duplicate
    const existing = findingsState.findDuplicate(filters);
    if (existing) {
      panels.setIsFindingsOpen(true);
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
              samples: filteredData.length,
            }
          : undefined,
    };
    const newFinding = findingsState.addFinding('', context);
    panels.setIsFindingsOpen(true);
    setHighlightedFindingId(newFinding.id);
  }, [filters, drillPath, filteredData, outcome, findingsState, panels]);

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

  // Sync status icon
  const SyncIcon =
    syncStatus.status === 'synced' || syncStatus.status === 'syncing' ? Cloud : CloudOff;
  const syncColor =
    syncStatus.status === 'synced'
      ? 'text-green-400'
      : syncStatus.status === 'syncing'
        ? 'text-blue-400'
        : syncStatus.status === 'error'
          ? 'text-red-400'
          : syncStatus.status === 'conflict'
            ? 'text-amber-400'
            : 'text-content-muted';

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
      {/* Header with back navigation */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            aria-label="Back to dashboard"
            className="flex items-center gap-1 text-content-muted hover:text-content transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} />
            {!isPhone && <span>Back</span>}
          </button>
          <h2
            className={`font-semibold text-content truncate ${isPhone ? 'text-base' : 'text-xl'}`}
          >
            {currentProjectName || (projectId ? `Analysis ${projectId}` : 'New Analysis')}
            {hasUnsavedChanges && <span className="text-amber-400 ml-2">•</span>}
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Sync Status — Team plan only, hidden on phone to save space */}
          {!isPhone &&
            isTeamPlan() &&
            (syncStatus.status === 'error' ? (
              <button
                onClick={() => {
                  window.location.href = '/.auth/login/aad';
                }}
                className={`flex items-center gap-1.5 text-sm ${syncColor} hover:text-red-300 transition-colors`}
                title="Click to re-authenticate"
              >
                <SyncIcon size={16} />
                <span className="underline underline-offset-2">
                  {syncStatus.message || 'Auth error'}
                </span>
              </button>
            ) : (
              <div className={`flex items-center gap-1.5 text-sm ${syncColor}`}>
                <SyncIcon
                  size={16}
                  className={syncStatus.status === 'syncing' ? 'animate-pulse' : ''}
                />
                <span className="text-content-secondary">
                  {syncStatus.message || syncStatus.status}
                </span>
              </div>
            ))}

          {/* ===== Desktop toolbar (hidden on phone) ===== */}
          {!isPhone && (
            <>
              {/* Add Data Dropdown */}
              {rawData.length > 0 && outcome && (
                <div ref={addDataRef} className="relative">
                  <button
                    onClick={() => setAddDataOpen(prev => !prev)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                    title="Add more data"
                    data-testid="btn-add-data"
                  >
                    <Plus size={16} />
                    <span className="text-sm">Add Data</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${addDataOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {addDataOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 py-1">
                      <button
                        onClick={() => {
                          setAddDataOpen(false);
                          dataFlow.setAppendMode(true);
                          dataFlow.setIsPasteMode(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:text-content hover:bg-surface-tertiary transition-colors"
                        data-testid="add-data-paste"
                      >
                        <ClipboardPaste size={15} />
                        Paste Data
                      </button>
                      <button
                        onClick={() => {
                          setAddDataOpen(false);
                          dataFlow.setAppendMode(true);
                          dataFlow.triggerAppendFileUpload();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:text-content hover:bg-surface-tertiary transition-colors"
                        data-testid="add-data-file"
                      >
                        <Upload size={15} />
                        Upload File
                      </button>
                      <button
                        onClick={() => {
                          setAddDataOpen(false);
                          dataFlow.handleAddMoreData();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:text-content hover:bg-surface-tertiary transition-colors"
                        data-testid="add-data-manual"
                      >
                        <PenLine size={15} />
                        Manual Entry
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Data */}
              {rawData.length > 0 && outcome && (
                <button
                  onClick={() => panels.setIsDataTableOpen(true)}
                  className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                  title="Edit Data Table"
                  data-testid="btn-edit-data"
                >
                  <Pencil size={18} />
                </button>
              )}

              {/* CSV Export */}
              {rawData.length > 0 && outcome && (
                <button
                  onClick={() => downloadCSV(filteredData, outcome, specs)}
                  className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                  title="Export filtered data as CSV"
                  data-testid="btn-csv-export"
                >
                  <Download size={18} />
                </button>
              )}

              {/* What-If Simulator */}
              {rawData.length > 0 && outcome && (
                <button
                  onClick={() => panels.setIsWhatIfOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                  title="What-If Simulator"
                  data-testid="btn-what-if"
                >
                  <Beaker size={16} />
                  <span>What-If</span>
                </button>
              )}

              {/* Presentation Mode */}
              {rawData.length > 0 && outcome && (
                <button
                  onClick={() => panels.setIsPresentationMode(true)}
                  className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
                  title="Presentation Mode"
                  data-testid="btn-presentation"
                >
                  <Maximize2 size={18} />
                </button>
              )}

              {/* Findings Toggle */}
              {rawData.length > 0 && outcome && factors.length > 0 && (
                <button
                  onClick={() => panels.setIsFindingsOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    panels.isFindingsOpen
                      ? 'bg-blue-600 text-white'
                      : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                  }`}
                  title={panels.isFindingsOpen ? 'Hide Findings' : 'Show Findings'}
                  data-testid="btn-findings"
                >
                  <ClipboardList size={16} />
                  <span className="hidden lg:inline">
                    Findings
                    {findingsState.findings.length > 0 && ` (${findingsState.findings.length})`}
                  </span>
                </button>
              )}

              {/* Data Panel Toggle */}
              {rawData.length > 0 && outcome && (
                <button
                  onClick={handleDataPanelToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    panels.isDataPanelOpen
                      ? 'bg-blue-600 text-white'
                      : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                  }`}
                  title={panels.isDataPanelOpen ? 'Hide Data Panel' : 'Show Data Panel'}
                  data-testid="btn-data-panel"
                >
                  <Table2 size={18} />
                </button>
              )}
            </>
          )}

          {/* Save Button (always visible) */}
          <button
            onClick={handleSave}
            disabled={rawData.length === 0 || saveStatus === 'saving'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            data-testid="btn-save"
          >
            <Save size={16} />
            {!isPhone &&
              (saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                  ? 'Saved'
                  : saveStatus === 'error'
                    ? 'Save Failed'
                    : 'Save')}
          </button>

          {/* ===== Phone overflow menu ===== */}
          {isPhone && rawData.length > 0 && outcome && (
            <div ref={overflowRef} className="relative">
              <button
                onClick={() => setOverflowOpen(prev => !prev)}
                className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
                title="More actions"
                aria-label="More actions"
                data-testid="btn-overflow"
              >
                <EllipsisVertical size={20} />
              </button>
              {overflowOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 py-1 animate-fade-in">
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      dataFlow.setAppendMode(true);
                      dataFlow.setIsPasteMode(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <Plus size={16} />
                    Add Data
                  </button>
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      panels.setIsDataTableOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <Pencil size={16} />
                    Edit Data
                  </button>
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      downloadCSV(filteredData, outcome, specs);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                  <div className="border-t border-edge my-1" />
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      panels.setIsWhatIfOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <Beaker size={16} />
                    What-If
                  </button>
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      panels.setIsPresentationMode(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <Maximize2 size={16} />
                    Presentation
                  </button>
                  {factors.length > 0 && (
                    <button
                      onClick={() => {
                        setOverflowOpen(false);
                        panels.setIsFindingsOpen(prev => !prev);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                    >
                      <ClipboardList size={16} />
                      Findings
                      {findingsState.findings.length > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
                          {findingsState.findings.length}
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setOverflowOpen(false);
                      handleDataPanelToggle();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-content hover:bg-surface-tertiary transition-colors"
                  >
                    <Table2 size={16} />
                    Data Table
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                  onClick={() => dataFlow.setIsPasteMode(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-tertiary text-content rounded-lg hover:bg-surface-tertiary/80 transition-colors font-medium"
                >
                  <ClipboardPaste size={20} />
                  Paste Data
                </button>

                <button
                  onClick={() => dataFlow.setIsManualEntry(true)}
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
              initialTab={viewState?.activeTab}
              onTabChange={tab => handleViewStateChange({ activeTab: tab })}
              initialFocusedChart={viewState?.focusedChart}
              onFocusedChartChange={chart =>
                handleViewStateChange({
                  focusedChart: chart as 'ichart' | 'boxplot' | 'pareto' | null,
                })
              }
              initialBoxplotFactor={viewState?.boxplotFactor}
              initialParetoFactor={viewState?.paretoFactor}
              onBoxplotFactorChange={factor => handleViewStateChange({ boxplotFactor: factor })}
              onParetoFactorChange={factor => handleViewStateChange({ paretoFactor: factor })}
              isPresentationMode={panels.isPresentationMode}
              onExitPresentation={() => panels.setIsPresentationMode(false)}
              onManageFactors={dataFlow.openFactorManager}
              onPinFinding={handlePinFinding}
              onShareChart={handleShareChart}
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
