import React, { useCallback, useEffect, useState } from 'react';
import { Network, X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

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
  /** Whether the findings panel is already open */
  isFindingsOpen: boolean;
  /** Open the findings panel */
  onOpenFindings: () => void;
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
  isFindingsOpen,
  onOpenFindings,
  colorScheme = investigationPromptDefaultColorScheme,
}) => {
  const { t } = useTranslation();
  const c = colorScheme;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [visible, setVisible] = useState(false);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  useEffect(() => {
    if (filterCount === 1 && !dismissed && !isFindingsOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show prompt when user first drills down
      setVisible(true);
    }
  }, [filterCount, dismissed, isFindingsOpen]);

  // Auto-hide if findings panel is opened
  useEffect(() => {
    if (isFindingsOpen && visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-dismiss when findings panel opens
      handleDismiss();
    }
  }, [isFindingsOpen, visible, handleDismiss]);

  const handleOpen = () => {
    onOpenFindings();
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
        <button onClick={handleOpen} className={`text-xs ${c.mutedText} text-left`}>
          {t('investigation.trackingPrompt')}
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className={`p-1 rounded ${c.dismissText} transition-colors flex-shrink-0`}
        aria-label={t('action.close')}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default InvestigationPrompt;
