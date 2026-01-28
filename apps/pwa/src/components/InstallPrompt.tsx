import React, { useState } from 'react';
import { Download, Upload, Crown, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useIsInstalled';

interface InstallPromptProps {
  className?: string;
}

/**
 * PWA install prompt with 3-step journey explanation
 *
 * Shows:
 * 1. Install the app (free) - works offline, no signup
 * 2. Upload your CSV/Excel - data stays local
 * 3. Upgrade to save (€99/yr) - keep projects, export files
 *
 * Plus a collapsible "What's a PWA?" explainer
 */
const InstallPrompt: React.FC<InstallPromptProps> = ({ className = '' }) => {
  const { canInstall, triggerInstall } = useInstallPrompt();
  const [showPWAInfo, setShowPWAInfo] = useState(false);

  const handleInstall = async () => {
    if (canInstall) {
      await triggerInstall();
    } else {
      // Fallback: Show instructions for manual install
      // Most browsers show an install option in the address bar or menu
      alert(
        'To install VariScout:\n\n' +
          '• Chrome/Edge: Click the install icon in the address bar\n' +
          '• Safari (iOS): Tap Share > Add to Home Screen\n' +
          '• Firefox: Use the browser menu > Install'
      );
    }
  };

  return (
    <div className={`bg-surface-secondary border border-edge rounded-2xl p-5 ${className}`}>
      <h3 className="text-base font-semibold text-white mb-4">Want to analyze YOUR data?</h3>

      {/* 3-step journey */}
      <div className="space-y-4 mb-5">
        {/* Step 1: Install */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">1</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Download size={14} className="text-blue-400" />
              <span className="text-sm font-medium text-white">Install the app</span>
              <span className="text-xs text-green-500 font-medium">free</span>
            </div>
            <p className="text-xs text-content-muted mt-0.5">Works offline, no signup required</p>
          </div>
        </div>

        {/* Step 2: Upload */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-tertiary flex items-center justify-center">
            <span className="text-xs font-bold text-content-muted">2</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Upload size={14} className="text-content-secondary" />
              <span className="text-sm font-medium text-content-secondary">
                Upload your CSV/Excel
              </span>
            </div>
            <p className="text-xs text-content-muted mt-0.5">
              Your data stays local, never sent to servers
            </p>
          </div>
        </div>

        {/* Step 3: Upgrade */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-tertiary flex items-center justify-center">
            <span className="text-xs font-bold text-content-muted">3</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Crown size={14} className="text-content-secondary" />
              <span className="text-sm font-medium text-content-secondary">Upgrade to save</span>
              <span className="text-xs text-content-muted">€99/yr</span>
            </div>
            <p className="text-xs text-content-muted mt-0.5">
              Keep projects, export files, remove watermark
            </p>
          </div>
        </div>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
      >
        <Download size={18} />
        <span>Install VariScout</span>
      </button>

      {/* PWA explainer (collapsible) */}
      <div className="mt-4 pt-4 border-t border-edge">
        <button
          onClick={() => setShowPWAInfo(!showPWAInfo)}
          className="w-full flex items-center justify-between text-xs text-content-muted hover:text-content-secondary transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Info size={12} />
            <span>What's a PWA?</span>
          </div>
          {showPWAInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showPWAInfo && (
          <div className="mt-3 p-3 bg-surface rounded-lg">
            <p className="text-xs text-content-secondary leading-relaxed">
              A Progressive Web App (PWA) installs like a native app but runs in your browser. No
              app store needed. It works offline, starts instantly, and your data never leaves your
              device.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
