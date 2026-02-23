import React from 'react';

type MindmapMode = 'drilldown' | 'interactions' | 'narrative';

export interface MindmapModeToggleProps {
  mode: MindmapMode;
  setMode: (mode: MindmapMode) => void;
  /** Background class for toggle container */
  toggleBg: string;
  /** Class for inactive button text */
  inactiveText: string;
}

/**
 * Shared three-button mode toggle for Investigation Mindmap.
 * Used by MindmapPanelContent and MindmapWindow.
 */
const MindmapModeToggle: React.FC<MindmapModeToggleProps> = ({
  mode,
  setMode,
  toggleBg,
  inactiveText,
}) => (
  <div className={`flex items-center gap-0.5 ${toggleBg} rounded-lg p-0.5`}>
    <button
      onClick={() => setMode('drilldown')}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
        mode === 'drilldown' ? 'bg-blue-500/20 text-blue-400' : inactiveText
      }`}
    >
      Drilldown
    </button>
    <button
      onClick={() => setMode('interactions')}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
        mode === 'interactions' ? 'bg-amber-500/20 text-amber-400' : inactiveText
      }`}
    >
      Interactions
    </button>
    <button
      onClick={() => setMode('narrative')}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
        mode === 'narrative' ? 'bg-green-500/20 text-green-400' : inactiveText
      }`}
    >
      Narrative
    </button>
  </div>
);

export default MindmapModeToggle;
