import React, { useEffect, useState } from 'react';
import { Network, X } from 'lucide-react';

const SESSION_KEY = 'variscout_investigation_prompt_dismissed';

export interface InvestigationPromptColorScheme {
  bg: string;
  border: string;
  text: string;
  mutedText: string;
  dismissText: string;
}

export const investigationPromptDefaultColorScheme: InvestigationPromptColorScheme = {
  bg: 'bg-blue-500/10',
  border: 'border-blue-500/20',
  text: 'text-blue-300',
  mutedText: 'text-content-secondary',
  dismissText: 'text-content-muted hover:text-content-secondary',
};

export interface InvestigationPromptProps {
  /** Current number of applied filters */
  filterCount: number;
  /** Whether the mindmap panel is already open */
  isMindmapOpen: boolean;
  /** Open the mindmap panel */
  onOpenMindmap: () => void;
  /** Color scheme */
  colorScheme?: InvestigationPromptColorScheme;
}

/**
 * A one-time subtle callout shown when the user applies their first filter,
 * pointing them to the Investigation panel.
 *
 * Dismissed once per session via sessionStorage.
 */
const InvestigationPrompt: React.FC<InvestigationPromptProps> = ({
  filterCount,
  isMindmapOpen,
  onOpenMindmap,
  colorScheme = investigationPromptDefaultColorScheme,
}) => {
  const c = colorScheme;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (filterCount === 1 && !dismissed && !isMindmapOpen) {
      setVisible(true);
    }
  }, [filterCount, dismissed, isMindmapOpen]);

  // Auto-hide if mindmap is opened
  useEffect(() => {
    if (isMindmapOpen && visible) {
      handleDismiss();
    }
  }, [isMindmapOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // sessionStorage unavailable
    }
  };

  const handleOpen = () => {
    onOpenMindmap();
    handleDismiss();
  };

  if (!visible) return null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 ${c.bg} border ${c.border} rounded-lg mx-4 mt-2 animate-fade-in`}
      role="status"
      aria-live="polite"
    >
      <Network size={16} className={c.text} />
      <div className="flex-1 min-w-0">
        <span className={`text-xs ${c.mutedText}`}>
          Tracking your investigation &mdash;{' '}
          <button
            onClick={handleOpen}
            className={`${c.text} underline underline-offset-2 font-medium`}
          >
            open the Investigation panel
          </button>{' '}
          to see the full picture.
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className={`p-1 rounded ${c.dismissText} transition-colors flex-shrink-0`}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default InvestigationPrompt;
