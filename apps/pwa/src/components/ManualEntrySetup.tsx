import React from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';

interface ManualEntrySetupProps {
  outcomeName: string;
  factors: string[];
  usl: string;
  lsl: string;
  onOutcomeChange: (value: string) => void;
  onFactorsChange: (factors: string[]) => void;
  onUslChange: (value: string) => void;
  onLslChange: (value: string) => void;
  onCancel: () => void;
  onContinue: () => void;
}

/**
 * Configuration step for Manual Entry
 * Allows users to define outcome, factors, and optional spec limits
 */
const ManualEntrySetup: React.FC<ManualEntrySetupProps> = ({
  outcomeName,
  factors,
  usl,
  lsl,
  onOutcomeChange,
  onFactorsChange,
  onUslChange,
  onLslChange,
  onCancel,
  onContinue,
}) => {
  const addFactor = () => onFactorsChange([...factors, `Factor ${factors.length + 1}`]);
  const removeFactor = (idx: number) => onFactorsChange(factors.filter((_, i) => i !== idx));
  const updateFactor = (idx: number, val: string) => {
    const newFactors = [...factors];
    newFactors[idx] = val;
    onFactorsChange(newFactors);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-200 p-8">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Step 1: What are you measuring?</h2>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-400 mb-2">Outcome (Y)</label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={outcomeName}
            onChange={e => onOutcomeChange(e.target.value)}
            placeholder="e.g. Weight, Diameter, pH"
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-slate-400">Factors (X)</label>
            <button
              onClick={addFactor}
              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
            >
              <Plus size={14} /> Add Factor
            </button>
          </div>
          <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
            {factors.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={f}
                  onChange={e => updateFactor(i, e.target.value)}
                  placeholder={`Factor ${i + 1}`}
                />
                {factors.length > 1 && (
                  <button
                    onClick={() => removeFactor(i)}
                    className="text-slate-500 hover:text-red-400 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-400 mb-2">
            Spec Limits (optional)
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Set limits to see pass/fail feedback as you enter data
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Lower (LSL)</label>
              <input
                type="number"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={lsl}
                onChange={e => onLslChange(e.target.value)}
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Upper (USL)</label>
              <input
                type="number"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={usl}
                onChange={e => onUslChange(e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-700">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20"
          >
            Start Entry <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualEntrySetup;
