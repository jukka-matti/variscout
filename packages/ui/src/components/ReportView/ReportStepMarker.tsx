import React from 'react';
import { Check } from 'lucide-react';

export interface ReportStepMarkerProps {
  stepNumber: number;
  status: 'done' | 'active' | 'future';
}

export const ReportStepMarker: React.FC<ReportStepMarkerProps> = ({ stepNumber, status }) => {
  if (status === 'done') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <Check size={14} className="text-white" />
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
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
