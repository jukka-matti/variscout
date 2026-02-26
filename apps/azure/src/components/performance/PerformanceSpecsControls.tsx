import React from 'react';
import type { SpecLimits } from '@variscout/core';

interface PerformanceSpecsControlsProps {
  /** Prefix for input ids to ensure uniqueness (e.g. 'grid' or 'focused') */
  idPrefix: string;
  localLSL: string;
  localUSL: string;
  cpkTarget: number;
  specs: SpecLimits;
  onLSLChange: (value: string) => void;
  onUSLChange: (value: string) => void;
  onCpkTargetChange: (value: number) => void;
  onLSLBlur: () => void;
  onUSLBlur: () => void;
}

const PerformanceSpecsControls: React.FC<PerformanceSpecsControlsProps> = ({
  idPrefix,
  localLSL,
  localUSL,
  cpkTarget,
  specs: _specs,
  onLSLChange,
  onUSLChange,
  onCpkTargetChange,
  onLSLBlur,
  onUSLBlur,
}) => {
  return (
    <>
      {/* Cpk Target Adjustment */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={`cpk-target-${idPrefix}`} className="text-content-secondary">
          Target Cpk:
        </label>
        <input
          id={`cpk-target-${idPrefix}`}
          type="number"
          min="0.5"
          max="3.0"
          step="0.01"
          value={cpkTarget}
          onChange={e => onCpkTargetChange(parseFloat(e.target.value) || 1.33)}
          className="w-20 px-2 py-1 bg-surface-tertiary text-content border border-edge-secondary rounded text-center"
          title="Industry standard: 1.33 (4σ), 1.67 (5σ), 2.00 (6σ)"
        />
      </div>

      {/* LSL Input */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={`lsl-input-${idPrefix}`} className="text-content-secondary">
          LSL:
        </label>
        <input
          id={`lsl-input-${idPrefix}`}
          type="number"
          value={localLSL}
          onChange={e => {
            onLSLChange(e.target.value);
          }}
          onBlur={onLSLBlur}
          placeholder="Lower"
          className="w-20 px-2 py-1 bg-surface-tertiary text-content border border-edge-secondary rounded text-center"
        />
      </div>

      {/* USL Input */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={`usl-input-${idPrefix}`} className="text-content-secondary">
          USL:
        </label>
        <input
          id={`usl-input-${idPrefix}`}
          type="number"
          value={localUSL}
          onChange={e => {
            onUSLChange(e.target.value);
          }}
          onBlur={onUSLBlur}
          placeholder="Upper"
          className="w-20 px-2 py-1 bg-surface-tertiary text-content border border-edge-secondary rounded text-center"
        />
      </div>
    </>
  );
};

export default PerformanceSpecsControls;
