import React from 'react';
import { MoveVertical, ArrowDown, ArrowUp } from 'lucide-react';
import type { CharacteristicType } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

const TYPE_ICON_DEFS: {
  value: CharacteristicType;
  icon: typeof MoveVertical;
  labelKey: 'charType.nominal' | 'charType.smaller' | 'charType.larger';
  descKey: 'charType.nominalDesc' | 'charType.smallerDesc' | 'charType.largerDesc';
}[] = [
  {
    value: 'nominal',
    icon: MoveVertical,
    labelKey: 'charType.nominal',
    descKey: 'charType.nominalDesc',
  },
  {
    value: 'smaller',
    icon: ArrowDown,
    labelKey: 'charType.smaller',
    descKey: 'charType.smallerDesc',
  },
  {
    value: 'larger',
    icon: ArrowUp,
    labelKey: 'charType.larger',
    descKey: 'charType.largerDesc',
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
  const { t } = useTranslation();
  return (
    <div className={className ?? 'flex gap-1'} role="radiogroup" aria-label="Characteristic type">
      {TYPE_ICON_DEFS.map(opt => {
        const Icon = opt.icon;
        const label = t(opt.labelKey);
        const description = t(opt.descKey);
        const isExplicit = value === opt.value;
        const isInferred = !value && autoInferred === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isExplicit}
            aria-label={`${label} — ${description}`}
            onClick={() => onChange(isExplicit ? null : opt.value)}
            title={`${label} — ${description}`}
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
