import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, BarChart3, TrendingUp, Beaker } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useTheme, type ChartFontScale } from '../../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import CompanyColorPicker from './CompanyColorPicker';

type AnalysisView = 'dashboard' | 'regression';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: AnalysisView;
  onViewChange: (view: AnalysisView) => void;
  onNewAnalysis: () => void;
  onOpenWhatIf?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  activeView,
  onViewChange,
  onNewAnalysis,
  onOpenWhatIf,
}) => {
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

  // View option component
  const ViewOption = ({
    view,
    icon,
    label,
    description,
  }: {
    view: AnalysisView;
    icon: React.ReactNode;
    label: string;
    description: string;
  }) => (
    <button
      onClick={() => {
        onViewChange(view);
        onClose();
      }}
      aria-label={`Switch to ${label} view`}
      aria-pressed={activeView === view}
      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
        activeView === view
          ? 'bg-blue-600/20 border border-blue-500/50'
          : 'hover:bg-surface-tertiary/50 border border-transparent'
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          activeView === view
            ? 'bg-blue-600 text-white'
            : 'bg-surface-tertiary text-content-secondary'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium ${activeView === view ? 'text-blue-400' : 'text-content'}`}
        >
          {label}
        </div>
        <div className="text-xs text-content-muted">{description}</div>
      </div>
      {activeView === view && <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />}
    </button>
  );

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
          {/* Analysis View Section */}
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Analysis View
            </h3>
            <div className="space-y-2">
              <ViewOption
                view="dashboard"
                icon={<BarChart3 size={18} />}
                label="Dashboard"
                description="I-Chart, Boxplot, Pareto & Stats"
              />
              <ViewOption
                view="regression"
                icon={<TrendingUp size={18} />}
                label="Regression"
                description="Correlation and trend analysis"
              />
            </div>

            {/* What-If Simulator (separate page, not a view mode) */}
            {onOpenWhatIf && (
              <button
                onClick={() => {
                  onOpenWhatIf();
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-surface-tertiary/50 border border-transparent"
              >
                <div className="p-2 rounded-lg bg-surface-tertiary text-content-secondary">
                  <Beaker size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-content">What-If Simulator</div>
                  <div className="text-xs text-content-muted">Project process improvements</div>
                </div>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-surface-tertiary" />

          {/* Display Options */}
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Display Options
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
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
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localDisplayOptions.showSpecs !== false}
                  onChange={e =>
                    setLocalDisplayOptions({
                      ...localDisplayOptions,
                      showSpecs: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                />
                <div>
                  <span className="text-sm text-content group-hover:text-white transition-colors block">
                    Show specification limits
                  </span>
                  <span className="text-xs text-content-muted">
                    Display USL/LSL/Target on charts
                  </span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localDisplayOptions.showCpk}
                  onChange={e =>
                    setLocalDisplayOptions({
                      ...localDisplayOptions,
                      showCpk: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                />
                <div>
                  <span className="text-sm text-content group-hover:text-white transition-colors block">
                    Show Cpk capability
                  </span>
                  <span className="text-xs text-content-muted">Process capability index</span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localDisplayOptions.showContributionLabels ?? false}
                  onChange={e =>
                    setLocalDisplayOptions({
                      ...localDisplayOptions,
                      showContributionLabels: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                />
                <div>
                  <span className="text-sm text-content group-hover:text-white transition-colors block">
                    Show contribution labels
                  </span>
                  <span className="text-xs text-content-muted">
                    Impact % below boxplot categories
                  </span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localDisplayOptions.showViolin ?? false}
                  onChange={e =>
                    setLocalDisplayOptions({
                      ...localDisplayOptions,
                      showViolin: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                />
                <div>
                  <span className="text-sm text-content group-hover:text-white transition-colors block">
                    Show distribution shape
                  </span>
                  <span className="text-xs text-content-muted">
                    Display density curves on boxplots to reveal distribution shape
                  </span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
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

          {/* Appearance Section */}
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Appearance
            </h3>
            <div className="space-y-4">
              <ThemeToggle />
              <CompanyColorPicker />

              {/* Chart Size */}
              <div>
                <label className="text-sm text-content block mb-2">Chart Text Size</label>
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

          {/* Divider */}
          <div className="h-px bg-surface-tertiary" />

          {/* New Analysis */}
          <div>
            <button
              onClick={() => {
                onNewAnalysis();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-surface-tertiary hover:bg-surface-elevated text-content hover:text-white rounded-lg transition-colors text-sm"
            >
              <Plus size={16} />
              New Analysis
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
