import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface CausalLinkCreatorProps {
  fromFactor: string;
  toFactor: string;
  onConfirm: (params: {
    whyStatement: string;
    direction: 'drives' | 'modulates' | 'confounds';
    evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
  }) => void;
  onCancel: () => void;
  cycleWarning?: boolean;
}

export const CausalLinkCreator: React.FC<CausalLinkCreatorProps> = ({
  fromFactor,
  toFactor,
  onConfirm,
  onCancel,
  cycleWarning,
}) => {
  const [whyStatement, setWhyStatement] = useState('');
  const [direction, setDirection] = useState<'drives' | 'modulates' | 'confounds'>('drives');
  const [evidenceType, setEvidenceType] = useState<'data' | 'gemba' | 'expert' | 'unvalidated'>(
    'unvalidated'
  );

  const handleConfirm = () => {
    if (!whyStatement.trim()) return;
    onConfirm({ whyStatement: whyStatement.trim(), direction, evidenceType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface border border-edge rounded-xl shadow-2xl w-[min(90vw,480px)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-content">Create Causal Link</h3>
          <button
            onClick={onCancel}
            className="p-1 text-content-tertiary hover:text-content rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-content-secondary mb-3">
          Why does <span className="font-medium text-content">{fromFactor}</span>{' '}
          {direction === 'drives' ? 'drive' : direction === 'modulates' ? 'modulate' : 'confound'}{' '}
          <span className="font-medium text-content">{toFactor}</span>?
        </p>

        {cycleWarning && (
          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
            This link would create a cycle in the causal graph and cannot be added.
          </div>
        )}

        <textarea
          value={whyStatement}
          onChange={e => setWhyStatement(e.target.value)}
          placeholder="Describe the mechanism..."
          className="w-full px-3 py-2 text-sm border border-edge rounded-lg bg-surface text-content focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 mb-3"
          autoFocus
        />

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-content-secondary block mb-1">
              Direction
            </label>
            <select
              value={direction}
              onChange={e => setDirection(e.target.value as typeof direction)}
              className="w-full px-2 py-1.5 text-xs border border-edge rounded bg-surface text-content"
            >
              <option value="drives">Drives</option>
              <option value="modulates">Modulates</option>
              <option value="confounds">Confounds</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-content-secondary block mb-1">
              Evidence
            </label>
            <select
              value={evidenceType}
              onChange={e => setEvidenceType(e.target.value as typeof evidenceType)}
              className="w-full px-2 py-1.5 text-xs border border-edge rounded bg-surface text-content"
            >
              <option value="data">Data</option>
              <option value="gemba">Gemba</option>
              <option value="expert">Expert</option>
              <option value="unvalidated">Unvalidated</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs text-content-secondary hover:text-content transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!whyStatement.trim() || cycleWarning}
            className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Link
          </button>
        </div>
      </div>
    </div>
  );
};
