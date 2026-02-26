import React from 'react';

export type CapabilityMetric = 'cp' | 'cpk' | 'both';

interface CapabilityMetricToggleProps {
  metric: CapabilityMetric;
  onChange: (metric: CapabilityMetric) => void;
}

const CapabilityMetricToggle: React.FC<CapabilityMetricToggleProps> = ({ metric, onChange }) => {
  return (
    <div className="flex rounded overflow-hidden border border-edge-secondary">
      <button
        onClick={() => onChange('cpk')}
        aria-pressed={metric === 'cpk'}
        className={`px-2 py-0.5 text-xs font-medium transition-colors ${
          metric === 'cpk'
            ? 'bg-blue-600 text-white'
            : 'bg-surface-tertiary text-content-secondary hover:bg-blue-800 hover:text-white'
        }`}
      >
        Cpk
      </button>
      <button
        onClick={() => onChange('cp')}
        aria-pressed={metric === 'cp'}
        className={`px-2 py-0.5 text-xs font-medium transition-colors ${
          metric === 'cp'
            ? 'bg-purple-600 text-white'
            : 'bg-surface-tertiary text-content-secondary hover:bg-purple-800 hover:text-white'
        }`}
      >
        Cp
      </button>
      <button
        onClick={() => onChange('both')}
        aria-pressed={metric === 'both'}
        className={`px-2 py-0.5 text-xs font-medium transition-colors ${
          metric === 'both'
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
            : 'bg-surface-tertiary text-content-secondary hover:text-white'
        }`}
      >
        Both
      </button>
    </div>
  );
};

export default CapabilityMetricToggle;
