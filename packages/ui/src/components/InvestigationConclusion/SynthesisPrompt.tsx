import React from 'react';
import type { EvidenceCluster } from '@variscout/core/findings';

export interface SynthesisPromptProps {
  cluster: EvidenceCluster;
  onNameCause: () => void;
  onDismiss: () => void;
}

const SynthesisPrompt: React.FC<SynthesisPromptProps> = ({ cluster, onNameCause, onDismiss }) => {
  const factorLabel = cluster.factors.join(' + ');
  const pct = Math.round(cluster.rSquaredAdj * 100);
  const count = cluster.questionIds.length;

  return (
    <div
      className="border border-dashed border-amber-500/30 rounded-lg p-3 bg-amber-500/5"
      data-testid="synthesis-prompt"
    >
      <div className="text-[11px] text-amber-500 font-medium mb-1">Related evidence detected</div>
      <p className="text-xs text-content-secondary leading-relaxed mb-2">
        {count} answered questions relate to{' '}
        <span className="font-medium text-content">{factorLabel}</span> factors
        {pct > 0 && ` (combined R\u00b2adj ${pct}%)`}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onNameCause}
          className="text-xs font-medium px-2.5 py-1 rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors"
          data-testid="synthesis-prompt-name"
        >
          Name this cause →
        </button>
        <button
          onClick={onDismiss}
          className="text-xs text-content-muted hover:text-content transition-colors px-2 py-1"
          data-testid="synthesis-prompt-dismiss"
        >
          Not yet
        </button>
      </div>
    </div>
  );
};

export { SynthesisPrompt };
