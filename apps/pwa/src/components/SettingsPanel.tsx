import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Key,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Plus,
  BarChart3,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getEdition } from '../lib/edition';
import ThemeToggle from './ThemeToggle';
import CompanyColorPicker from './CompanyColorPicker';
import {
  hasValidLicense,
  getStoredLicenseKey,
  storeLicenseKey,
  removeLicenseKey,
} from '../lib/license';

type AnalysisView = 'dashboard' | 'regression' | 'gagerr';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: AnalysisView;
  onViewChange: (view: AnalysisView) => void;
  onOpenProjects: () => void;
  onNewAnalysis: () => void;
  onSaveProject: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  activeView,
  onViewChange,
  onOpenProjects,
  onNewAnalysis,
  onSaveProject,
  isSaving = false,
  hasUnsavedChanges = false,
}) => {
  const { displayOptions, setDisplayOptions } = useData();
  const panelRef = useRef<HTMLDivElement>(null);

  // Local state for display options
  const [localDisplayOptions, setLocalDisplayOptions] = useState(displayOptions);

  // License state
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [edition, setEdition] = useState<string>('community');

  // Sync local state when panel opens
  useEffect(() => {
    if (isOpen) {
      setLocalDisplayOptions(displayOptions);
      const currentEdition = getEdition();
      setEdition(currentEdition);
      const storedKey = getStoredLicenseKey();
      if (storedKey) {
        setLicenseKey(storedKey);
        setLicenseStatus(hasValidLicense() ? 'valid' : 'invalid');
      }
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

  const handleActivateLicense = () => {
    if (storeLicenseKey(licenseKey)) {
      setLicenseStatus('valid');
      setEdition('pro');
    } else {
      setLicenseStatus('invalid');
    }
  };

  const handleRemoveLicense = () => {
    removeLicenseKey();
    setLicenseKey('');
    setLicenseStatus('none');
    setEdition('community');
  };

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
              <ViewOption
                view="gagerr"
                icon={<Target size={18} />}
                label="Gage R&R"
                description="Measurement system analysis"
              />
            </div>
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
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-surface-tertiary" />

          {/* Project Section */}
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Project
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenProjects();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-surface-tertiary hover:bg-surface-elevated text-content hover:text-white rounded-lg transition-colors text-sm"
              >
                <FolderOpen size={16} />
                Open...
              </button>
              <button
                onClick={() => {
                  onNewAnalysis();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-surface-tertiary hover:bg-surface-elevated text-content hover:text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                New
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-surface-tertiary" />

          {/* License Section */}
          <div>
            <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
              License
            </h3>

            <div className="bg-surface/50 rounded-lg p-3 border border-edge">
              {/* Current Status */}
              <div className="flex items-center gap-3 mb-3">
                {edition === 'pro' ? (
                  <>
                    <CheckCircle size={18} className="text-green-500" />
                    <div>
                      <div className="text-sm text-white font-medium">Pro Edition</div>
                      <div className="text-xs text-content-muted">Branding removed</div>
                    </div>
                  </>
                ) : edition === 'itc' ? (
                  <>
                    <CheckCircle size={18} className="text-blue-500" />
                    <div>
                      <div className="text-sm text-white font-medium">ITC Edition</div>
                      <div className="text-xs text-content-muted">International Trade Centre</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Key size={18} className="text-content-muted" />
                    <div>
                      <div className="text-sm text-white font-medium">Community</div>
                      <div className="text-xs text-content-muted">Free with branding</div>
                    </div>
                  </>
                )}
              </div>

              {/* License Key Input (only for community edition) */}
              {edition === 'community' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={e => {
                        setLicenseKey(e.target.value.toUpperCase());
                        setLicenseStatus('none');
                      }}
                      placeholder="VSL-XXXX-XXXX-XXXX"
                      className="flex-1 bg-surface border border-edge rounded px-2 py-1.5 text-white text-xs font-mono outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleActivateLicense}
                      disabled={!licenseKey || licenseKey.length < 19}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-surface-tertiary disabled:text-content-muted text-white rounded text-xs font-medium transition-colors"
                    >
                      Activate
                    </button>
                  </div>
                  {licenseStatus === 'invalid' && (
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                      <AlertCircle size={12} />
                      Invalid license key
                    </div>
                  )}
                </div>
              )}

              {/* Remove License */}
              {edition === 'pro' && licenseStatus === 'valid' && (
                <button
                  onClick={handleRemoveLicense}
                  className="text-xs text-content-muted hover:text-red-400 transition-colors"
                >
                  Remove license
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Save indicator */}
        <div className="p-4 border-t border-edge bg-surface-secondary/50">
          <button
            onClick={onSaveProject}
            disabled={isSaving || !hasUnsavedChanges}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-surface-tertiary text-content-secondary'
            } disabled:opacity-50`}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Now' : 'All saved'}
          </button>
          <div className="text-center text-xs text-content-muted mt-2">Auto-save: On</div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
