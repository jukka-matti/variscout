import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useStorage } from '../services/storage';
import { useData } from '../context/DataContext';
import { useDataIngestion } from '../hooks/useDataIngestion';
import { useFilterNavigation } from '../hooks';
import Dashboard from '../components/Dashboard';
import DataPanel from '../components/data/DataPanel';
import MindmapPanel from '../components/MindmapPanel';
import { openMindmapPopout } from '../components/MindmapWindow';
import ManualEntry, { type ManualEntryConfig } from '../components/data/ManualEntry';
import PasteScreen from '../components/data/PasteScreen';
import WhatIfPage from '../components/WhatIfPage';
import { ColumnMapping } from '@variscout/ui';
import { useControlViolations } from '../hooks/useControlViolations';
import { useDataMerge } from '../hooks/useDataMerge';
import { parseText, detectColumns, validateData, detectWideFormat } from '@variscout/core';
import { downloadCSV } from '@variscout/core';
import { SAMPLES } from '@variscout/data';
import type { SampleDataset } from '@variscout/data';
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
  Plus,
  Network,
  Beaker,
  Download,
  Database,
  RefreshCw,
} from 'lucide-react';

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
    displayOptions,
    setDisplayOptions,
    saveProject,
    loadProject,
  } = useData();

  // State for loading a saved project
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  // Load project data when opening an existing project
  useEffect(() => {
    if (projectId && rawData.length === 0 && !isLoadingProject) {
      setIsLoadingProject(true);
      loadProject(projectId).finally(() => setIsLoadingProject(false));
    }
  }, [projectId]); // intentionally exclude rawData to avoid re-triggering

  // State for manual entry view
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [appendMode, setAppendMode] = useState(false);

  // State for paste data view
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  // State for column mapping review (after paste)
  const [isMapping, setIsMapping] = useState(false);

  // State for drill navigation from Performance Mode to standard I-Chart
  const [drillFromPerformance, setDrillFromPerformance] = useState<string | null>(null);

  // State for data panel
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [highlightRowIndex, setHighlightRowIndex] = useState<number | null>(null);
  const [highlightedChartPoint, setHighlightedChartPoint] = useState<number | null>(null);

  // State for investigation mindmap
  const [isMindmapOpen, setIsMindmapOpen] = useState(false);

  // Mindmap annotations persisted in displayOptions (Record<string, string> ↔ Map<number, string>)
  const mindmapAnnotations = useMemo(() => {
    const map = new Map<number, string>();
    const stored = displayOptions.mindmapAnnotations;
    if (stored) {
      for (const [key, value] of Object.entries(stored)) {
        map.set(Number(key), value);
      }
    }
    return map;
  }, [displayOptions]);

  const setMindmapAnnotations = useCallback(
    (annotations: Map<number, string>) => {
      const record: Record<string, string> = {};
      annotations.forEach((value, key) => {
        record[String(key)] = value;
      });
      setDisplayOptions({ ...displayOptions, mindmapAnnotations: record });
    },
    [displayOptions, setDisplayOptions]
  );

  // State for What-If Simulator full page
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);

  // Filter navigation (lifted to Editor so mindmap and dashboard share filter state)
  const filterNav = useFilterNavigation({
    enableHistory: false,
    enableUrlSync: false,
  });

  // Handle opening mindmap in a popout window
  const handleOpenMindmapPopout = useCallback(() => {
    if (outcome) {
      openMindmapPopout(rawData, factors, outcome, columnAliases, specs, filterNav.filterStack);
      setIsMindmapOpen(false);
    }
  }, [rawData, factors, outcome, columnAliases, specs, filterNav.filterStack]);

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

  // Handle drilling from Performance Mode to standard I-Chart for a specific measure
  const handleDrillToMeasure = useCallback(
    (measureId: string) => {
      setDrillFromPerformance(measureId);
      setOutcome(measureId);
    },
    [setOutcome]
  );

  // Handle returning to Performance Mode from drilled I-Chart
  const handleBackToPerformance = useCallback(() => {
    setDrillFromPerformance(null);
  }, []);

  // Handle chart point click → highlight row in data panel
  const handlePointClick = useCallback(
    (index: number) => {
      setHighlightRowIndex(index);
      if (!isDataPanelOpen) {
        setIsDataPanelOpen(true);
      }
    },
    [isDataPanelOpen]
  );

  // Handle data panel row click → highlight point in chart
  const handleRowClick = useCallback((index: number) => {
    setHighlightedChartPoint(index);
    setTimeout(() => setHighlightedChartPoint(null), 2000);
  }, []);

  // Compute existing config for append mode
  const existingConfig = useMemo<ManualEntryConfig | undefined>(() => {
    if (!outcome) return undefined;
    return {
      outcome,
      factors: factors || [],
      specs:
        specs?.usl !== undefined || specs?.lsl !== undefined
          ? { usl: specs.usl, lsl: specs.lsl }
          : undefined,
      isPerformanceMode,
      measureColumns: measureColumns || [],
      measureLabel: measureLabel || 'Channel',
    };
  }, [outcome, factors, specs, isPerformanceMode, measureColumns, measureLabel]);

  // Control violations for DataPanel annotations
  const controlViolations = useControlViolations(filteredData, outcome, specs);

  // Manual data analyze with append-mode merge
  const { handleManualDataAnalyze } = useDataMerge({
    appendMode,
    existingConfig,
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
      setIsManualEntry(false);
      setAppendMode(false);
    },
  });

  const { handleFileUpload, loadSample } = useDataIngestion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const name = currentProjectName || 'New Analysis';
    await saveProject(name);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsParsingFile(true);
    try {
      await handleFileUpload(e);
      setIsMapping(true);
    } finally {
      setIsParsingFile(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // State for file parsing spinner
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Get sync status icon
  const SyncIcon =
    syncStatus.status === 'synced' || syncStatus.status === 'syncing' ? Cloud : CloudOff;
  const syncColor =
    syncStatus.status === 'synced'
      ? 'text-green-400'
      : syncStatus.status === 'syncing'
        ? 'text-blue-400'
        : 'text-slate-500';

  // Handle cancel from manual entry - reset append mode
  const handleManualEntryCancel = useCallback(() => {
    setIsManualEntry(false);
    setAppendMode(false);
  }, []);

  // Handle "Add More Data" button click
  const handleAddMoreData = useCallback(() => {
    setAppendMode(true);
    setIsManualEntry(true);
  }, []);

  // Handle paste → parse → auto-detect → show ColumnMapping for review
  const handlePasteAnalyze = useCallback(
    async (text: string) => {
      setPasteError(null);
      try {
        const data = await parseText(text);
        setRawData(data);
        setDataFilename('Pasted Data');

        // Auto-detect columns (same as PWA)
        const detected = detectColumns(data);
        if (detected.outcome) setOutcome(detected.outcome);
        if (detected.factors.length > 0) setFactors(detected.factors);

        // Validate data quality
        const report = validateData(data, detected.outcome);
        setDataQualityReport(report);

        // Wide-format detection
        const wideFormat = detectWideFormat(data);
        if (wideFormat.isWideFormat && wideFormat.channels.length >= 3) {
          setMeasureColumns(wideFormat.channels.map(c => c.id));
          setMeasureLabel('Channel');
          setPerformanceMode(true);
        }

        // Transition: close paste → open column mapping
        setIsPasteMode(false);
        setIsMapping(true);
      } catch (err) {
        setPasteError(err instanceof Error ? err.message : 'Failed to parse data');
      }
    },
    [
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setDataQualityReport,
      setMeasureColumns,
      setMeasureLabel,
      setPerformanceMode,
    ]
  );

  const handlePasteCancel = useCallback(() => {
    setIsPasteMode(false);
    setPasteError(null);
  }, []);

  // Handle sample load → show ColumnMapping for review
  const handleLoadSample = useCallback(
    (sample: SampleDataset) => {
      loadSample(sample);
      setIsMapping(true);
    },
    [loadSample]
  );

  // Handle column mapping confirm — apply user's selections and start analysis
  const handleMappingConfirm = useCallback(
    (
      newOutcome: string,
      newFactors: string[],
      newSpecs?: { target?: number; lsl?: number; usl?: number }
    ) => {
      setOutcome(newOutcome);
      setFactors(newFactors);
      if (newSpecs) setSpecs(newSpecs);
      setIsMapping(false);
    },
    [setOutcome, setFactors, setSpecs]
  );

  // Handle column mapping cancel — clear data and return to empty state
  const handleMappingCancel = useCallback(() => {
    setRawData([]);
    setOutcome(null);
    setFactors([]);
    setDataFilename(null);
    setDataQualityReport(null);
    setIsMapping(false);
  }, [setRawData, setOutcome, setFactors, setDataFilename, setDataQualityReport]);

  // If in paste mode, show PasteScreen full screen
  if (isPasteMode) {
    return (
      <PasteScreen onAnalyze={handlePasteAnalyze} onCancel={handlePasteCancel} error={pasteError} />
    );
  }

  // If in manual entry mode, show ManualEntry full screen
  if (isManualEntry) {
    return (
      <ManualEntry
        onAnalyze={handleManualDataAnalyze}
        onCancel={handleManualEntryCancel}
        appendMode={appendMode}
        existingConfig={appendMode ? existingConfig : undefined}
        existingRowCount={appendMode ? rawData.length : undefined}
      />
    );
  }

  // If in column mapping mode, show ColumnMapping full screen
  if (isMapping) {
    return (
      <ColumnMapping
        availableColumns={Object.keys(rawData[0] || {})}
        initialOutcome={outcome}
        initialFactors={factors}
        datasetName={dataFilename || 'Pasted Data'}
        onConfirm={handleMappingConfirm}
        onCancel={handleMappingCancel}
        dataQualityReport={dataQualityReport}
        maxFactors={6}
      />
    );
  }

  // If What-If Simulator is open, show full-page view
  if (isWhatIfOpen) {
    return (
      <WhatIfPage
        onBack={() => setIsWhatIfOpen(false)}
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
              onClick={handleAddMoreData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Add more rows to existing data"
            >
              <Plus size={16} />
              <span className="text-sm">Add Data</span>
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
              onClick={() => setIsWhatIfOpen(true)}
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
              onClick={() => setIsMindmapOpen(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                isMindmapOpen
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={isMindmapOpen ? 'Hide Investigation' : 'Show Investigation'}
              data-testid="btn-investigation"
            >
              <Network size={18} />
            </button>
          )}

          {/* Data Panel Toggle */}
          {rawData.length > 0 && outcome && (
            <button
              onClick={() => setIsDataPanelOpen(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                isDataPanelOpen
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={isDataPanelOpen ? 'Hide Data Panel' : 'Show Data Panel'}
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
            {(isLoadingProject || isParsingFile) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={32} className="text-blue-400 animate-spin" />
                  <span className="text-sm text-slate-300">
                    {isLoadingProject ? 'Loading project...' : 'Parsing file...'}
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
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex gap-3 mb-8">
                <button
                  onClick={triggerFileUpload}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Upload size={20} />
                  Upload File
                </button>

                <button
                  onClick={() => setIsPasteMode(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                >
                  <ClipboardPaste size={20} />
                  Paste Data
                </button>

                <button
                  onClick={() => setIsManualEntry(true)}
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
                        onClick={() => handleLoadSample(sample)}
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
              drillFromPerformance={drillFromPerformance}
              onBackToPerformance={handleBackToPerformance}
              onDrillToMeasure={handleDrillToMeasure}
              onPointClick={handlePointClick}
              highlightedPointIndex={highlightedChartPoint}
              filterNav={filterNav}
            />
            <MindmapPanel
              isOpen={isMindmapOpen}
              onClose={() => setIsMindmapOpen(false)}
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
                setIsMindmapOpen(false);
                setIsWhatIfOpen(true);
              }}
              annotations={mindmapAnnotations}
              onAnnotationsChange={setMindmapAnnotations}
            />
            <DataPanel
              isOpen={isDataPanelOpen}
              onClose={() => setIsDataPanelOpen(false)}
              highlightRowIndex={highlightRowIndex}
              onRowClick={handleRowClick}
              controlViolations={controlViolations}
            />
          </div>
        ) : (
          // Data loaded but no outcome selected — column mapping fallback
          <ColumnMapping
            availableColumns={Object.keys(rawData[0] || {})}
            initialOutcome={outcome}
            initialFactors={factors}
            datasetName={dataFilename || 'Data'}
            onConfirm={handleMappingConfirm}
            onCancel={handleMappingCancel}
            dataQualityReport={dataQualityReport}
            maxFactors={6}
          />
        )}
      </div>
    </div>
  );
};
