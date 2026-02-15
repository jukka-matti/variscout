import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import type { DrillStep } from '@variscout/hooks';

/**
 * Color scheme for MindmapPanelContent
 */
export interface MindmapPanelColorScheme {
  /** Mode toggle container background */
  toggleBg: string;
  /** Inactive mode button text */
  inactiveText: string;
  /** Action button base text */
  actionButtonText: string;
  /** Action button hover background */
  actionButtonHoverBg: string;
  /** Border color */
  border: string;
  /** Muted text (drill path label, arrow separator) */
  mutedText: string;
}

export const mindmapPanelDefaultColorScheme: MindmapPanelColorScheme = {
  toggleBg: 'bg-surface',
  inactiveText: 'text-content-secondary hover:text-white',
  actionButtonText: 'text-content-secondary',
  actionButtonHoverBg: 'hover:bg-surface-tertiary',
  border: 'border-edge',
  mutedText: 'text-content-muted',
};

export const mindmapPanelAzureColorScheme: MindmapPanelColorScheme = {
  toggleBg: 'bg-slate-900',
  inactiveText: 'text-slate-400 hover:text-white',
  actionButtonText: 'text-slate-400',
  actionButtonHoverBg: 'hover:bg-slate-700',
  border: 'border-slate-700',
  mutedText: 'text-slate-500',
};

type MindmapMode = 'drilldown' | 'interactions' | 'narrative';

export interface MindmapPanelContentProps {
  /** Current mode */
  mode: MindmapMode;
  /** Set mode callback */
  setMode: (mode: MindmapMode) => void;
  /** Drill path for footer */
  drillPath: DrillStep[];
  /** Close callback */
  onClose: () => void;
  /** Open popout callback (optional) */
  onOpenPopout?: () => void;
  /** Export PNG callback */
  onExportPng: () => void;
  /** Chart area content */
  children: React.ReactNode;
  /** Color scheme */
  colorScheme?: MindmapPanelColorScheme;
  /** Column aliases for display names */
  columnAliases?: Record<string, string>;
}

/**
 * Shared inner content for MindmapPanel
 *
 * Renders the header (title + mode toggle + action buttons),
 * chart area (via children), and drill path footer.
 * Layout wrapping (fixed overlay vs inline flex) is handled by the app.
 */
const MindmapPanelContent: React.FC<MindmapPanelContentProps> = ({
  mode,
  setMode,
  drillPath,
  onClose,
  onOpenPopout,
  onExportPng,
  children,
  colorScheme = mindmapPanelDefaultColorScheme,
  columnAliases,
}) => {
  const c = colorScheme;

  return (
    <>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${c.border}`}>
        <h2 className="text-sm font-semibold text-white">Investigation</h2>

        {/* Mode toggle */}
        <div className={`flex items-center gap-0.5 ${c.toggleBg} rounded-lg p-0.5`}>
          <button
            onClick={() => setMode('drilldown')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              mode === 'drilldown' ? 'bg-blue-500/20 text-blue-400' : c.inactiveText
            }`}
          >
            Drilldown
          </button>
          <button
            onClick={() => setMode('interactions')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              mode === 'interactions' ? 'bg-amber-500/20 text-amber-400' : c.inactiveText
            }`}
          >
            Interactions
          </button>
          <button
            onClick={() => setMode('narrative')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              mode === 'narrative' ? 'bg-green-500/20 text-green-400' : c.inactiveText
            }`}
          >
            Narrative
          </button>
        </div>

        <div className="flex items-center gap-1">
          {mode === 'narrative' && (
            <button
              onClick={onExportPng}
              className={`p-1.5 ${c.actionButtonText} hover:text-white ${c.actionButtonHoverBg} rounded-lg transition-colors`}
              title="Export as PNG"
              aria-label="Export as PNG"
            >
              <Download size={14} />
            </button>
          )}
          {onOpenPopout && (
            <button
              onClick={onOpenPopout}
              className={`p-1.5 ${c.actionButtonText} hover:text-white ${c.actionButtonHoverBg} rounded-lg transition-colors`}
              title="Open in new window"
              aria-label="Open in new window"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className={`p-1.5 ${c.actionButtonText} hover:text-white ${c.actionButtonHoverBg} rounded-lg transition-colors`}
            title="Close"
            aria-label="Close investigation panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Chart area */}
      {children}

      {/* Drill path summary */}
      {drillPath.length > 0 && (
        <div className={`px-4 py-3 border-t ${c.border}`}>
          <div className={`text-[10px] ${c.mutedText} uppercase tracking-wider mb-1.5`}>
            Drill Path
          </div>
          <div className="flex flex-wrap gap-1">
            {drillPath.map((step, i) => (
              <span
                key={step.factor}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[11px] rounded-full"
              >
                {columnAliases?.[step.factor] || step.factor}
                <span className="text-blue-300/60">{(step.etaSquared * 100).toFixed(0)}%</span>
                {i < drillPath.length - 1 && (
                  <span className={`${c.mutedText} ml-0.5`}>&rarr;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MindmapPanelContent;
