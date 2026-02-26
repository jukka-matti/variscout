import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useTheme, type ChartFontScale } from '../../context/ThemeContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { displayOptions, setDisplayOptions } = useData();
  const { theme, setTheme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  // Local state for display options
  const [localDisplayOptions, setLocalDisplayOptions] = useState(displayOptions);

  // Sync local state when panel opens
  useEffect(() => {
    if (isOpen) {
      setLocalDisplayOptions(displayOptions);
    }
  }, [isOpen, displayOptions]);

  // Apply display options changes immediately
  useEffect(() => {
    if (isOpen && JSON.stringify(localDisplayOptions) !== JSON.stringify(displayOptions)) {
      setDisplayOptions(localDisplayOptions);
    }
  }, [localDisplayOptions, isOpen, setDisplayOptions, displayOptions]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    // Delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-80 bg-surface-secondary border-l border-edge shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-edge">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Display Preferences */}
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Display Preferences
            </h3>
            <div className="space-y-3">
              <label
                htmlFor="pwa-setting-lock-y-axis"
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  id="pwa-setting-lock-y-axis"
                  name="pwa-setting-lock-y-axis"
                  type="checkbox"
                  checked={localDisplayOptions.lockYAxisToFullData !== false}
                  onChange={e =>
                    setLocalDisplayOptions({
                      ...localDisplayOptions,
                      lockYAxisToFullData: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                />
                <div>
                  <span className="text-sm text-content group-hover:text-white transition-colors block">
                    Lock Y-axis when drilling
                  </span>
                  <span className="text-xs text-content-muted">
                    Maintains scale for visual comparison
                  </span>
                </div>
              </label>
              <label
                htmlFor="pwa-setting-show-filter-context"
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  id="pwa-setting-show-filter-context"
                  name="pwa-setting-show-filter-context"
                  type="checkbox"
                  checked={localDisplayOptions.showFilterContext !== false}
                  onChange={e =>
                    setLocalDisplayOptions({
                      ...localDisplayOptions,
                      showFilterContext: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                />
                <div>
                  <span className="text-sm text-content group-hover:text-white transition-colors block">
                    Show filter context on charts
                  </span>
                  <span className="text-xs text-content-muted">
                    Include active filters when copying charts to clipboard
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-surface-tertiary" />

          {/* Chart Text Size */}
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Chart Text Size
            </h3>
            <div className="flex gap-1">
              {(['compact', 'normal', 'large'] as ChartFontScale[]).map(size => {
                const isActive = (theme.chartFontScale ?? 'normal') === size;
                return (
                  <button
                    key={size}
                    onClick={() => setTheme({ chartFontScale: size })}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-surface-tertiary text-content-secondary hover:text-white hover:bg-surface-elevated'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
