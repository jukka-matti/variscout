import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useStorage } from '../services/storage';
import { useData } from '../context/DataContext';
import { useDataIngestion } from '../hooks/useDataIngestion';
import Dashboard from '../components/Dashboard';
import DataPanel from '../components/DataPanel';
import ManualEntry from '../components/ManualEntry';
import { validateData } from '@variscout/core';
import {
  Upload,
  ArrowLeft,
  Save,
  FileText,
  Cloud,
  CloudOff,
  PenLine,
  Table2,
  Plus,
} from 'lucide-react';

interface ManualEntryConfig {
  outcome: string;
  factors: string[];
  specs?: { usl?: number; lsl?: number };
  isPerformanceMode?: boolean;
  measureColumns?: string[];
  measureLabel?: string;
}

interface EditorProps {
  projectId: string | null;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ projectId, onBack }) => {
  const { syncStatus } = useStorage();
  const {
    rawData,
    currentProjectName,
    currentProjectLocation,
    hasUnsavedChanges,
    outcome,
    factors,
    specs,
    isPerformanceMode,
    measureColumns,
    measureLabel,
    setOutcome,
    setRawData,
    setFactors,
    setSpecs,
    setDataFilename,
    setDataQualityReport,
    setPerformanceMode,
    setMeasureColumns,
    setMeasureLabel,
    saveProject,
  } = useData();

  // State for manual entry view
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [appendMode, setAppendMode] = useState(false);

  // State for drill navigation from Performance Mode to standard I-Chart
  const [drillFromPerformance, setDrillFromPerformance] = useState<string | null>(null);

  // State for data panel
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [highlightRowIndex, setHighlightRowIndex] = useState<number | null>(null);
  const [highlightedChartPoint, setHighlightedChartPoint] = useState<number | null>(null);

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
      // Auto-open data panel if not already open
      if (!isDataPanelOpen) {
        setIsDataPanelOpen(true);
      }
    },
    [isDataPanelOpen]
  );

  // Handle data panel row click → highlight point in chart
  const handleRowClick = useCallback((index: number) => {
    setHighlightedChartPoint(index);
    // Clear after brief highlight
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

  // Merge data utility - combines existing rows with new rows, handling column expansion
  const mergeData = useCallback((existing: any[], incoming: any[]): any[] => {
    const allColumns = new Set<string>();
    [...existing, ...incoming].forEach(row => Object.keys(row).forEach(k => allColumns.add(k)));

    return [...existing, ...incoming].map(row =>
      Object.fromEntries([...allColumns].map(col => [col, row[col] ?? null]))
    );
  }, []);

  // Merge configs - union of columns/factors
  const mergeConfig = useCallback(
    (existing: ManualEntryConfig, incoming: ManualEntryConfig): ManualEntryConfig => {
      // For performance mode, union measure columns
      if (existing.isPerformanceMode && incoming.isPerformanceMode) {
        const allMeasureColumns = Array.from(
          new Set([...(existing.measureColumns || []), ...(incoming.measureColumns || [])])
        );
        return {
          ...incoming,
          measureColumns: allMeasureColumns,
          outcome: allMeasureColumns[0], // First channel as default
        };
      }

      // For standard mode, union factors
      const allFactors = Array.from(new Set([...existing.factors, ...incoming.factors]));

      return {
        ...incoming,
        factors: allFactors,
      };
    },
    []
  );

  // Handle manual data entry analyze
  const handleManualDataAnalyze = useCallback(
    (data: any[], config: ManualEntryConfig) => {
      let finalData = data;
      let finalConfig = config;

      // If in append mode, merge with existing data
      if (appendMode && existingConfig && rawData.length > 0) {
        finalData = mergeData(rawData, data);
        finalConfig = mergeConfig(existingConfig, config);
        setDataFilename('Manual Entry (combined)');
      } else {
        setDataFilename('Manual Entry');
      }

      setRawData(finalData);
      setOutcome(finalConfig.outcome);
      setFactors(finalConfig.factors);
      if (finalConfig.specs) {
        setSpecs(finalConfig.specs);
      }

      // Run validation
      const report = validateData(finalData, finalConfig.outcome);
      setDataQualityReport(report);

      // Handle performance mode
      if (
        finalConfig.isPerformanceMode &&
        finalConfig.measureColumns &&
        finalConfig.measureColumns.length >= 3
      ) {
        setMeasureColumns(finalConfig.measureColumns);
        setMeasureLabel(finalConfig.measureLabel || 'Channel');
        setPerformanceMode(true);
      }

      setIsManualEntry(false);
      setAppendMode(false);
    },
    [
      appendMode,
      existingConfig,
      rawData,
      mergeData,
      mergeConfig,
      setRawData,
      setDataFilename,
      setOutcome,
      setFactors,
      setSpecs,
      setDataQualityReport,
      setMeasureColumns,
      setMeasureLabel,
      setPerformanceMode,
    ]
  );

  const { handleFileUpload } = useDataIngestion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const name = currentProjectName || 'New Analysis';
    await saveProject(name, currentProjectLocation);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileUpload(e);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

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

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header with back navigation */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h2 className="text-xl font-semibold text-white">
            {currentProjectName || (projectId ? `Project ${projectId}` : 'New Analysis')}
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
            >
              <Table2 size={18} />
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={rawData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        {rawData.length === 0 ? (
          // Empty State - Upload Data
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
                <FileText size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Data Loaded</h3>
              <p className="text-slate-400 mb-6">
                Upload a CSV or Excel file to start your analysis. Your data stays local and secure.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col gap-3">
                <button
                  onClick={triggerFileUpload}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Upload size={20} />
                  Upload Data File
                </button>

                <button
                  onClick={() => setIsManualEntry(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                >
                  <PenLine size={20} />
                  Enter Data Manually
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-4">Supports CSV, XLSX, and XLS files</p>
            </div>
          </div>
        ) : outcome ? (
          // Dashboard with charts and optional data panel
          <div className="flex-1 flex overflow-hidden">
            <Dashboard
              drillFromPerformance={drillFromPerformance}
              onBackToPerformance={handleBackToPerformance}
              onDrillToMeasure={handleDrillToMeasure}
              onPointClick={handlePointClick}
              highlightedPointIndex={highlightedChartPoint}
            />
            <DataPanel
              isOpen={isDataPanelOpen}
              onClose={() => setIsDataPanelOpen(false)}
              highlightRowIndex={highlightRowIndex}
              onRowClick={handleRowClick}
            />
          </div>
        ) : (
          // Data loaded but no outcome selected
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Configure Your Analysis</h3>
              <p className="text-slate-400 mb-6">
                Data loaded with {rawData.length} rows. Select an outcome variable to begin
                analysis.
              </p>
              {/* Could add column selector here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
