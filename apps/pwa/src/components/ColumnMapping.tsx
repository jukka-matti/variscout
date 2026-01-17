import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, CheckSquare, Settings2, Upload, X, BarChart3 } from 'lucide-react';
import DataQualityBanner from './DataQualityBanner';
import type { DataQualityReport, ParetoRow } from '../logic/parser';

interface ColumnMappingProps {
  availableColumns: string[];
  initialOutcome: string | null;
  initialFactors: string[];
  datasetName?: string;
  onConfirm: (outcome: string, factors: string[]) => void;
  onCancel: () => void;
  onBack?: () => void;
  // Validation integration
  dataQualityReport?: DataQualityReport | null;
  onViewExcludedRows?: () => void;
  onViewAllData?: () => void;
  // Pareto integration
  paretoMode?: 'derived' | 'separate';
  separateParetoFilename?: string | null;
  onParetoFileUpload?: (file: File) => Promise<boolean>;
  onClearParetoFile?: () => void;
}

const ColumnMapping: React.FC<ColumnMappingProps> = ({
  availableColumns,
  initialOutcome,
  initialFactors,
  datasetName = 'Uploaded Dataset',
  onConfirm,
  onCancel,
  onBack,
  dataQualityReport,
  onViewExcludedRows,
  onViewAllData,
  paretoMode = 'derived',
  separateParetoFilename,
  onParetoFileUpload,
  onClearParetoFile,
}) => {
  const [outcome, setOutcome] = useState<string>(initialOutcome || '');
  const [factors, setFactors] = useState<string[]>(initialFactors || []);
  const [isDraggingPareto, setIsDraggingPareto] = useState(false);
  const paretoFileInputRef = useRef<HTMLInputElement>(null);

  // Set defaults if not provided (though parent usually provides heuristics)
  useEffect(() => {
    if (!outcome && availableColumns.length > 0) {
      // Default first column if nothing selected
      // But prefer numeric for outcome? The parent passes heuristics, so trust props.
    }
  }, [availableColumns, outcome]);

  const toggleFactor = (col: string) => {
    if (col === outcome) return; // Cannot be both outcome and factor

    if (factors.includes(col)) {
      setFactors(factors.filter(f => f !== col));
    } else {
      if (factors.length < 3) {
        setFactors([...factors, col]);
      }
    }
  };

  const handleOutcomeChange = (col: string) => {
    setOutcome(col);
    // If this column was a factor, remove it from factors
    if (factors.includes(col)) {
      setFactors(factors.filter(f => f !== col));
    }
  };

  const isValid = !!outcome;

  // Handle Pareto file drop
  const handleParetoDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPareto(false);
    const file = e.dataTransfer.files[0];
    if (file && onParetoFileUpload) {
      await onParetoFileUpload(file);
    }
  };

  // Handle Pareto file input change
  const handleParetoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onParetoFileUpload) {
      await onParetoFileUpload(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] bg-surface-secondary border border-edge rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-edge bg-surface-secondary/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Settings2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Map Your Data</h2>
          </div>
          <p className="text-content-secondary text-sm">
            Confirm which columns to analyze from <strong>{datasetName}</strong>. You can adjust
            this later in Settings.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface/30">
          {/* Data Quality Banner */}
          {dataQualityReport && (
            <DataQualityBanner
              report={dataQualityReport}
              filename={datasetName}
              onViewExcludedRows={onViewExcludedRows}
              onViewAllData={onViewAllData}
              showActions={
                !!(onViewExcludedRows || onViewAllData) && dataQualityReport.excludedRows.length > 0
              }
            />
          )}

          {/* Outcome Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                Y
              </div>
              <h3 className="text-sm font-semibold text-content uppercase tracking-wide">
                Select Outcome (Measure)
              </h3>
            </div>
            <p className="text-xs text-content-muted mb-3">
              Choose the numeric variable you want to improve (e.g., Weight, Diameter, Defect
              Count).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
              {availableColumns.map(col => (
                <label
                  key={`outcome-${col}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    outcome === col
                      ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                      : 'bg-surface-secondary border-edge hover:border-edge-secondary hover:bg-surface-tertiary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    className="hidden" // Custom styling
                    checked={outcome === col}
                    onChange={() => handleOutcomeChange(col)}
                  />
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      outcome === col ? 'border-blue-500 bg-blue-500' : 'border-edge'
                    }`}
                  >
                    {outcome === col && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${outcome === col ? 'text-white' : 'text-content-secondary'}`}
                  >
                    {col}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Factors Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold">
                X
              </div>
              <h3 className="text-sm font-semibold text-content uppercase tracking-wide">
                Select Factors (Categories)
              </h3>
              <span className="text-xs text-content-muted ml-auto">
                {factors.length}/3 selected
              </span>
            </div>
            <p className="text-xs text-content-muted mb-3">
              Choose up to 3 categorical variables to group by (e.g., Machine, Shift, Operator).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
              {availableColumns.map(col => {
                const isOutcome = outcome === col;
                return (
                  <button
                    key={`factor-${col}`}
                    onClick={() => toggleFactor(col)}
                    disabled={isOutcome}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      factors.includes(col)
                        ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : isOutcome
                          ? 'bg-surface/50 border-edge opacity-50 cursor-not-allowed'
                          : 'bg-surface-secondary border-edge hover:border-edge-secondary hover:bg-surface-tertiary/50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        factors.includes(col) ? 'border-emerald-500 bg-emerald-500' : 'border-edge'
                      }`}
                    >
                      {factors.includes(col) && <CheckSquare size={12} className="text-white" />}
                    </div>
                    <span
                      className={`text-sm font-medium ${factors.includes(col) ? 'text-white' : 'text-content-secondary'}`}
                    >
                      {col}{' '}
                      {isOutcome && <span className="text-xs text-blue-400 ml-1">(Outcome)</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pareto Source (Optional) */}
          {onParetoFileUpload && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white">
                  <BarChart3 size={14} />
                </div>
                <h3 className="text-sm font-semibold text-content uppercase tracking-wide">
                  Pareto Source
                </h3>
                <span className="text-xs text-content-muted ml-auto">Optional</span>
              </div>
              <p className="text-xs text-content-muted mb-3">
                By default, Pareto counts from your selected factors. Upload a separate file for
                pre-aggregated counts (e.g., from ERP/MES).
              </p>

              {paretoMode === 'separate' && separateParetoFilename ? (
                // Show uploaded Pareto file
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-600/10 border border-orange-600/30">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-orange-400" />
                    <span className="text-sm text-orange-300">{separateParetoFilename}</span>
                    <span className="text-xs text-content-muted">(separate data)</span>
                  </div>
                  <button
                    onClick={onClearParetoFile}
                    className="text-content-secondary hover:text-red-400 p-1 transition-colors"
                    title="Remove Pareto file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                // Show upload zone
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDraggingPareto(true);
                  }}
                  onDragLeave={() => setIsDraggingPareto(false)}
                  onDrop={handleParetoDrop}
                  onClick={() => paretoFileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                    isDraggingPareto
                      ? 'bg-orange-600/20 border-orange-500'
                      : 'bg-surface-secondary/50 border-edge hover:border-edge-secondary hover:bg-surface-tertiary/50'
                  }`}
                >
                  <input
                    ref={paretoFileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleParetoFileChange}
                    className="hidden"
                  />
                  <Upload size={20} className="text-content-muted mb-2" />
                  <span className="text-xs text-content-muted">
                    Drop CSV/Excel with category + count columns
                  </span>
                  <span className="text-xs text-content-muted mt-1">
                    Not linked to main data filters
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-edge bg-surface-secondary flex justify-between items-center">
          <button
            onClick={onBack || onCancel}
            className="flex items-center gap-1.5 text-content-secondary hover:text-white text-sm font-medium px-4 py-2 hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <button
            onClick={() => onConfirm(outcome, factors)}
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            <span>Start Analysis</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnMapping;
