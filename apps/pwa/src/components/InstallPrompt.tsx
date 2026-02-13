import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useIsInstalled';

interface InstallPromptProps {
  className?: string;
}

/**
 * PWA install prompt — free training & education tool
 *
 * Shows install CTA with a collapsible "What's a PWA?" explainer.
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
      <h3 className="text-base font-semibold text-white mb-2">Want to analyze YOUR data?</h3>
      <p className="text-sm text-content-secondary mb-4">
        Install VariScout as an app — paste your data and get instant SPC charts. Free forever,
        works offline, no signup required.
      </p>

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
