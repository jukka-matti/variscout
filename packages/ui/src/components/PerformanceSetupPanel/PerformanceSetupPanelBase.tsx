import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Activity, AlertTriangle, RefreshCw, Settings, X, Info } from 'lucide-react';
import { MeasureColumnSelector } from '../MeasureColumnSelector';
import { UpgradePrompt } from '../UpgradePrompt';
import type { ChannelInfo, LicenseTier } from '@variscout/core';

/**
 * Color scheme for PerformanceSetupPanel component
 */
export interface PerformanceSetupPanelColorScheme {
  /** Container/panel background (e.g., 'bg-slate-900' or 'bg-surface') */
  containerBg: string;
  /** Secondary background (e.g., 'bg-slate-700' or 'bg-surface-secondary') */
  secondaryBg: string;
  /** Border color (e.g., 'border-slate-700' or 'border-edge') */
  border: string;
  /** Primary text (e.g., 'text-slate-200' or 'text-content') */
  textPrimary: string;
  /** Secondary text (e.g., 'text-slate-400' or 'text-content-secondary') */
  textSecondary: string;
  /** Muted text (e.g., 'text-slate-500' or 'text-content-muted') */
  textMuted: string;
  /** Input background (e.g., 'bg-slate-700' or 'bg-surface-secondary') */
  inputBg: string;
  /** Input border (e.g., 'border-slate-600' or 'border-edge') */
  inputBorder: string;
  /** Input placeholder (e.g., 'placeholder-slate-500' or 'placeholder-content-muted') */
  inputPlaceholder: string;
  /** Hover background (e.g., 'hover:bg-slate-700' or 'hover:bg-surface-tertiary') */
  hoverBg: string;
}

/**
 * Default color scheme using semantic tokens (theme-aware)
 */
export const defaultColorScheme: PerformanceSetupPanelColorScheme = {
  containerBg: 'bg-surface',
  secondaryBg: 'bg-surface-secondary',
  border: 'border-edge',
  textPrimary: 'text-content',
  textSecondary: 'text-content-secondary',
  textMuted: 'text-content-muted',
  inputBg: 'bg-surface-secondary',
  inputBorder: 'border-edge',
  inputPlaceholder: 'placeholder-content-muted',
  hoverBg: 'hover:bg-surface-tertiary',
};

/**
 * PWA color scheme using semantic tokens
 */
export const pwaColorScheme: PerformanceSetupPanelColorScheme = {
  containerBg: 'bg-surface',
  secondaryBg: 'bg-surface-secondary',
  border: 'border-edge',
  textPrimary: 'text-content',
  textSecondary: 'text-content-secondary',
  textMuted: 'text-content-muted',
  inputBg: 'bg-surface-secondary',
  inputBorder: 'border-edge',
  inputPlaceholder: 'placeholder-content-muted',
  hoverBg: 'hover:bg-surface-tertiary',
};

/**
 * Channel validation result from tier system
 */
export interface ChannelValidation {
  /** Whether the channel limit is exceeded */
  exceeded: boolean;
  /** Current channel count */
  current: number;
  /** Maximum allowed channels */
  max: number;
  /** Whether to show performance warning (soft limit) */
  showWarning?: boolean;
}

/**
 * Tier-related props for PerformanceSetupPanelBase
 */
export interface TierProps {
  /** Current tier (free, individual, team, enterprise) */
  tier: LicenseTier;
  /** Maximum channels allowed for tier */
  maxChannels: number;
  /** URL for upgrade flow */
  upgradeUrl: string;
  /** Function to validate channel count */
  validateChannels: (count: number) => ChannelValidation;
}

export interface PerformanceSetupPanelBaseProps {
  /** 'inline' for PerformanceDashboard, 'modal' for dialog */
  variant?: 'inline' | 'modal';
  /** Available numeric columns from data */
  availableColumns: ChannelInfo[];
  /** Whether data is loaded */
  hasData: boolean;
  /** Whether specs are defined (USL or LSL) */
  hasSpecs: boolean;
  /** Initial selection (for modal) */
  initialSelection?: string[];
  /** Initial label (for modal) */
  initialLabel?: string;
  /** Initial Cpk target value */
  initialCpkTarget?: number;
  /** Callback when setup is confirmed */
  onEnable: (columns: string[], label: string, cpkTarget: number) => void;
  /** Callback when cancelled (modal only) */
  onCancel?: () => void;
  /** Callback to navigate to settings */
  onOpenSettings?: () => void;
  /** Color scheme for styling */
  colorScheme?: PerformanceSetupPanelColorScheme;
  /** Tier-related props (optional - for Azure) */
  tierProps?: TierProps;
}

/**
 * Base component for Performance Mode setup panel
 *
 * Renders the setup UI for configuring multi-measure analysis.
 * Tier validation and context data are provided via props.
 *
 * @example
 * ```tsx
 * // Basic usage (PWA - no tier)
 * <PerformanceSetupPanelBase
 *   variant="inline"
 *   availableColumns={columns}
 *   hasData={true}
 *   hasSpecs={true}
 *   onEnable={(cols, label, target) => { ... }}
 *   colorScheme={pwaColorScheme}
 * />
 *
 * // With tier validation (Azure)
 * <PerformanceSetupPanelBase
 *   variant="inline"
 *   availableColumns={columns}
 *   hasData={true}
 *   hasSpecs={true}
 *   onEnable={(cols, label, target) => { ... }}
 *   tierProps={{ tier, maxChannels, upgradeUrl, validateChannels }}
 * />
 * ```
 */
const PerformanceSetupPanelBase: React.FC<PerformanceSetupPanelBaseProps> = ({
  variant = 'inline',
  availableColumns,
  hasData,
  hasSpecs,
  initialSelection,
  initialLabel,
  initialCpkTarget,
  onEnable,
  onCancel,
  onOpenSettings,
  colorScheme = defaultColorScheme,
  tierProps,
}) => {
  // Local state for editing
  const [selectedColumns, setSelectedColumns] = useState<string[]>(initialSelection ?? []);
  const [label, setLabel] = useState(initialLabel ?? 'Measure');
  const [targetValue, setTargetValue] = useState(initialCpkTarget ?? 1.33);

  // Auto-select matched columns on first render if nothing selected
  useEffect(() => {
    if (selectedColumns.length === 0 && availableColumns.length > 0) {
      const matched = availableColumns.filter(c => c.matchedPattern).map(c => c.id);
      if (matched.length >= 3) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time auto-selection when columns become available and none selected
        setSelectedColumns(matched);
      }
    }
  }, [availableColumns, selectedColumns.length]);

  // Tier-based channel limit validation (if tier props provided)
  const channelValidation = useMemo<ChannelValidation | null>(() => {
    if (!tierProps) return null;
    return tierProps.validateChannels(selectedColumns.length);
  }, [selectedColumns.length, tierProps]);

  const isValid =
    selectedColumns.length >= 3 && (!channelValidation || !channelValidation.exceeded);

  const handleRedetect = useCallback(() => {
    const matched = availableColumns.filter(c => c.matchedPattern).map(c => c.id);
    setSelectedColumns(matched.length >= 3 ? matched : availableColumns.map(c => c.id));
  }, [availableColumns]);

  const handleEnable = useCallback(() => {
    onEnable(selectedColumns, label, targetValue);
  }, [selectedColumns, label, targetValue, onEnable]);

  // No data loaded
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Activity className={`w-12 h-12 ${colorScheme.textMuted} mb-4`} />
        <h2 className={`text-xl font-semibold ${colorScheme.textPrimary} mb-2`}>
          Performance Mode
        </h2>
        <p className={`${colorScheme.textSecondary} max-w-md mb-4`}>
          Load data with multiple numeric columns to analyze multi-measure performance (e.g., fill
          heads, cavities, nozzles).
        </p>
      </div>
    );
  }

  // No numeric columns found
  if (availableColumns.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className={`text-xl font-semibold ${colorScheme.textPrimary} mb-2`}>
          Insufficient Numeric Columns
        </h2>
        <p className={`${colorScheme.textSecondary} max-w-md mb-4`}>
          Performance mode requires at least 3 numeric columns. Your data has{' '}
          {availableColumns.length} numeric column(s).
        </p>
        <p className={`${colorScheme.textMuted} text-sm`}>
          Load wide-format data with multiple measurement columns (e.g., H1, H2, H3... or Valve_1,
          Valve_2, etc.)
        </p>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Measure label input */}
      <div>
        <label className={`block text-sm font-medium ${colorScheme.textSecondary} mb-2`}>
          Measure Label
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g., Valve, Head, Nozzle"
            className={`flex-1 px-3 py-2 ${colorScheme.inputBg} border ${colorScheme.inputBorder} rounded-lg ${colorScheme.textPrimary} ${colorScheme.inputPlaceholder} focus:outline-none focus:border-blue-500 transition-colors`}
          />
          <span className={`text-xs ${colorScheme.textMuted} whitespace-nowrap`}>
            e.g., "{label} 1", "{label} 2"
          </span>
        </div>
        <p className={`text-xs ${colorScheme.textMuted} mt-1`}>
          Customize how measures are displayed in charts and summaries
        </p>
      </div>

      {/* Cpk Target input */}
      <div>
        <label className={`block text-sm font-medium ${colorScheme.textSecondary} mb-2`}>
          Cpk Target
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={targetValue}
            onChange={e => setTargetValue(Number(e.target.value) || 1.33)}
            min={0.5}
            max={3.0}
            step={0.01}
            className={`w-24 px-3 py-2 ${colorScheme.inputBg} border ${colorScheme.inputBorder} rounded-lg ${colorScheme.textPrimary} font-mono focus:outline-none focus:border-blue-500 transition-colors`}
          />
          <span className={`text-xs ${colorScheme.textMuted}`}>
            Target line shown on I-Chart (default: 1.33)
          </span>
        </div>
        <p className={`text-xs ${colorScheme.textMuted} mt-1`}>
          1.33 = ~63 PPM defects | 1.67 = ~1 PPM defects
        </p>
      </div>

      {/* Channel limit exceeded warning (tier validation) */}
      {tierProps && channelValidation?.exceeded && (
        <UpgradePrompt
          tier={tierProps.tier}
          feature="channel analysis"
          currentCount={channelValidation.current}
          maxAllowed={channelValidation.max}
          upgradeUrl={tierProps.upgradeUrl}
          variant="banner"
        />
      )}

      {/* Performance warning (soft limit at 700 channels) */}
      {channelValidation?.showWarning && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-600/10 border border-blue-600/30">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-300">Performance Advisory</p>
            <p className={`text-xs ${colorScheme.textSecondary} mt-1`}>
              Analyzing {selectedColumns.length} channels may affect browser performance. For
              smoother analysis, consider selecting fewer channels or analyzing in batches.
            </p>
          </div>
        </div>
      )}

      {/* Specs warning */}
      {!hasSpecs && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-600/10 border border-amber-600/30">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">No specification limits set</p>
            <p className={`text-xs ${colorScheme.textMuted} mt-1`}>
              Cpk calculation requires at least USL or LSL. You can still enable performance mode,
              but capability metrics won't be available.
            </p>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="text-xs text-amber-400 hover:text-amber-300 underline mt-2 flex items-center gap-1"
              >
                <Settings size={12} />
                Set specification limits
              </button>
            )}
          </div>
        </div>
      )}

      {/* Column selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${colorScheme.textSecondary}`}>
              Select Measure Columns
            </label>
            {tierProps && (
              <span className={`text-xs ${colorScheme.textMuted}`}>
                ({selectedColumns.length}/{tierProps.maxChannels} max)
              </span>
            )}
          </div>
          <button
            onClick={handleRedetect}
            className={`text-xs ${colorScheme.textMuted} hover:text-white flex items-center gap-1 transition-colors`}
          >
            <RefreshCw size={12} />
            Re-detect
          </button>
        </div>
        <MeasureColumnSelector
          availableColumns={availableColumns}
          selectedColumns={selectedColumns}
          onSelectionChange={setSelectedColumns}
          minColumns={3}
        />
      </div>
    </div>
  );

  // Inline variant (for PerformanceDashboard)
  if (variant === 'inline') {
    return (
      <div className="flex flex-col h-full p-6 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${colorScheme.textPrimary}`}>
              Configure Performance Mode
            </h2>
            <p className={`text-sm ${colorScheme.textSecondary}`}>
              Select which columns to analyze as measures
            </p>
          </div>
        </div>

        {content}

        <div className={`flex justify-end gap-3 mt-6 pt-4 border-t ${colorScheme.border}`}>
          <button
            onClick={handleEnable}
            disabled={!isValid}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Enable Performance Mode
          </button>
        </div>
      </div>
    );
  }

  // Modal variant
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${colorScheme.border}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Activity size={20} />
          </div>
          <h2 className={`text-lg font-bold ${colorScheme.textPrimary}`}>
            Configure Performance Mode
          </h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className={`${colorScheme.textSecondary} hover:${colorScheme.textPrimary} p-1 transition-colors`}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">{content}</div>

      {/* Footer */}
      <div className={`flex justify-end gap-3 p-4 border-t ${colorScheme.border}`}>
        {onCancel && (
          <button
            onClick={onCancel}
            className={`px-4 py-2 ${colorScheme.textSecondary} hover:${colorScheme.textPrimary} ${colorScheme.hoverBg} rounded-lg transition-colors`}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleEnable}
          disabled={!isValid}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enable
        </button>
      </div>
    </div>
  );
};

export default PerformanceSetupPanelBase;
