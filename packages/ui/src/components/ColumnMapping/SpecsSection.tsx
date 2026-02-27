import React from 'react';
import { ChevronDown, ChevronRight, Target } from 'lucide-react';
import { inferCharacteristicType, type CharacteristicType } from '@variscout/core';
import CharacteristicTypeSelector from '../CharacteristicTypeSelector';

export interface SpecsSectionProps {
  expanded: boolean;
  onToggle: () => void;
  target: string;
  lsl: string;
  usl: string;
  onTargetChange: (val: string) => void;
  onLslChange: (val: string) => void;
  onUslChange: (val: string) => void;
  characteristicType?: CharacteristicType | null;
  onCharacteristicTypeChange?: (type: CharacteristicType | null) => void;
}

const SpecsSection: React.FC<SpecsSectionProps> = ({
  expanded,
  onToggle,
  target,
  lsl,
  usl,
  onTargetChange,
  onLslChange,
  onUslChange,
  characteristicType = null,
  onCharacteristicTypeChange,
}) => {
  const autoInferred = inferCharacteristicType({
    usl: usl ? parseFloat(usl) : undefined,
    lsl: lsl ? parseFloat(lsl) : undefined,
  });

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left group"
        type="button"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600/20 text-amber-400">
          <Target size={14} />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Set Specification Limits
        </h3>
        <span className="text-xs text-slate-500 ml-auto mr-2">Optional</span>
        {expanded ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>

      {expanded && (
        <div
          className="mt-3 space-y-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700"
          data-testid="specs-section"
        >
          <div className="flex items-center gap-3">
            <label
              htmlFor="setup-spec-target"
              className="text-xs text-slate-400 w-20 text-right shrink-0"
            >
              Target
            </label>
            <input
              id="setup-spec-target"
              name="setup-spec-target"
              type="number"
              step="any"
              value={target}
              onChange={e => onTargetChange(e.target.value)}
              placeholder="Ideal value"
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 placeholder-slate-600"
              aria-label="Target specification"
            />
            <CharacteristicTypeSelector
              value={characteristicType}
              onChange={type => onCharacteristicTypeChange?.(type)}
              autoInferred={autoInferred}
              className="flex gap-1 shrink-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="setup-spec-lsl"
              className="text-xs text-slate-400 w-20 text-right shrink-0"
            >
              LSL (Min)
            </label>
            <input
              id="setup-spec-lsl"
              name="setup-spec-lsl"
              type="number"
              step="any"
              value={lsl}
              onChange={e => onLslChange(e.target.value)}
              placeholder="Lower limit"
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 placeholder-slate-600"
              aria-label="LSL specification"
            />
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="setup-spec-usl"
              className="text-xs text-slate-400 w-20 text-right shrink-0"
            >
              USL (Max)
            </label>
            <input
              id="setup-spec-usl"
              name="setup-spec-usl"
              type="number"
              step="any"
              value={usl}
              onChange={e => onUslChange(e.target.value)}
              placeholder="Upper limit"
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 placeholder-slate-600"
              aria-label="USL specification"
            />
          </div>
          <p className="text-xs text-slate-500">You can always change these later.</p>
        </div>
      )}
    </div>
  );
};

export default SpecsSection;
