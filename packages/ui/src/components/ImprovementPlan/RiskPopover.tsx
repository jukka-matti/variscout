import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type {
  RiskLevel,
  ComputedRiskLevel,
  IdeaRiskAssessment,
  RiskAxisConfig,
  RiskAxisPreset,
  MessageCatalog,
} from '@variscout/core';
import { computeRiskLevel } from '@variscout/core';

type I18nKey = keyof MessageCatalog;

export interface RiskPopoverProps {
  risk?: IdeaRiskAssessment;
  axisConfig: RiskAxisConfig;
  onRiskChange: (risk: IdeaRiskAssessment) => void;
  onAxisConfigChange?: (config: RiskAxisConfig) => void;
  onClose: () => void;
}

const AXIS_LEVELS: RiskLevel[] = [1, 2, 3];

/** Rows from top to bottom: Severe(3), Significant(2), Small(1) */
const AXIS1_ROWS: RiskLevel[] = [3, 2, 1];

const AXIS1_LABEL_KEYS: Record<RiskLevel, I18nKey> = {
  1: 'risk.small',
  2: 'risk.significant',
  3: 'risk.severe',
};

const AXIS2_LABEL_KEYS: Record<RiskLevel, I18nKey> = {
  1: 'risk.none',
  2: 'risk.possible',
  3: 'risk.immediate',
};

const RISK_LABEL_KEYS: Record<ComputedRiskLevel, I18nKey> = {
  low: 'risk.low',
  medium: 'risk.medium',
  high: 'risk.high',
  'very-high': 'risk.veryHigh',
};

const RISK_CELL_COLORS: Record<ComputedRiskLevel, string> = {
  low: 'bg-green-500/10',
  medium: 'bg-amber-500/10',
  high: 'bg-amber-500/20',
  'very-high': 'bg-red-400/20',
};

const ALL_PRESETS: RiskAxisPreset[] = [
  'process',
  'safety',
  'environmental',
  'quality',
  'regulatory',
  'brand',
];

const PRESET_LABEL_KEYS: Record<RiskAxisPreset, I18nKey> = {
  process: 'risk.preset.process',
  safety: 'risk.preset.safety',
  environmental: 'risk.preset.environmental',
  quality: 'risk.preset.quality',
  regulatory: 'risk.preset.regulatory',
  brand: 'risk.preset.brand',
};

const RiskPopover: React.FC<RiskPopoverProps> = ({
  risk,
  axisConfig,
  onRiskChange,
  onAxisConfigChange,
  onClose,
}) => {
  const { t } = useTranslation();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [axis1Dropdown, setAxis1Dropdown] = useState(false);
  const [axis2Dropdown, setAxis2Dropdown] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (popoverRef.current && target && !popoverRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCellClick = useCallback(
    (axis1: RiskLevel, axis2: RiskLevel) => {
      const computed = computeRiskLevel(axis1, axis2);
      onRiskChange({ axis1, axis2, computed });
    },
    [onRiskChange]
  );

  const handleAxisChange = useCallback(
    (axis: 'axis1' | 'axis2', preset: RiskAxisPreset) => {
      if (!onAxisConfigChange) return;
      onAxisConfigChange({ ...axisConfig, [axis]: preset });
      setAxis1Dropdown(false);
      setAxis2Dropdown(false);
    },
    [axisConfig, onAxisConfigChange]
  );

  const axis1Label = t(PRESET_LABEL_KEYS[axisConfig.axis1]);
  const axis2Label = t(PRESET_LABEL_KEYS[axisConfig.axis2]);

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-72 bg-surface-secondary border border-edge rounded-lg shadow-2xl animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-edge">
        <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          {t('risk.label')}
        </h4>
      </div>

      {/* Grid area */}
      <div className="p-3">
        <div className="flex">
          {/* Y-axis label (axis1) */}
          <div className="flex flex-col items-center justify-center w-6 mr-1">
            <AxisLabel
              label={axis1Label}
              isOpen={axis1Dropdown}
              onToggle={() => {
                if (onAxisConfigChange) {
                  setAxis1Dropdown(!axis1Dropdown);
                  setAxis2Dropdown(false);
                }
              }}
              vertical
              disabled={!onAxisConfigChange}
            />
            {axis1Dropdown && (
              <AxisDropdown
                current={axisConfig.axis1}
                exclude={axisConfig.axis2}
                onSelect={preset => handleAxisChange('axis1', preset)}
                t={t}
              />
            )}
          </div>

          {/* Grid + axis2 labels */}
          <div className="flex-1">
            {/* 3x3 grid */}
            <div className="grid grid-cols-3 gap-1">
              {AXIS1_ROWS.map(a1 =>
                AXIS_LEVELS.map(a2 => {
                  const computed = computeRiskLevel(a1, a2);
                  const isSelected = risk?.axis1 === a1 && risk?.axis2 === a2;
                  return (
                    <button
                      key={`${a1}-${a2}`}
                      onClick={() => handleCellClick(a1, a2)}
                      className={`
                        px-1 py-2 rounded text-[10px] font-medium text-content-secondary
                        transition-all cursor-pointer
                        ${RISK_CELL_COLORS[computed]}
                        ${isSelected ? 'ring-2 ring-blue-500 border border-blue-500' : 'border border-transparent hover:border-edge-secondary'}
                      `}
                      title={`${axis1Label}: ${t(AXIS1_LABEL_KEYS[a1])} / ${axis2Label}: ${t(AXIS2_LABEL_KEYS[a2])}`}
                    >
                      {t(RISK_LABEL_KEYS[computed])}
                    </button>
                  );
                })
              )}
            </div>

            {/* X-axis labels */}
            <div className="grid grid-cols-3 gap-1 mt-1">
              {AXIS_LEVELS.map(level => (
                <div key={level} className="text-[9px] text-content-muted text-center truncate">
                  {t(AXIS2_LABEL_KEYS[level])}
                </div>
              ))}
            </div>

            {/* X-axis preset label (axis2) */}
            <div className="relative flex justify-center mt-1">
              <AxisLabel
                label={axis2Label}
                isOpen={axis2Dropdown}
                onToggle={() => {
                  if (onAxisConfigChange) {
                    setAxis2Dropdown(!axis2Dropdown);
                    setAxis1Dropdown(false);
                  }
                }}
                disabled={!onAxisConfigChange}
              />
              {axis2Dropdown && (
                <AxisDropdown
                  current={axisConfig.axis2}
                  exclude={axisConfig.axis1}
                  onSelect={preset => handleAxisChange('axis2', preset)}
                  t={t}
                />
              )}
            </div>
          </div>

          {/* Y-axis level labels */}
          <div className="flex flex-col justify-between ml-1 py-0.5" style={{ height: 'auto' }}>
            {AXIS1_ROWS.map(level => (
              <div
                key={level}
                className="text-[9px] text-content-muted text-right flex-1 flex items-center justify-end"
              >
                {t(AXIS1_LABEL_KEYS[level])}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result bar */}
      <div className="px-3 pb-3">
        <div className="text-xs text-content-secondary bg-surface-tertiary rounded px-2 py-1.5 text-center">
          {risk ? (
            <>
              {t('risk.label')}:{' '}
              <span className="font-semibold text-content">
                {t(RISK_LABEL_KEYS[risk.computed])}
              </span>
              <span className="text-content-muted">
                {' '}
                &mdash; {axis1Label}: {risk.axis1} &times; {axis2Label}: {risk.axis2}
              </span>
            </>
          ) : (
            <span className="text-content-muted">{t('risk.notSet')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Clickable axis label that opens a preset dropdown */
const AxisLabel: React.FC<{
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  vertical?: boolean;
  disabled?: boolean;
}> = ({ label, isOpen, onToggle, vertical, disabled }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`
      flex items-center gap-0.5 text-[10px] font-medium text-content-secondary
      transition-colors rounded px-1 py-0.5
      ${disabled ? 'cursor-default' : 'hover:text-content hover:bg-surface-tertiary cursor-pointer'}
      ${vertical ? '[writing-mode:vertical-rl] rotate-180' : ''}
    `}
  >
    {label}
    {!disabled && (
      <ChevronDown
        size={10}
        className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${vertical ? 'rotate-90' : ''}`}
      />
    )}
  </button>
);

/** Dropdown for selecting axis preset */
const AxisDropdown: React.FC<{
  current: RiskAxisPreset;
  exclude: RiskAxisPreset;
  onSelect: (preset: RiskAxisPreset) => void;
  t: (key: I18nKey) => string;
}> = ({ current, exclude, onSelect, t }) => (
  <div className="absolute z-60 mt-1 bg-surface-secondary border border-edge rounded-md shadow-xl py-1 min-w-[120px]">
    {ALL_PRESETS.filter(p => p !== exclude).map(preset => (
      <button
        key={preset}
        onClick={() => onSelect(preset)}
        className={`
          w-full text-left px-3 py-1.5 text-xs transition-colors
          ${preset === current ? 'text-blue-400 bg-blue-500/10' : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'}
        `}
      >
        {t(PRESET_LABEL_KEYS[preset])}
      </button>
    ))}
  </div>
);

export { RiskPopover };
export type { RiskPopoverProps as RiskPopoverPropsExport };
