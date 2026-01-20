import React, { useRef, useState, useCallback } from 'react';
import { useStorage } from '../services/storage';
import { useData } from '../context/DataContext';
import { useDataIngestion } from '../hooks/useDataIngestion';
import Dashboard from '../components/Dashboard';
import ManualEntry from '../components/ManualEntry';
import { validateData } from '../logic/parser';
import { Upload, ArrowLeft, Save, FileText, Cloud, CloudOff, PenLine } from 'lucide-react';

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

  // State for drill navigation from Performance Mode to standard I-Chart
  const [drillFromPerformance, setDrillFromPerformance] = useState<string | null>(null);

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

  // Handle manual data entry analyze
  const handleManualDataAnalyze = useCallback(
    (data: any[], config: ManualEntryConfig) => {
      setRawData(data);
      setDataFilename('Manual Entry');
      setOutcome(config.outcome);
      setFactors(config.factors);
      if (config.specs) {
        setSpecs(config.specs);
      }

      // Run validation
      const report = validateData(data, config.outcome);
      setDataQualityReport(report);

      // Handle performance mode
      if (config.isPerformanceMode && config.measureColumns && config.measureColumns.length >= 3) {
        setMeasureColumns(config.measureColumns);
        setMeasureLabel(config.measureLabel || 'Channel');
        setPerformanceMode(true);
      }

      setIsManualEntry(false);
    },
    [
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

  // If in manual entry mode, show ManualEntry full screen
  if (isManualEntry) {
    return (
      <ManualEntry onAnalyze={handleManualDataAnalyze} onCancel={() => setIsManualEntry(false)} />
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
          // Dashboard with charts
          <Dashboard
            drillFromPerformance={drillFromPerformance}
            onBackToPerformance={handleBackToPerformance}
            onDrillToMeasure={handleDrillToMeasure}
          />
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
