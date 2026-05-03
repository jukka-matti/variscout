import React from 'react';

export interface VerificationCardTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface VerificationCardProps {
  tabs: VerificationCardTab[];
  activeTab: string;
}

/**
 * VerificationCard — content-only view-switcher for the Verify card slot.
 *
 * Renders only the active tab's content. The segmented-control header is
 * rendered by the caller in the DashboardChartCard `title` slot so it sits
 * visually in the card's header row alongside the maximize button.
 */
const VerificationCard: React.FC<VerificationCardProps> = ({ tabs, activeTab }) => {
  const renderedTab = tabs.find(tab => tab.id === activeTab) ?? tabs[0];
  const activeContent = renderedTab?.content ?? null;

  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">{activeContent}</div>
      </div>
    </div>
  );
};

export default VerificationCard;
