import React from 'react';
import type { InvestigationPhase } from '@variscout/core';

export interface InvestigationPhaseBadgeProps {
  phase: InvestigationPhase;
}

const phaseConfig: Record<InvestigationPhase, { label: string; classes: string }> = {
  initial: { label: 'Initial', classes: 'bg-slate-500/20 text-slate-400' },
  diverging: { label: 'Diverging', classes: 'bg-amber-500/20 text-amber-400' },
  validating: { label: 'Validating', classes: 'bg-blue-500/20 text-blue-400' },
  converging: { label: 'Converging', classes: 'bg-purple-500/20 text-purple-400' },
  acting: { label: 'Acting', classes: 'bg-green-500/20 text-green-400' },
};

const InvestigationPhaseBadge: React.FC<InvestigationPhaseBadgeProps> = ({ phase }) => {
  const config = phaseConfig[phase];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${config.classes}`}
      data-testid="investigation-phase-badge"
    >
      {config.label}
    </span>
  );
};

export { InvestigationPhaseBadge };
