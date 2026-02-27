import React from 'react';
import { MoveVertical, ArrowDown, ArrowUp } from 'lucide-react';
import type { CharacteristicType } from '@variscout/core';

const TYPE_ICONS: {
  value: CharacteristicType;
  icon: typeof MoveVertical;
  label: string;
  description: string;
}[] = [
  {
    value: 'nominal',
    icon: MoveVertical,
    label: 'Nominal',
    description: 'Target-centered (e.g. fill weight)',
  },
  {
    value: 'smaller',
    icon: ArrowDown,
    label: 'Smaller is better',
    description: 'Lower is better (e.g. defects)',
  },
  {
    value: 'larger',
    icon: ArrowUp,
    label: 'Larger is better',
    description: 'Higher is better (e.g. yield)',
  },
];

export interface CharacteristicTypeSelectorProps {
  /** Currently selected type, or null for auto-detect */
  value: CharacteristicType | null;
  /** Called when user clicks a type button (null = deselect / back to auto) */
  onChange: (type: CharacteristicType | null) => void;
  /** The type that would be inferred from specs (shown with dotted border) */
  autoInferred: CharacteristicType;
  /** Additional class name for the container div */
  className?: string;
}

const CharacteristicTypeSelector: React.FC<CharacteristicTypeSelectorProps> = ({
  value,
  onChange,
  autoInferred,
  className,
}) => {
  return (
    <div className={className ?? 'flex gap-1'} role="radiogroup" aria-label="Characteristic type">
      {TYPE_ICONS.map(opt => {
        const Icon = opt.icon;
        const isExplicit = value === opt.value;
        const isInferred = !value && autoInferred === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isExplicit}
            aria-label={`${opt.label} — ${opt.description}`}
            onClick={() => onChange(isExplicit ? null : opt.value)}
            title={`${opt.label} — ${opt.description}`}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              isExplicit
                ? 'bg-blue-600 text-white border border-blue-500'
                : isInferred
                  ? 'border border-dashed border-blue-400/50 text-blue-400/60'
                  : 'border border-edge text-content-muted hover:border-blue-500/50'
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
};

export default CharacteristicTypeSelector;
