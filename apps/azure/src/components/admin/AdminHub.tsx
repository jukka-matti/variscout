import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Activity, Cpu, Users, BookOpen, Wrench } from 'lucide-react';
import { isTeamAIPlan } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import type { AdminGatingMode } from '../../hooks/useAdminAccess';
import { AdminStatusTab } from './AdminStatusTab';
import { AdminPlanTab } from './AdminPlanTab';
import { AdminTeamsSetup } from './AdminTeamsSetup';
import { AdminKnowledgeSetup } from './AdminKnowledgeSetup';
import { AdminTroubleshootTab } from './AdminTroubleshootTab';

export type AdminTab = 'status' | 'plan' | 'teams' | 'knowledge' | 'troubleshooting';

interface AdminHubProps {
  initialTab?: AdminTab;
  onBack: () => void;
  gatingMode?: AdminGatingMode;
}

interface TabDef {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
}

const STORAGE_KEY = 'variscout_admin_tab';

function getInitialTab(initialTab?: AdminTab): AdminTab {
  // URL param takes priority
  if (initialTab) return initialTab;

  // Then localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as AdminTab | null;
    if (stored && ['status', 'plan', 'teams', 'knowledge', 'troubleshooting'].includes(stored)) {
      // Don't restore to knowledge tab if plan doesn't support it
      if (stored === 'knowledge' && !isTeamAIPlan()) return 'status';
      return stored;
    }
  } catch {
    /* ignore */
  }

  return 'status';
}

export function AdminHub({ initialTab, onBack, gatingMode }: AdminHubProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => getInitialTab(initialTab));
  const { t } = useTranslation();

  const tabs: TabDef[] = [
    { id: 'status', label: t('admin.status'), icon: <Activity size={14} />, visible: true },
    { id: 'plan', label: t('admin.plan'), icon: <Cpu size={14} />, visible: true },
    { id: 'teams', label: t('admin.teams'), icon: <Users size={14} />, visible: true },
    {
      id: 'knowledge',
      label: t('admin.knowledge'),
      icon: <BookOpen size={14} />,
      visible: isTeamAIPlan(),
    },
    {
      id: 'troubleshooting',
      label: t('admin.troubleshooting'),
      icon: <Wrench size={14} />,
      visible: true,
    },
  ];

  const visibleTabs = tabs.filter(t => t.visible);

  const handleTabChange = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(STORAGE_KEY, tab);
    } catch {
      /* ignore */
    }
  }, []);

  // Sync initialTab changes (e.g. from URL param updates)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div>
      {/* Header with back button and tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content hover:bg-surface-secondary transition-colors"
            aria-label={t('nav.backToDashboard')}
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-bold text-content">{t('admin.title')}</h2>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 border-b border-edge overflow-x-auto"
          role="tablist"
          aria-label="Admin sections"
        >
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-content-secondary hover:text-content hover:border-edge'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'status' && <AdminStatusTab gatingMode={gatingMode} />}
        {activeTab === 'plan' && <AdminPlanTab />}
        {activeTab === 'teams' && <AdminTeamsSetup />}
        {activeTab === 'knowledge' && <AdminKnowledgeSetup />}
        {activeTab === 'troubleshooting' && <AdminTroubleshootTab />}
      </div>
    </div>
  );
}
