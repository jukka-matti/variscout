import React, { useState, useEffect } from 'react';
import { X, Palette } from 'lucide-react';
import { useTheme, CHART_FONT_SCALES, type ChartFontScale } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import ThemeToggle from './ThemeToggle';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCENT_PRESETS = [
  '#3b82f6', // blue (default)
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
];

const FONT_SCALE_OPTIONS: { value: ChartFontScale; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { displayOptions, setDisplayOptions } = useData();

  const [localDisplayOptions, setLocalDisplayOptions] = useState(displayOptions);

  useEffect(() => {
    if (isOpen) {
      setLocalDisplayOptions(displayOptions);
    }
  }, [isOpen, displayOptions]);

  useEffect(() => {
    if (isOpen && JSON.stringify(localDisplayOptions) !== JSON.stringify(displayOptions)) {
      setDisplayOptions(localDisplayOptions);
    }
  }, [localDisplayOptions, isOpen, setDisplayOptions, displayOptions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-80 h-full bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto">
        <div className="p-5 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>

          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Appearance</h3>
            <ThemeToggle />
          </section>

          {/* Company Accent Color */}
          <section>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Palette size={14} />
              Company Accent
            </h3>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map(color => (
                <button
                  key={color}
                  onClick={() => setTheme({ companyAccent: color })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    theme.companyAccent === color
                      ? 'border-white scale-110'
                      : 'border-slate-600 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Set accent color to ${color}`}
                />
              ))}
              {/* Reset */}
              <button
                onClick={() => setTheme({ companyAccent: undefined })}
                className={`w-8 h-8 rounded-lg border-2 text-xs text-slate-400 transition-all ${
                  !theme.companyAccent
                    ? 'border-white bg-slate-700'
                    : 'border-slate-600 bg-slate-800 hover:border-slate-400'
                }`}
                aria-label="Reset accent color"
                title="Reset to default"
              >
                <X size={12} className="mx-auto" />
              </button>
            </div>
            {/* Custom hex input */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="color"
                value={theme.companyAccent || '#3b82f6'}
                onChange={e => setTheme({ companyAccent: e.target.value })}
                className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                aria-label="Custom accent color"
              />
              <span className="text-xs text-slate-400">Custom color</span>
            </div>
          </section>

          {/* Display Preferences */}
          <section>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Display Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localDisplayOptions.lockYAxisToFullData !== false}
                  onChange={e =>
                    setLocalDisplayOptions({
                      ...localDisplayOptions,
                      lockYAxisToFullData: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors block">
                    Lock Y-axis when drilling
                  </span>
                  <span className="text-xs text-slate-500">
                    Maintains scale for visual comparison
                  </span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localDisplayOptions.showFilterContext !== false}
                  onChange={e =>
                    setLocalDisplayOptions({
                      ...localDisplayOptions,
                      showFilterContext: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors block">
                    Show filter context on charts
                  </span>
                  <span className="text-xs text-slate-500">
                    Include active filters when copying charts to clipboard
                  </span>
                </div>
              </label>
            </div>
          </section>

          {/* Chart Font Scale */}
          <section>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Chart Text Size</h3>
            <div className="flex gap-2">
              {FONT_SCALE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme({ chartFontScale: value })}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    (theme.chartFontScale ?? 'normal') === value
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {label}
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    {CHART_FONT_SCALES[value]}x
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
