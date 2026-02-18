import React, { useState, useMemo } from 'react';

interface OutcomeSelectorProps {
  rawData: Record<string, any>[];
  onStart: (outcome: string, factors: string[]) => void;
}

const OutcomeSelector: React.FC<OutcomeSelectorProps> = ({ rawData, onStart }) => {
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  const numericCols = useMemo(() => {
    if (rawData.length === 0) return [];
    return Object.keys(rawData[0]).filter(k => typeof rawData[0][k] === 'number');
  }, [rawData]);

  const categoricalCols = useMemo(() => {
    if (rawData.length === 0) return [];
    return Object.keys(rawData[0]).filter(k => {
      if (typeof rawData[0][k] === 'number') return false;
      const uniq = new Set(rawData.map(r => r[k])).size;
      return uniq >= 2 && uniq <= 20;
    });
  }, [rawData]);

  const toggleFactor = (col: string) => {
    setSelectedFactors(prev =>
      prev.includes(col) ? prev.filter(f => f !== col) : prev.length < 6 ? [...prev, col] : prev
    );
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
      {/* Outcome dropdown */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Outcome (numeric measurement)
        </label>
        <select
          value={selectedOutcome}
          onChange={e => setSelectedOutcome(e.target.value)}
          aria-label="Select outcome variable"
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">Select a column...</option>
          {numericCols.map(col => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* Factor checkboxes */}
      {categoricalCols.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Factors (categorical, max 6)
          </label>
          <div className="flex flex-wrap gap-2">
            {categoricalCols.map(col => (
              <label
                key={col}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors border ${
                  selectedFactors.includes(col)
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFactors.includes(col)}
                  onChange={() => toggleFactor(col)}
                  className="sr-only"
                />
                {col}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={() => onStart(selectedOutcome, selectedFactors)}
        disabled={!selectedOutcome}
        className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
      >
        Start Analysis
      </button>
    </div>
  );
};

export default OutcomeSelector;
