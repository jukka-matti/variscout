import React from 'react';

export type IPDetailMode = 'overview' | 'sections';

interface IPDetailModeToggleProps {
  mode: IPDetailMode;
  onModeChange: (mode: IPDetailMode) => void;
}

const IPDetailModeToggle: React.FC<IPDetailModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-0.5" role="group">
      <button
        type="button"
        data-testid="mode-overview"
        aria-pressed={mode === 'overview'}
        onClick={() => onModeChange('overview')}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
          mode === 'overview'
            ? 'bg-white text-content shadow-sm'
            : 'text-content-secondary hover:text-content'
        }`}
      >
        Overview
      </button>
      <button
        type="button"
        data-testid="mode-sections"
        aria-pressed={mode === 'sections'}
        onClick={() => onModeChange('sections')}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
          mode === 'sections'
            ? 'bg-white text-content shadow-sm'
            : 'text-content-secondary hover:text-content'
        }`}
      >
        Sections
      </button>
    </div>
  );
};

export default IPDetailModeToggle;
