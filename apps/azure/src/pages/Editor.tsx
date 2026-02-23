import React, { useMemo, useEffect } from 'react';
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
import { ColumnMapping } from '@variscout/ui';
import { useControlViolations } from '../hooks/useControlViolations';
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
  Network,
  Beaker,
  Download,
  Database,
  RefreshCw,
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
    saveProject,
    loadProject,
  } = useData();

  const { handleFileUpload, loadSample } = useDataIngestion();

  // Panel visibility and chart/table sync
  const panels = useEditorPanels({
    displayOptions,
    setDisplayOptions,
  });

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
  useEffect(() => {
    if (projectId && rawData.length === 0 && !dataFlow.isLoadingProject) {
      dataFlow.setIsLoadingProject(true);
      loadProject(projectId).finally(() => dataFlow.setIsLoadingProject(false));
    }
  }, [projectId]); // intentionally exclude rawData to avoid re-triggering

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

  const handleSave = async () => {
    const name = currentProjectName || 'New Analysis';
    await saveProject(name);
  };

  // Sync status icon
  const SyncIcon =
    syncStatus.status === 'synced' || syncStatus.status === 'syncing' ? Cloud : CloudOff;
  const syncColor =
    syncStatus.status === 'synced'
      ? 'text-green-400'
      : syncStatus.status === 'syncing'
        ? 'text-blue-400'
        : 'text-slate-500';

  // If in paste mode, show PasteScreen full screen
  if (dataFlow.isPasteMode) {
    return (
      <PasteScreen
        onAnalyze={dataFlow.handlePasteAnalyze}
        onCancel={dataFlow.handlePasteCancel}
        error={dataFlow.pasteError}
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
        onBack={() => panels.setIsWhatIfOpen(false)}
        filterCount={filterNav.filterStack.length}
        filterStack={filterNav.filterStack}
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
          <div className={`flex items-center gap-1.5 text-sm ${syncColor}`}>
            <SyncIcon
              size={16}
              className={syncStatus.status === 'syncing' ? 'animate-pulse' : ''}
            />
            <span className="text-slate-400">{syncStatus.message || syncStatus.status}</span>
          </div>

          {/* Add More Data Button */}
          {rawData.length > 0 && outcome && (
            <button
              onClick={dataFlow.handleAddMoreData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Add more rows to existing data"
            >
              <Plus size={16} />
              <span className="text-sm">Add Data</span>
            </button>
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

          {/* Investigation Toggle */}
          {rawData.length > 0 && outcome && factors.length > 0 && (
            <button
              onClick={() => panels.setIsMindmapOpen(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                panels.isMindmapOpen
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={panels.isMindmapOpen ? 'Hide Investigation' : 'Show Investigation'}
              data-testid="btn-investigation"
            >
              <Network size={18} />
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
            disabled={rawData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="btn-save"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

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
