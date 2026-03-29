import React, { useState } from 'react';
import { useTranslation } from '@variscout/hooks';

export interface VerificationCardProps {
  renderHistogram: React.ReactNode;
  renderProbabilityPlot: React.ReactNode;
  defaultTab?: 'histogram' | 'probability';
}

type Tab = 'histogram' | 'probability';

const VerificationCard: React.FC<VerificationCardProps> = ({
  renderHistogram,
  renderProbabilityPlot,
  defaultTab = 'probability',
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex gap-0.5 bg-surface/50 p-0.5 rounded-lg border border-edge/50"
        data-export-hide
      >
        <button
          onClick={() => setActiveTab('histogram')}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'histogram'
              ? 'bg-surface-tertiary text-content shadow-sm'
              : 'text-content-secondary hover:text-content'
          }`}
          aria-pressed={activeTab === 'histogram'}
        >
          {t('stats.histogram')}
        </button>
        <button
          onClick={() => setActiveTab('probability')}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'probability'
              ? 'bg-surface-tertiary text-content shadow-sm'
              : 'text-content-secondary hover:text-content'
          }`}
          aria-pressed={activeTab === 'probability'}
        >
          {t('stats.probPlot')}
        </button>
      </div>
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">
          {activeTab === 'histogram' ? renderHistogram : renderProbabilityPlot}
        </div>
      </div>
    </div>
  );
};

export default VerificationCard;
