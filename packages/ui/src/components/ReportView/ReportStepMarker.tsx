import React from 'react';
import { Check } from 'lucide-react';

type ReportWorkspace = 'analysis' | 'findings' | 'improvement';

const WORKSPACE_ACTIVE_COLORS: Record<ReportWorkspace, string> = {
  analysis: 'bg-green-500',
  findings: 'bg-amber-500',
  improvement: 'bg-purple-500',
};

const WORKSPACE_RING_COLORS: Record<ReportWorkspace, string> = {
  analysis: 'ring-green-500/30',
  findings: 'ring-amber-500/30',
  improvement: 'ring-purple-500/30',
};

export interface ReportStepMarkerProps {
  stepNumber: number;
  status: 'done' | 'active' | 'future';
  workspace?: ReportWorkspace;
}

export const ReportStepMarker: React.FC<ReportStepMarkerProps> = ({
  stepNumber,
  status,
  workspace,
}) => {
  if (status === 'done') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <Check size={14} className="text-white" />
      </div>
    );
  }

  if (status === 'active') {
    const bgColor = workspace ? WORKSPACE_ACTIVE_COLORS[workspace] : 'bg-blue-500';
    const ringColor = workspace ? WORKSPACE_RING_COLORS[workspace] : '';
    return (
      <div
        className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0 ${ringColor ? `ring-2 ${ringColor}` : ''}`}
      >
        <span className="text-white text-sm font-semibold">{stepNumber}</span>
      </div>
    );
  }

  // future
  return (
    <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
      <span className="text-slate-400 dark:text-slate-500 text-sm font-semibold">{stepNumber}</span>
    </div>
  );
};
