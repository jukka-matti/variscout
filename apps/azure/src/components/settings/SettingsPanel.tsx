import React, { useState } from 'react';
import { X, Palette } from 'lucide-react';
import { SettingsPanelBase, ProcessDescriptionField, PreviewBadge } from '@variscout/ui';
import { isTeamAIPlan, isPreviewEnabled, setPreviewEnabled } from '@variscout/core';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import ThemeToggle from './ThemeToggle';
import { isAIAvailable } from '../../services/aiService';

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
  const [, setForceUpdate] = useState(0);
  const { theme, setTheme } = useTheme();
  const {
    displayOptions,
    setDisplayOptions,
    processContext,
    setProcessContext,
    aiEnabled,
    setAIEnabled,
    aiPreferences,
    setAIPreferences,
  } = useData();

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
          {isAIAvailable() && (
            <div className="space-y-3 pt-3 border-t border-edge">
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                AI Assistance
              </h3>
              <label
                htmlFor="az-setting-ai-narration"
                className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer"
              >
                <input
                  id="az-setting-ai-narration"
                  name="az-setting-ai-narration"
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={e => setAIEnabled(e.target.checked)}
                  className="rounded border-edge"
                />
                Show AI narration
              </label>
              {aiEnabled && (
                <>
                  <div className="ml-6 space-y-2">
                    <label
                      htmlFor="az-setting-ai-narration-toggle"
                      className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer"
                    >
                      <input
                        id="az-setting-ai-narration-toggle"
                        name="az-setting-ai-narration-toggle"
                        type="checkbox"
                        checked={aiPreferences.narration}
                        onChange={e =>
                          setAIPreferences({ ...aiPreferences, narration: e.target.checked })
                        }
                        className="rounded border-edge"
                      />
                      Narrative summary
                    </label>
                    <label
                      htmlFor="az-setting-ai-insights-toggle"
                      className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer"
                    >
                      <input
                        id="az-setting-ai-insights-toggle"
                        name="az-setting-ai-insights-toggle"
                        type="checkbox"
                        checked={aiPreferences.insights}
                        onChange={e =>
                          setAIPreferences({ ...aiPreferences, insights: e.target.checked })
                        }
                        className="rounded border-edge"
                      />
                      Chart insights
                    </label>
                    <label
                      htmlFor="az-setting-ai-coscout-toggle"
                      className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer"
                    >
                      <input
                        id="az-setting-ai-coscout-toggle"
                        name="az-setting-ai-coscout-toggle"
                        type="checkbox"
                        checked={aiPreferences.coscout}
                        onChange={e =>
                          setAIPreferences({ ...aiPreferences, coscout: e.target.checked })
                        }
                        className="rounded border-edge"
                      />
                      CoScout assistant
                    </label>
                  </div>
                  <div>
                    <label className="text-[11px] text-content-muted mb-1 block">
                      Process Description
                    </label>
                    <ProcessDescriptionField
                      value={processContext.description || ''}
                      onChange={value =>
                        setProcessContext({ ...processContext, description: value })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}
          {isTeamAIPlan() && (
            <div className="space-y-3 pt-3 border-t border-edge">
              <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Preview Features
              </h3>
              <label
                htmlFor="az-setting-preview-kb"
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  id="az-setting-preview-kb"
                  name="az-setting-preview-kb"
                  type="checkbox"
                  checked={isPreviewEnabled('knowledge-base')}
                  onChange={e => {
                    setPreviewEnabled('knowledge-base', e.target.checked);
                    setForceUpdate(prev => prev + 1);
                  }}
                  className="rounded border-edge"
                />
                <span className="text-sm text-content">Knowledge Base</span>
                <PreviewBadge />
              </label>
              <p className="text-xs text-content-muted">
                Search past findings across your organization when using CoScout. Requires Azure AI
                Search (configured by your admin).
              </p>
            </div>
          )}
        </>
      }
    />
  );
};

export default SettingsPanel;
