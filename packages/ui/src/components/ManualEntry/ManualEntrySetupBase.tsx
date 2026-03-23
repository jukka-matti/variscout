import React, { useState, useMemo } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

type EntryMode = 'standard' | 'performance';

export interface ManualEntrySetupBaseProps {
  outcomeName: string;
  factors: string[];
  usl: string;
  lsl: string;
  onOutcomeChange: (value: string) => void;
  onFactorsChange: (factors: string[]) => void;
  onUslChange: (value: string) => void;
  onLslChange: (value: string) => void;
  onCancel: () => void;
  onContinue: () => void;
  // Performance mode props (hidden when enablePerformanceMode=false)
  enablePerformanceMode?: boolean;
  analysisMode?: 'standard' | 'performance';
  measureLabel?: string;
  channelCount?: number;
  onModeChange?: (mode: EntryMode) => void;
  onMeasureLabelChange?: (label: string) => void;
  onChannelCountChange?: (count: number) => void;
}

const ManualEntrySetupBase: React.FC<ManualEntrySetupBaseProps> = ({
  outcomeName,
  factors,
  usl,
  lsl,
  onOutcomeChange,
  onFactorsChange,
  onUslChange,
  onLslChange,
  onCancel,
  onContinue,
  enablePerformanceMode = false,
  analysisMode = 'standard',
  measureLabel = 'Head',
  channelCount = 8,
  onModeChange,
  onMeasureLabelChange,
  onChannelCountChange,
}) => {
  const { t, tf } = useTranslation();
  // Local state for mode toggle if parent doesn't control it
  const [localMode, setLocalMode] = useState<EntryMode>(
    analysisMode === 'performance' ? 'performance' : 'standard'
  );

  const mode =
    enablePerformanceMode && analysisMode === 'performance'
      ? 'performance'
      : enablePerformanceMode
        ? localMode
        : 'standard';

  const handleModeChange = (newMode: EntryMode) => {
    setLocalMode(newMode);
    onModeChange?.(newMode);
  };

  const addFactor = () => onFactorsChange([...factors, `Factor ${factors.length + 1}`]);
  const removeFactor = (idx: number) => onFactorsChange(factors.filter((_, i) => i !== idx));
  const updateFactor = (idx: number, val: string) => {
    const newFactors = [...factors];
    newFactors[idx] = val;
    onFactorsChange(newFactors);
  };

  // Generate preview of column names for Performance Mode
  const columnPreview = useMemo(() => {
    if (mode !== 'performance') return '';
    const count = Math.min(Math.max(channelCount, 3), 20);
    const cols = Array.from({ length: Math.min(count, 5) }, (_, i) => `${measureLabel} ${i + 1}`);
    if (count > 5) {
      cols.push('...');
      cols.push(`${measureLabel} ${count}`);
    }
    return cols.join(', ');
  }, [mode, measureLabel, channelCount]);

  // Validate Performance Mode configuration
  const isPerformanceValid =
    mode === 'performance' && measureLabel.trim() !== '' && channelCount >= 3 && channelCount <= 20;

  // Validate Standard Mode configuration
  const isStandardValid = mode === 'standard' && outcomeName.trim() !== '';

  const canContinue = mode === 'performance' ? isPerformanceValid : isStandardValid;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-content p-8">
      <div className="w-full max-w-lg bg-surface-secondary rounded-xl border border-edge p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-content mb-6">{t('manual.setupTitle')}</h2>

        {/* Mode Toggle — only shown when enablePerformanceMode is true */}
        {enablePerformanceMode && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-content-secondary mb-3">
              {t('manual.analysisMode')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleModeChange('standard')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === 'standard'
                    ? 'border-blue-500 bg-blue-900/20 text-content'
                    : 'border-edge bg-surface hover:bg-surface-tertiary text-content-secondary'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      mode === 'standard' ? 'border-blue-500' : 'border-content-muted'
                    }`}
                  >
                    {mode === 'standard' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <span className="font-semibold text-sm">{t('manual.standard')}</span>
                </div>
                <p className="text-xs text-content-muted pl-6">{t('manual.standardDesc')}</p>
              </button>
              <button
                onClick={() => handleModeChange('performance')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === 'performance'
                    ? 'border-blue-500 bg-blue-900/20 text-content'
                    : 'border-edge bg-surface hover:bg-surface-tertiary text-content-secondary'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      mode === 'performance' ? 'border-blue-500' : 'border-content-muted'
                    }`}
                  >
                    {mode === 'performance' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <span className="font-semibold text-sm">{t('manual.performance')}</span>
                </div>
                <p className="text-xs text-content-muted pl-6">{t('manual.performanceDesc')}</p>
              </button>
            </div>
          </div>
        )}

        {/* Standard Mode Configuration */}
        {mode === 'standard' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-content-secondary mb-2">
                {t('manual.outcome')}
              </label>
              <input
                type="text"
                className="w-full bg-surface border border-edge rounded-lg px-4 py-2 text-content focus:ring-2 focus:ring-blue-500 outline-none"
                value={outcomeName}
                onChange={e => onOutcomeChange(e.target.value)}
                placeholder={t('manual.outcomeExample')}
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-content-secondary">
                  {t('manual.factors')}
                </label>
                <button
                  onClick={addFactor}
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                >
                  <Plus size={14} /> {t('manual.addFactor')}
                </button>
              </div>
              <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
                {factors.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-surface border border-edge rounded-lg px-4 py-2 text-content text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={f}
                      onChange={e => updateFactor(i, e.target.value)}
                      placeholder={`Factor ${i + 1}`}
                    />
                    {factors.length > 1 && (
                      <button
                        onClick={() => removeFactor(i)}
                        className="text-content-muted hover:text-red-400 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Performance Mode Configuration */}
        {mode === 'performance' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-content-secondary mb-2">
                {t('manual.measureLabel')}
              </label>
              <input
                type="text"
                className="w-full bg-surface border border-edge rounded-lg px-4 py-2 text-content focus:ring-2 focus:ring-blue-500 outline-none"
                value={measureLabel}
                onChange={e => onMeasureLabelChange?.(e.target.value)}
                placeholder={t('manual.measureExample')}
              />
              <p className="text-xs text-content-muted mt-1">{t('manual.measureLabel')}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-content-secondary mb-2">
                {t('manual.channelCount')}
              </label>
              <input
                type="number"
                min={3}
                max={20}
                className="w-full bg-surface border border-edge rounded-lg px-4 py-2 text-content focus:ring-2 focus:ring-blue-500 outline-none"
                value={channelCount}
                onChange={e => onChannelCountChange?.(parseInt(e.target.value) || 3)}
              />
              <p className="text-xs text-content-muted mt-1">
                {tf('manual.channelRange', { min: 3, max: 20 })}
              </p>
            </div>

            {/* Column Preview */}
            <div className="mb-6 p-3 bg-surface rounded-lg border border-edge">
              <label className="block text-xs font-semibold text-content-muted mb-1">
                Columns will be:
              </label>
              <p className="text-sm text-blue-400 font-mono">{columnPreview}</p>
            </div>
          </>
        )}

        {/* Spec Limits - shown for both modes */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-content-secondary mb-2">
            {t('manual.specs')}{' '}
            {mode === 'performance' && (
              <span className="text-content-muted font-normal">({t('manual.specsApplyAll')})</span>
            )}
          </label>
          <p className="text-xs text-content-muted mb-3">{t('manual.specsHelper')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-content-muted mb-1">Lower (LSL)</label>
              <input
                type="number"
                className="w-full bg-surface border border-edge rounded-lg px-4 py-2 text-content text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={lsl}
                onChange={e => onLslChange(e.target.value)}
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs text-content-muted mb-1">Upper (USL)</label>
              <input
                type="number"
                className="w-full bg-surface border border-edge rounded-lg px-4 py-2 text-content text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={usl}
                onChange={e => onUslChange(e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-edge">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg border border-edge-secondary text-content hover:bg-surface-tertiary transition"
          >
            {t('action.cancel')}
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-surface-tertiary disabled:text-content-muted text-white font-semibold rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20"
          >
            {t('manual.startEntry')} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualEntrySetupBase;
