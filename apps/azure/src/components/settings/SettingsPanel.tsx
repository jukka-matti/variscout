import React from 'react';
import { X, Palette } from 'lucide-react';
import { SettingsPanelBase } from '@variscout/ui';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import ThemeToggle from './ThemeToggle';

const ACCENT_PRESETS = [
  '#3b82f6', // blue (default)
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { displayOptions, setDisplayOptions } = useData();

  return (
    <SettingsPanelBase
      isOpen={isOpen}
      onClose={onClose}
      displayOptions={displayOptions}
      setDisplayOptions={setDisplayOptions}
      chartFontScale={theme.chartFontScale ?? 'normal'}
      onChartFontScaleChange={scale => setTheme({ chartFontScale: scale })}
      idPrefix="az-setting"
      headerSections={
        <>
          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-medium text-content mb-3">Appearance</h3>
            <ThemeToggle />
          </section>

          {/* Company Accent Color */}
          <section>
            <h3 className="text-sm font-medium text-content mb-3 flex items-center gap-2">
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
                      : 'border-edge-secondary hover:border-edge-secondary'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Set accent color to ${color}`}
                />
              ))}
              <button
                onClick={() => setTheme({ companyAccent: undefined })}
                className={`w-8 h-8 rounded-lg border-2 text-xs text-content-secondary transition-all ${
                  !theme.companyAccent
                    ? 'border-white bg-surface-tertiary'
                    : 'border-edge-secondary bg-surface-secondary hover:border-edge-secondary'
                }`}
                aria-label="Reset accent color"
                title="Reset to default"
              >
                <X size={12} className="mx-auto" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                id="az-setting-accent-color"
                name="az-setting-accent-color"
                type="color"
                value={theme.companyAccent || '#3b82f6'}
                onChange={e => setTheme({ companyAccent: e.target.value })}
                className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                aria-label="Custom accent color"
              />
              <label htmlFor="az-setting-accent-color" className="text-xs text-content-secondary">
                Custom color
              </label>
            </div>
          </section>
        </>
      }
      extraToggles={
        <>
          <label
            htmlFor="az-setting-show-specs"
            className="flex items-start gap-3 cursor-pointer group"
          >
            <input
              id="az-setting-show-specs"
              name="az-setting-show-specs"
              type="checkbox"
              checked={displayOptions.showSpecs !== false}
              onChange={e => setDisplayOptions({ ...displayOptions, showSpecs: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface-secondary text-blue-500 focus:ring-blue-500 focus:ring-offset-surface"
            />
            <div>
              <span className="text-sm text-content group-hover:text-content transition-colors block">
                Show specification limits on I-Chart
              </span>
              <span className="text-xs text-content-muted">
                Display USL/LSL lines when spec limits are set
              </span>
            </div>
          </label>
          <label
            htmlFor="az-setting-show-cpk"
            className="flex items-start gap-3 cursor-pointer group"
          >
            <input
              id="az-setting-show-cpk"
              name="az-setting-show-cpk"
              type="checkbox"
              checked={displayOptions.showCpk !== false}
              onChange={e => setDisplayOptions({ ...displayOptions, showCpk: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface-secondary text-blue-500 focus:ring-blue-500 focus:ring-offset-surface"
            />
            <div>
              <span className="text-sm text-content group-hover:text-content transition-colors block">
                Show Cpk values in stats
              </span>
              <span className="text-xs text-content-muted">
                Display process capability index in the stats panel
              </span>
            </div>
          </label>
        </>
      }
    />
  );
};

export default SettingsPanel;
