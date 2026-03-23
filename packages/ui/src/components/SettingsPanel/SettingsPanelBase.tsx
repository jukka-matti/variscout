import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { RiskAxisConfig, RiskAxisPreset, MessageCatalog } from '@variscout/core';
import { DEFAULT_RISK_AXIS_CONFIG } from '@variscout/core';

type ChartFontScale = 'compact' | 'normal' | 'large';

const RISK_AXIS_PRESETS: RiskAxisPreset[] = [
  'process',
  'safety',
  'environmental',
  'quality',
  'regulatory',
  'brand',
];

export interface SettingsPanelBaseProps<
  T extends { lockYAxisToFullData?: boolean; showFilterContext?: boolean } = {
    lockYAxisToFullData?: boolean;
    showFilterContext?: boolean;
  },
> {
  isOpen: boolean;
  onClose: () => void;
  displayOptions: T;
  setDisplayOptions: (opts: T) => void;
  chartFontScale: ChartFontScale;
  onChartFontScaleChange: (scale: ChartFontScale) => void;
  /** Rendered before Display Preferences (e.g. Theme toggle, Accent picker) */
  headerSections?: React.ReactNode;
  /** Rendered after the shared toggles inside Display Preferences */
  extraToggles?: React.ReactNode;
  /** ID prefix for input elements (accessibility) */
  idPrefix?: string;
  /** Risk axis configuration for improvement evaluation */
  riskAxisConfig?: RiskAxisConfig;
  /** Callback when risk axis configuration changes */
  onRiskAxisConfigChange?: (config: RiskAxisConfig) => void;
  /** Improvement budget in euros */
  budget?: number;
  /** Callback when budget changes */
  onBudgetChange?: (budget: number | undefined) => void;
}

const FONT_SCALE_OPTIONS: { value: ChartFontScale; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
];

function SettingsPanelBase<
  T extends { lockYAxisToFullData?: boolean; showFilterContext?: boolean },
>({
  isOpen,
  onClose,
  displayOptions,
  setDisplayOptions,
  chartFontScale,
  onChartFontScaleChange,
  headerSections,
  extraToggles,
  idPrefix = 'settings',
  riskAxisConfig,
  onRiskAxisConfigChange,
  budget,
  onBudgetChange,
}: SettingsPanelBaseProps<T>) {
  const { t } = useTranslation();
  // Local state for display options — synced on open, applied on change
  const [local, setLocal] = useState<T>(displayOptions);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting local form state when settings panel opens
    if (isOpen) setLocal(displayOptions);
  }, [isOpen, displayOptions]);

  useEffect(() => {
    if (isOpen && JSON.stringify(local) !== JSON.stringify(displayOptions)) {
      setDisplayOptions(local);
    }
  }, [local, isOpen, setDisplayOptions, displayOptions]);

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open/close dialog based on isOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Handle native dialog close (Escape key handled by browser)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[60] bg-transparent backdrop:bg-black/40 max-w-none max-h-none w-full h-full m-0 p-0"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Panel — full-screen on phone, positioned right on tablet+ */}
      <div className="absolute inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:w-80 sm:h-full bg-surface sm:border-l border-edge shadow-2xl overflow-y-auto animate-slide-in-right safe-area-bottom">
        <div className="p-5 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-content">{t('nav.settings')}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              aria-label={t('action.close')}
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* App-specific header sections (Theme, Accent, etc.) */}
          {headerSections}

          {/* Display Preferences */}
          <section>
            <h3 className="text-sm font-medium text-content mb-3">{t('display.preferences')}</h3>
            <div className="space-y-3">
              <label
                htmlFor={`${idPrefix}-lock-y-axis`}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  id={`${idPrefix}-lock-y-axis`}
                  name={`${idPrefix}-lock-y-axis`}
                  type="checkbox"
                  checked={local.lockYAxisToFullData !== false}
                  onChange={e => setLocal({ ...local, lockYAxisToFullData: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface-secondary text-blue-500 focus:ring-blue-500 focus:ring-offset-surface"
                />
                <div>
                  <span className="text-sm text-content group-hover:text-content transition-colors block">
                    {t('display.lockYAxis')}
                  </span>
                  <span className="text-xs text-content-muted">{t('display.lockYAxisDesc')}</span>
                </div>
              </label>
              <label
                htmlFor={`${idPrefix}-show-filter-context`}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  id={`${idPrefix}-show-filter-context`}
                  name={`${idPrefix}-show-filter-context`}
                  type="checkbox"
                  checked={local.showFilterContext !== false}
                  onChange={e => setLocal({ ...local, showFilterContext: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface-secondary text-blue-500 focus:ring-blue-500 focus:ring-offset-surface"
                />
                <div>
                  <span className="text-sm text-content group-hover:text-content transition-colors block">
                    {t('display.filterContext')}
                  </span>
                  <span className="text-xs text-content-muted">
                    {t('display.filterContextDesc')}
                  </span>
                </div>
              </label>
              {extraToggles}
            </div>
          </section>

          {/* Chart Text Size */}
          <section>
            <h3 className="text-sm font-medium text-content mb-3">{t('display.chartTextSize')}</h3>
            <div className="flex gap-2">
              {FONT_SCALE_OPTIONS.map(({ value }) => {
                const fontScaleLabels: Record<ChartFontScale, string> = {
                  compact: t('display.compact'),
                  normal: t('display.normal'),
                  large: t('display.large'),
                };
                return (
                  <button
                    key={value}
                    onClick={() => onChartFontScaleChange(value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                      chartFontScale === value
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                        : 'bg-surface-secondary border-edge text-content-secondary hover:text-content hover:border-edge-secondary'
                    }`}
                  >
                    {fontScaleLabels[value]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Improvement Evaluation — only shown when callbacks are provided */}
          {onRiskAxisConfigChange && (
            <section>
              <h3 className="text-sm font-medium text-content mb-3">
                {t('settings.improvementEvaluation')}
              </h3>
              <div className="space-y-3">
                {/* Risk Axis 1 */}
                <div>
                  <label
                    htmlFor={`${idPrefix}-risk-axis-1`}
                    className="block text-sm text-content-secondary mb-1"
                  >
                    {t('settings.riskAxis1')}
                  </label>
                  <select
                    id={`${idPrefix}-risk-axis-1`}
                    value={(riskAxisConfig ?? DEFAULT_RISK_AXIS_CONFIG).axis1}
                    onChange={e => {
                      const current = riskAxisConfig ?? DEFAULT_RISK_AXIS_CONFIG;
                      onRiskAxisConfigChange({
                        ...current,
                        axis1: e.target.value as RiskAxisPreset,
                      });
                    }}
                    className="w-full rounded-lg border border-edge bg-surface-secondary text-content text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {RISK_AXIS_PRESETS.filter(
                      p => p !== (riskAxisConfig ?? DEFAULT_RISK_AXIS_CONFIG).axis2
                    ).map(preset => (
                      <option key={preset} value={preset}>
                        {t(`risk.preset.${preset}` as keyof MessageCatalog)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Risk Axis 2 */}
                <div>
                  <label
                    htmlFor={`${idPrefix}-risk-axis-2`}
                    className="block text-sm text-content-secondary mb-1"
                  >
                    {t('settings.riskAxis2')}
                  </label>
                  <select
                    id={`${idPrefix}-risk-axis-2`}
                    value={(riskAxisConfig ?? DEFAULT_RISK_AXIS_CONFIG).axis2}
                    onChange={e => {
                      const current = riskAxisConfig ?? DEFAULT_RISK_AXIS_CONFIG;
                      onRiskAxisConfigChange({
                        ...current,
                        axis2: e.target.value as RiskAxisPreset,
                      });
                    }}
                    className="w-full rounded-lg border border-edge bg-surface-secondary text-content text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {RISK_AXIS_PRESETS.filter(
                      p => p !== (riskAxisConfig ?? DEFAULT_RISK_AXIS_CONFIG).axis1
                    ).map(preset => (
                      <option key={preset} value={preset}>
                        {t(`risk.preset.${preset}` as keyof MessageCatalog)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Improvement Budget */}
                <div>
                  <label
                    htmlFor={`${idPrefix}-improvement-budget`}
                    className="block text-sm text-content-secondary mb-1"
                  >
                    {t('settings.improvementBudget')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted pointer-events-none">
                      &euro;
                    </span>
                    <input
                      id={`${idPrefix}-improvement-budget`}
                      type="number"
                      min={0}
                      step={100}
                      value={budget ?? ''}
                      placeholder="e.g., 10000"
                      onChange={e => {
                        if (!onBudgetChange) return;
                        const val = e.target.value;
                        onBudgetChange(val === '' ? undefined : Number(val));
                      }}
                      className="w-full rounded-lg border border-edge bg-surface-secondary text-content text-sm pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </dialog>
  );
}

export default SettingsPanelBase;
