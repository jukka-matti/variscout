import React, { useState } from 'react';
import { FolderOpen, ExternalLink } from 'lucide-react';
import { FileBrowseButton, type FilePickerResult } from '../FileBrowseButton';
import { SettingsPanelBase, ProcessDescriptionField, PreviewBadge } from '@variscout/ui';
import { isTeamAIPlan, isPreviewEnabled, setPreviewEnabled } from '@variscout/core';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import ThemeToggle from './ThemeToggle';
import { isAIAvailable } from '../../services/aiService';
import { getCachedChannelFolderUrl } from '../../services/channelDrive';

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
    knowledgeSearchFolder,
    setKnowledgeSearchFolder,
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
        <section>
          <h3 className="text-sm font-medium text-content mb-3">Appearance</h3>
          <ThemeToggle />
        </section>
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
                Search your team's SharePoint documents from CoScout. Requires Azure AI Search
                (configured by your admin).
              </p>

              {/* Knowledge Base search scope (ADR-026) */}
              {isPreviewEnabled('knowledge-base') && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-xs font-medium text-content-secondary flex items-center gap-1.5">
                    <FolderOpen size={12} />
                    Search scope
                  </h4>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="az-setting-kb-scope-channel"
                      className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer"
                    >
                      <input
                        id="az-setting-kb-scope-channel"
                        name="az-setting-kb-scope"
                        type="radio"
                        checked={!knowledgeSearchFolder}
                        onChange={() => setKnowledgeSearchFolder(undefined)}
                        className="border-edge"
                      />
                      Channel folder (default)
                    </label>
                    <label
                      htmlFor="az-setting-kb-scope-custom"
                      className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer"
                    >
                      <input
                        id="az-setting-kb-scope-custom"
                        name="az-setting-kb-scope"
                        type="radio"
                        checked={!!knowledgeSearchFolder}
                        onChange={() => setKnowledgeSearchFolder('')}
                        className="border-edge"
                      />
                      Custom folder
                    </label>
                  </div>
                  {knowledgeSearchFolder !== undefined && (
                    <div className="space-y-2">
                      {knowledgeSearchFolder && (
                        <div className="flex items-center gap-1.5 text-xs text-content-secondary bg-surface-tertiary rounded px-2.5 py-1.5">
                          <FolderOpen size={12} className="flex-shrink-0" />
                          <span className="truncate" title={knowledgeSearchFolder}>
                            {knowledgeSearchFolder.split('/').pop() || knowledgeSearchFolder}
                          </span>
                        </div>
                      )}
                      <FileBrowseButton
                        mode="folders"
                        onPick={(items: FilePickerResult[]) =>
                          setKnowledgeSearchFolder(items[0]?.webUrl ?? '')
                        }
                        label="Browse SharePoint"
                        size="sm"
                      />
                      <details className="text-[10px]">
                        <summary className="text-content-muted cursor-pointer hover:text-content-secondary">
                          Enter URL manually
                        </summary>
                        <input
                          id="az-setting-kb-folder-path"
                          name="az-setting-kb-folder-path"
                          type="text"
                          value={knowledgeSearchFolder}
                          onChange={e => setKnowledgeSearchFolder(e.target.value)}
                          placeholder="https://contoso.sharepoint.com/sites/QualityTeam/..."
                          className="w-full mt-1 text-xs px-2.5 py-1.5 rounded border border-edge bg-surface-secondary text-content placeholder:text-content-muted focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </details>
                    </div>
                  )}
                  <p className="text-[11px] text-content-muted">
                    Only documents you have access to will appear in search results.
                  </p>
                  {(() => {
                    const folderUrl = knowledgeSearchFolder || getCachedChannelFolderUrl();
                    return folderUrl ? (
                      <a
                        href={folderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 mt-1"
                      >
                        <ExternalLink size={10} />
                        Open folder in SharePoint
                      </a>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}
        </>
      }
    />
  );
};

export default SettingsPanel;
