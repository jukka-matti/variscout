import React from 'react';

type MindmapMode = 'drilldown' | 'interactions' | 'narrative';

export interface MindmapModeToggleProps {
  mode: MindmapMode;
  setMode: (mode: MindmapMode) => void;
  /** Background class for toggle container */
  toggleBg: string;
  /** Class for inactive button text */
  inactiveText: string;
  /** Number of factors in the dataset (enables Interactions at >= 2) */
  factorCount?: number;
  /** Number of drill steps applied (enables Narrative at >= 1) */
  drillCount?: number;
  /** Number of data rows (Interactions needs n >= 5) */
  dataCount?: number;
}

interface ModeConfig {
  id: MindmapMode;
  label: string;
  subtitle: string;
  activeClasses: string;
  isEnabled: boolean;
  disabledReason: string | null;
}

/**
 * Shared three-button mode toggle for Investigation Mindmap.
 * Used by MindmapPanelContent and MindmapWindow.
 *
 * Mode availability:
 * - Drilldown: Always available (default)
 * - Interactions: Enabled after 2+ factors exist AND n >= 5
 * - Narrative: Enabled after at least 1 drill has been applied
 */
const MindmapModeToggle: React.FC<MindmapModeToggleProps> = ({
  mode,
  setMode,
  toggleBg,
  inactiveText,
  factorCount = 10,
  drillCount = 10,
  dataCount = 100,
}) => {
  const modes: ModeConfig[] = [
    {
      id: 'drilldown',
      label: 'Drilldown',
      subtitle: 'Explore factors',
      activeClasses: 'bg-blue-500/20 text-blue-400',
      isEnabled: true,
      disabledReason: null,
    },
    {
      id: 'interactions',
      label: 'Interactions',
      subtitle: 'Check relationships',
      activeClasses: 'bg-amber-500/20 text-amber-400',
      isEnabled: factorCount >= 2 && dataCount >= 5,
      disabledReason:
        factorCount < 2
          ? 'Need 2+ factors to check interactions'
          : dataCount < 5
            ? 'Need 5+ data points for interaction analysis'
            : null,
    },
    {
      id: 'narrative',
      label: 'Narrative',
      subtitle: 'Tell the story',
      activeClasses: 'bg-green-500/20 text-green-400',
      isEnabled: drillCount >= 1,
      disabledReason: drillCount < 1 ? 'Drill into a factor to unlock' : null,
    },
  ];

  return (
    <div className={`flex items-center gap-0.5 ${toggleBg} rounded-lg p-0.5`}>
      {modes.map(m => {
        const isActive = mode === m.id;
        const canClick = m.isEnabled && !isActive;

        return (
          <button
            key={m.id}
            onClick={canClick ? () => setMode(m.id) : undefined}
            disabled={!m.isEnabled}
            title={m.isEnabled ? m.subtitle : (m.disabledReason ?? undefined)}
            aria-label={`${m.label}: ${m.isEnabled ? m.subtitle : m.disabledReason}`}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              isActive
                ? m.activeClasses
                : m.isEnabled
                  ? inactiveText
                  : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
};

export default MindmapModeToggle;
