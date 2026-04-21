import React, { useState } from 'react';

export interface VerificationCardTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface VerificationCardProps {
  tabs: VerificationCardTab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const VerificationCard: React.FC<VerificationCardProps> = ({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
}) => {
  const fallbackTab = tabs[0]?.id ?? '';
  const initialTab =
    defaultTab && tabs.some(tab => tab.id === defaultTab) ? defaultTab : fallbackTab;
  const [internalTab, setInternalTab] = useState(initialTab);
  const selectedTab = activeTab ?? internalTab;
  const renderedTab =
    tabs.find(tab => tab.id === selectedTab) ?? tabs.find(tab => tab.id === initialTab) ?? tabs[0];

  const handleTabClick = (tabId: string) => {
    if (activeTab === undefined) {
      setInternalTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const hasMultipleTabs = tabs.length > 1;
  const activeContent = renderedTab?.content ?? null;

  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      {hasMultipleTabs && (
        <div
          className="flex gap-0.5 bg-surface/50 p-0.5 rounded-lg border border-edge/50"
          data-export-hide
        >
          {tabs.map(tab => {
            const isActive = tab.id === renderedTab?.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-surface-tertiary text-content shadow-sm'
                    : 'text-content-secondary hover:text-content'
                }`}
                aria-pressed={isActive}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">{activeContent}</div>
      </div>
    </div>
  );
};

export default VerificationCard;
