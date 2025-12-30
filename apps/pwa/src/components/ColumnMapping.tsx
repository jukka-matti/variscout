import React, { useState, useEffect } from 'react';
import { ArrowRight, BarChart2, CheckSquare, Settings2 } from 'lucide-react';

interface ColumnMappingProps {
  availableColumns: string[];
  initialOutcome: string | null;
  initialFactors: string[];
  datasetName?: string;
  onConfirm: (outcome: string, factors: string[]) => void;
  onCancel: () => void;
}

const ColumnMapping: React.FC<ColumnMappingProps> = ({
  availableColumns,
  initialOutcome,
  initialFactors,
  datasetName = 'Uploaded Dataset',
  onConfirm,
  onCancel,
}) => {
  const [outcome, setOutcome] = useState<string>(initialOutcome || '');
  const [factors, setFactors] = useState<string[]>(initialFactors || []);

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

  return (
    <div className="flex flex-col h-full items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Settings2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Map Your Data</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Confirm which columns to analyze from <strong>{datasetName}</strong>. You can adjust
            this later in Settings.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-900/30">
          {/* Outcome Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                Y
              </div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                Select Outcome (Measure)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
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
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
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
                      outcome === col ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
                    }`}
                  >
                    {outcome === col && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${outcome === col ? 'text-white' : 'text-slate-400'}`}
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
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                Select Factors (Categories)
              </h3>
              <span className="text-xs text-slate-500 ml-auto">{factors.length}/3 selected</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
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
                          ? 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        factors.includes(col)
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-500'
                      }`}
                    >
                      {factors.includes(col) && <CheckSquare size={12} className="text-white" />}
                    </div>
                    <span
                      className={`text-sm font-medium ${factors.includes(col) ? 'text-white' : 'text-slate-400'}`}
                    >
                      {col}{' '}
                      {isOutcome && <span className="text-xs text-blue-400 ml-1">(Outcome)</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
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
