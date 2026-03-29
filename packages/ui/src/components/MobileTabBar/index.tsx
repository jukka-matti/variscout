/**
 * MobileTabBar - Bottom tab bar for phone navigation (<640px)
 *
 * 4-tab layout for Azure (Analysis|Findings|Improve|More),
 * 3-tab layout for PWA (no Improve tab).
 * Fixed bottom position with safe-area-bottom for notched phones.
 * 44px minimum touch targets, 50px tab row height.
 */
import React from 'react';
import { BarChart3, Pin, Lightbulb, MoreHorizontal } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { MessageCatalog } from '@variscout/core';

export type MobileTab = 'analysis' | 'findings' | 'improve' | 'more';

export interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  findingsCount?: number;
  /** When false, only 3 tabs (no Improve). PWA passes false, Azure passes true. */
  showImproveTab?: boolean;
}

interface TabDef {
  id: MobileTab;
  icon: React.ElementType;
  i18nKey: string;
  fallback: string;
}

const allTabs: TabDef[] = [
  { id: 'analysis', icon: BarChart3, i18nKey: 'mobile.tab.analysis', fallback: 'Analysis' },
  { id: 'findings', icon: Pin, i18nKey: 'mobile.tab.findings', fallback: 'Findings' },
  { id: 'improve', icon: Lightbulb, i18nKey: 'mobile.tab.improve', fallback: 'Improve' },
  { id: 'more', icon: MoreHorizontal, i18nKey: 'mobile.tab.more', fallback: 'More' },
];

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  findingsCount,
  showImproveTab = true,
}) => {
  const { t } = useTranslation();

  const tabs = showImproveTab ? allTabs : allTabs.filter(tab => tab.id !== 'improve');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-edge"
      data-testid="mobile-tab-bar"
    >
      <div className="flex items-center justify-around" style={{ height: 50 }}>
        {tabs.map(({ id, icon: Icon, i18nKey, fallback }) => {
          const isActive = activeTab === id;
          const label = t(i18nKey as keyof MessageCatalog) || fallback;

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 ${
                isActive ? 'text-blue-500' : 'text-content-muted'
              }`}
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`mobile-tab-${id}`}
            >
              <Icon size={20} />
              <span className="text-[0.625rem] leading-tight">{label}</span>

              {/* Findings badge */}
              {id === 'findings' && findingsCount != null && findingsCount > 0 && (
                <span
                  className="absolute top-0.5 right-1/4 flex items-center justify-center min-w-[16px] h-4 px-1 text-[0.625rem] font-bold leading-none text-white bg-red-500 rounded-full"
                  aria-label={`${findingsCount} findings`}
                >
                  {findingsCount > 99 ? '99+' : findingsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="safe-area-bottom" />
    </nav>
  );
};
