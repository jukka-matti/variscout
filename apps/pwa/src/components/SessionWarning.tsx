import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface SessionWarningProps {
  onUpgradeClick?: () => void;
  className?: string;
}

/**
 * Warning banner for session-only mode (installed but no license)
 *
 * Reminds users that work disappears when they close the app,
 * with a link to upgrade for persistence.
 */
const SessionWarning: React.FC<SessionWarningProps> = ({ onUpgradeClick, className = '' }) => {
  return (
    <div
      className={`flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl ${className}`}
    >
      <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-amber-400">Session only</div>
        <p className="text-xs text-content-muted mt-0.5">Work disappears when you close the app.</p>
        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Upgrade to save projects</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SessionWarning;
