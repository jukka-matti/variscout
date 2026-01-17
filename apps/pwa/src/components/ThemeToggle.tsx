import React from 'react';
import { Sun, Moon, Monitor, Lock } from 'lucide-react';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

interface ThemeToggleProps {
  /** Show upgrade prompt for community users (default: true) */
  showUpgradePrompt?: boolean;
}

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'system', icon: Monitor, label: 'System' },
];

/**
 * Theme toggle component
 * Shows theme options for licensed users, or upgrade prompt for community users
 */
export default function ThemeToggle({ showUpgradePrompt = true }: ThemeToggleProps) {
  const { theme, isThemingEnabled, setTheme } = useTheme();

  // Show upgrade prompt for community users
  if (!isThemingEnabled) {
    if (!showUpgradePrompt) return null;

    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary/50 border border-edge/50">
        <Moon size={14} className="text-content-muted" />
        <span className="text-xs text-content-muted">Theme customization</span>
        <Lock size={12} className="text-content-muted ml-auto" />
      </div>
    );
  }

  // Show theme toggle for licensed users
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-content-secondary">Appearance</span>
      <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-secondary/50 border border-edge/50">
        {THEME_OPTIONS.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setTheme({ mode })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              theme.mode === mode
                ? 'bg-brand text-brand-foreground'
                : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
            }`}
            title={label}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
