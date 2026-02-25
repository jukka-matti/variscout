import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useStorage } from '../services/storage';
import { useData } from '../context/DataContext';
import { useDataIngestion } from '../hooks/useDataIngestion';
import { useFilterNavigation } from '../hooks';
import Dashboard from '../components/Dashboard';
import DataPanel from '../components/data/DataPanel';
import DataTableModal from '../components/data/DataTableModal';
import MindmapPanel from '../components/MindmapPanel';
import { openMindmapPopout } from '../components/MindmapWindow';
import ManualEntry from '../components/data/ManualEntry';
import PasteScreen from '../components/data/PasteScreen';
import WhatIfPage from '../components/WhatIfPage';
import {
  ColumnMapping,
  InvestigationPrompt,
  investigationPromptAzureColorScheme,
} from '@variscout/ui';
import { useControlViolations } from '@variscout/hooks';
import { useDataMerge } from '../hooks/useDataMerge';
import { downloadCSV } from '@variscout/core';
import type { ExclusionReason, MultiRegressionResult } from '@variscout/core';
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
  Network,
  Beaker,
  Download,
  Database,
  RefreshCw,
  ChevronDown,
  Check,
  Maximize2,
} from 'lucide-react';
import { useEditorPanels } from '../hooks/useEditorPanels';
import { useEditorDataFlow } from '../hooks/useEditorDataFlow';

interface EditorProps {
  projectId: string | null;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ projectId, onBack }) => {
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
    displayOptions,
    setDisplayOptions,
    viewState,
    setViewState,
    saveProject,
    loadProject,
  } = useData();

  const { handleFileUpload, loadSample } = useDataIngestion();

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

  // Investigation → Regression bridge state
  const [regressionInitialFactors, setRegressionInitialFactors] = useState<string[] | undefined>();
  // Regression → What-If bridge state
  const [whatIfRegressionModel, setWhatIfRegressionModel] = useState<
    MultiRegressionResult | undefined
  >();

  const handleNavigateToRegression = useCallback(
    (factorsList: string[]) => {
      setRegressionInitialFactors(factorsList);
      panels.setIsMindmapOpen(false);
    },
    [panels]
  );

  // Add Data dropdown state
  const [addDataOpen, setAddDataOpen] = useState(false);
  const addDataRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!addDataOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addDataRef.current && !addDataRef.current.contains(e.target as Node)) {
        setAddDataOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addDataOpen]);

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
    handleFileUpload,
    loadSample,
  });

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

  // Handle opening mindmap in a popout window
  const handleOpenMindmapPopout = React.useCallback(() => {
    if (outcome) {
      openMindmapPopout(rawData, factors, outcome, columnAliases, specs, filterNav.filterStack);
      panels.setIsMindmapOpen(false);
    }
  }, [rawData, factors, outcome, columnAliases, specs, filterNav.filterStack, panels]);

  // Listen for drill commands from popout mindmap window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'MINDMAP_DRILL_CATEGORY') {
        const { factor, value } = event.data;
        filterNav.applyFilter({
          type: 'filter',
          source: 'mindmap',
          factor,
          values: [value],
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [filterNav]);

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
            : 'text-slate-500';

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
      />
    );
  }

  // If What-If Simulator is open, show full-page view
  if (panels.isWhatIfOpen) {
    return (
      <WhatIfPage
        onBack={() => {
          panels.setIsWhatIfOpen(false);
          setWhatIfRegressionModel(undefined);
        }}
        filterCount={filterNav.filterStack.length}
        filterStack={filterNav.filterStack}
        regressionModel={whatIfRegressionModel}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header with back navigation */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            aria-label="Back to dashboard"
            className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h2 className="text-xl font-semibold text-white">
            {currentProjectName || (projectId ? `Analysis ${projectId}` : 'New Analysis')}
            {hasUnsavedChanges && <span className="text-amber-400 ml-2">•</span>}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Sync Status */}
          {syncStatus.status === 'error' ? (
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
              <span className="text-slate-400">{syncStatus.message || syncStatus.status}</span>
            </div>
          )}

          {/* Add Data Dropdown */}
          {rawData.length > 0 && outcome && (
            <div ref={addDataRef} className="relative">
              <button
                onClick={() => setAddDataOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
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
                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1">
                  <button
                    onClick={() => {
                      setAddDataOpen(false);
                      dataFlow.setAppendMode(true);
                      dataFlow.setIsPasteMode(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
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
              className="p-2 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-700"
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
              className="p-2 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-700"
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
              className="p-2 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-700"
              title="What-If Simulator"
              data-testid="btn-what-if"
            >
              <Beaker size={18} />
            </button>
          )}

          {/* Presentation Mode */}
          {rawData.length > 0 && outcome && (
            <button
              onClick={() => panels.setIsPresentationMode(true)}
              className="p-2 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-700"
              title="Presentation Mode"
              data-testid="btn-presentation"
            >
              <Maximize2 size={18} />
            </button>
          )}

          {/* Investigation Toggle */}
          {rawData.length > 0 && outcome && factors.length > 0 && (
            <button
              onClick={() => panels.setIsMindmapOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                panels.isMindmapOpen
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={panels.isMindmapOpen ? 'Hide Investigation' : 'Show Investigation'}
              data-testid="btn-investigation"
            >
              <Network size={16} />
              <span className="hidden lg:inline">Investigation</span>
            </button>
          )}

          {/* Data Panel Toggle */}
          {rawData.length > 0 && outcome && (
            <button
              onClick={() => panels.setIsDataPanelOpen(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                panels.isDataPanelOpen
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={panels.isDataPanelOpen ? 'Hide Data Panel' : 'Show Data Panel'}
              data-testid="btn-data-panel"
            >
              <Table2 size={18} />
            </button>
          )}

          {/* Save Button */}
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
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
                ? 'Saved'
                : saveStatus === 'error'
                  ? 'Save Failed'
                  : 'Save'}
          </button>
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
          isMindmapOpen={panels.isMindmapOpen}
          onOpenMindmap={() => panels.setIsMindmapOpen(true)}
          colorScheme={investigationPromptAzureColorScheme}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        {rawData.length === 0 ? (
          // Empty State - Upload Data + Sample Datasets
          <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto relative">
            {/* Loading overlay for project load or file parse */}
            {(dataFlow.isLoadingProject || dataFlow.isParsingFile) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={32} className="text-blue-400 animate-spin" />
                  <span className="text-sm text-slate-300">
                    {dataFlow.isLoadingProject ? 'Loading project...' : 'Parsing file...'}
                  </span>
                </div>
              </div>
            )}
            <div className="max-w-lg w-full text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
                <FileText size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start Your Analysis</h3>
              <p className="text-slate-400 mb-6">
                Upload your data, paste from Excel, enter manually, or try a sample dataset.
              </p>

              <input
                ref={dataFlow.fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={dataFlow.handleFileChange}
                className="hidden"
              />

              <div className="flex gap-3 mb-8">
                <button
                  onClick={dataFlow.triggerFileUpload}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Upload size={20} />
                  Upload File
                </button>

                <button
                  onClick={() => dataFlow.setIsPasteMode(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                >
                  <ClipboardPaste size={20} />
                  Paste Data
                </button>

                <button
                  onClick={() => dataFlow.setIsManualEntry(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
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
              <p className="text-xs text-slate-500 mb-6">Supports CSV, XLSX, and XLS files</p>

              {/* Sample Datasets */}
              <div className="text-left">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Database size={14} />
                  Sample Datasets
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLES.filter(s => s.featured || s.category === 'cases')
                    .slice(0, 8)
                    .map(sample => (
                      <button
                        key={sample.urlKey}
                        data-testid={`sample-${sample.urlKey}`}
                        onClick={() => dataFlow.handleLoadSample(sample)}
                        className="text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-lg transition-all group"
                      >
                        <span className="text-sm font-medium text-white group-hover:text-blue-300 block truncate">
                          {sample.name}
                        </span>
                        <span className="text-xs text-slate-500 line-clamp-1">
                          {sample.description}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : outcome ? (
          // Dashboard with charts, optional data panel, and optional mindmap
          <div className="flex-1 flex overflow-hidden">
            <Dashboard
              drillFromPerformance={dataFlow.drillFromPerformance}
              onBackToPerformance={dataFlow.handleBackToPerformance}
              onDrillToMeasure={dataFlow.handleDrillToMeasure}
              onPointClick={panels.handlePointClick}
              highlightedPointIndex={panels.highlightedChartPoint}
              filterNav={filterNav}
              regressionInitialFactors={regressionInitialFactors}
              onClearRegressionFactors={() => setRegressionInitialFactors(undefined)}
              onNavigateToWhatIfWithModel={model => {
                setWhatIfRegressionModel(model);
                panels.setIsWhatIfOpen(true);
              }}
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
            />
            <MindmapPanel
              isOpen={panels.isMindmapOpen}
              onClose={() => panels.setIsMindmapOpen(false)}
              onOpenPopout={handleOpenMindmapPopout}
              data={rawData}
              factors={factors}
              outcome={outcome}
              filterStack={filterNav.filterStack}
              specs={specs}
              columnAliases={columnAliases}
              onDrillCategory={(factor, value) => {
                filterNav.applyFilter({
                  type: 'filter',
                  source: 'mindmap',
                  factor,
                  values: [value],
                });
              }}
              onNavigateToWhatIf={() => {
                panels.setIsMindmapOpen(false);
                panels.setIsWhatIfOpen(true);
              }}
              onNavigateToRegression={handleNavigateToRegression}
              onModelInteraction={handleNavigateToRegression}
              annotations={panels.mindmapAnnotations}
              onAnnotationsChange={panels.setMindmapAnnotations}
            />
            <DataPanel
              isOpen={panels.isDataPanelOpen}
              onClose={() => panels.setIsDataPanelOpen(false)}
              highlightRowIndex={panels.highlightRowIndex}
              onRowClick={panels.handleRowClick}
              controlViolations={controlViolations}
              onOpenEditor={() => panels.setIsDataTableOpen(true)}
            />
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
