import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeToggleProps {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}

const MODES: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun size={14} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
  { value: 'system', label: 'System', icon: <Monitor size={14} /> },
];

const ThemeToggle: React.FC<ThemeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-1 border border-edge">
      {MODES.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onModeChange(value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === value
              ? 'bg-blue-600 text-white'
              : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
          }`}
          aria-label={`Switch to ${label} theme`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
