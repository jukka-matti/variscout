/**
 * FactorPreviewOverlay - Embryonic Evidence Map preview modal
 *
 * Shows the Layer 1 (statistical) Evidence Map with a recommendation
 * to start investigation with the top factor (highest R²adj).
 * Rendered as a centered modal overlay over the dashboard.
 */

import React from 'react';
import { X, ArrowRight } from 'lucide-react';

export interface FactorPreviewOverlayProps {
  /** Rendered Evidence Map element (Layer 1 only) — parent provides */
  evidenceMap: React.ReactNode;
  /** Top factor name (highest R²adj) */
  topFactor: string;
  /** R²adj of the top factor */
  topFactorR2: number;
  /** Total R²adj explained by the best model */
  modelR2: number;
  /** Number of factors in the model */
  factorCount: number;
  /** Called when "Start with [factor]" is clicked */
  onStartWithFactor: (factor: string) => void;
  /** Called when "Skip" or close is clicked */
  onDismiss: () => void;
}

export const FactorPreviewOverlay: React.FC<FactorPreviewOverlayProps> = ({
  evidenceMap,
  topFactor,
  topFactorR2,
  modelR2,
  factorCount,
  onStartWithFactor,
  onDismiss,
}) => {
  const modelR2Pct = Math.round(modelR2 * 100);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="factor-preview-title"
        className="bg-surface border border-edge rounded-xl shadow-2xl flex flex-col w-[min(90vw,720px)] max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-edge flex-shrink-0">
          <div>
            <h2 id="factor-preview-title" className="text-sm font-semibold text-content">
              Factor Intelligence Preview
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Best subsets analysed {factorCount} {factorCount === 1 ? 'factor' : 'factors'} — model
              explains <span className="font-medium text-content">{modelR2Pct}%</span> of variation
            </p>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Close preview"
            className="text-content-secondary hover:text-content p-1.5 hover:bg-surface-secondary rounded-lg transition-colors -mr-1 -mt-1 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Evidence Map */}
        <div className="h-[min(50vh,400px)] flex-shrink-0 overflow-hidden bg-surface-secondary">
          {evidenceMap}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-edge flex-shrink-0">
          <button
            onClick={onDismiss}
            className="text-sm text-content-secondary hover:text-content transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onStartWithFactor(topFactor)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
          >
            <span>Start with {topFactor}</span>
            <ArrowRight size={14} />
            <span className="text-blue-200 text-xs font-normal ml-0.5">
              R²adj={Math.round(topFactorR2 * 100)}%
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
