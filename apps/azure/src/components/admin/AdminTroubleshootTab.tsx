import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { MessageCatalog } from '@variscout/core';
import { isLocalDev, getAccessToken } from '../../auth/easyAuth';
import { graphFetch, GRAPH_BASE } from '../../services/graphFetch';
import { searchDocuments } from '../../services/searchService';
import { getRuntimeConfig } from '../../lib/runtimeConfig';

interface TroubleshootIssue {
  id: string;
  titleKey: keyof MessageCatalog;
  descKey: keyof MessageCatalog;
  checkFn: (() => Promise<boolean>) | null;
  stepsKey: keyof MessageCatalog;
  portalLink?: { label: string; href: string };
}

const ISSUES: TroubleshootIssue[] = [
  {
    id: 'signin',
    titleKey: 'admin.issue.signin',
    descKey: 'admin.issue.signinDesc',
    checkFn: async () => {
      if (isLocalDev()) return true;
      const res = await fetch('/.auth/me');
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 && data[0].user_claims?.length > 0;
    },
    stepsKey: 'admin.issue.signinSteps',
    portalLink: {
      label: 'App Service \u2192 Authentication',
      href: 'https://portal.azure.com/#view/Microsoft_Azure_ApiManagement/apiManagementMenuBlade/~/authentication',
    },
  },
  {
    id: 'onedrive',
    titleKey: 'admin.issue.onedrive',
    descKey: 'admin.issue.onedriveDesc',
    checkFn: async () => {
      if (isLocalDev()) return true;
      const token = await getAccessToken();
      const res = await graphFetch(`${GRAPH_BASE}/me/drive`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    },
    stepsKey: 'admin.issue.onedriveSteps',
    portalLink: {
      label: 'App Registration \u2192 API permissions',
      href: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
    },
  },
  {
    id: 'coscout',
    titleKey: 'admin.issue.coscout',
    descKey: 'admin.issue.coscoutDesc',
    checkFn: async () => {
      const config = getRuntimeConfig();
      const endpoint = config?.aiEndpoint || import.meta.env.VITE_AI_ENDPOINT;
      if (!endpoint) return false;
      if (isLocalDev()) return true;
      const res = await fetch(endpoint, { method: 'HEAD' }).catch(() => null);
      return !!res;
    },
    stepsKey: 'admin.issue.coscoutSteps',
    portalLink: {
      label: 'Azure AI Services',
      href: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub',
    },
  },
  {
    id: 'kb-empty',
    titleKey: 'admin.issue.kbEmpty',
    descKey: 'admin.issue.kbEmptyDesc',
    checkFn: async () => {
      if (isLocalDev()) return true;
      await searchDocuments('test connectivity check', { top: 1 });
      return true;
    },
    stepsKey: 'admin.issue.kbEmptySteps',
    portalLink: {
      label: 'Azure AI Search',
      href: 'https://portal.azure.com/#view/Microsoft_Azure_Search',
    },
  },
  {
    id: 'teams-tab',
    titleKey: 'admin.issue.teamsTab',
    descKey: 'admin.issue.teamsTabDesc',
    checkFn: null,
    stepsKey: 'admin.issue.teamsTabSteps',
    portalLink: {
      label: 'Teams Admin Center \u2192 Manage apps',
      href: 'https://admin.teams.microsoft.com/policies/manage-apps',
    },
  },
  {
    id: 'new-user',
    titleKey: 'admin.issue.newUser',
    descKey: 'admin.issue.newUserDesc',
    checkFn: null,
    stepsKey: 'admin.issue.newUserSteps',
    portalLink: {
      label: 'Enterprise Applications \u2192 Users and groups',
      href: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/EnterpriseApps',
    },
  },
  {
    id: 'ai-slow',
    titleKey: 'admin.issue.aiSlow',
    descKey: 'admin.issue.aiSlowDesc',
    checkFn: null,
    stepsKey: 'admin.issue.aiSlowSteps',
    portalLink: {
      label: 'Azure AI Services \u2192 Deployments',
      href: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub',
    },
  },
  {
    id: 'forbidden',
    titleKey: 'admin.issue.forbidden',
    descKey: 'admin.issue.forbiddenDesc',
    checkFn: null,
    stepsKey: 'admin.issue.forbiddenSteps',
    portalLink: {
      label: 'App Registration \u2192 API permissions',
      href: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
    },
  },
  {
    id: 'kb-partial',
    titleKey: 'admin.issue.kbPartial',
    descKey: 'admin.issue.kbPartialDesc',
    checkFn: null,
    stepsKey: 'admin.issue.kbPartialSteps',
    portalLink: {
      label: 'Azure AD \u2192 Enterprise Applications',
      href: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/EnterpriseApps',
    },
  },
];

type InlineCheckStatus = 'idle' | 'running' | 'pass' | 'fail';

function IssueCard({ issue }: { issue: TroubleshootIssue }) {
  const { t, tf } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [checkStatus, setCheckStatus] = useState<InlineCheckStatus>('idle');
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleRunCheck = useCallback(async () => {
    if (!issue.checkFn) return;
    setCheckStatus('running');
    setCheckError(null);
    try {
      const ok = await issue.checkFn();
      setCheckStatus(ok ? 'pass' : 'fail');
    } catch (err) {
      setCheckStatus('fail');
      setCheckError(err instanceof Error ? err.message : 'Check failed');
    }
  }, [issue]);

  return (
    <div className="border border-edge rounded-lg bg-surface-secondary/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-secondary/80 transition-colors rounded-lg"
      >
        {expanded ? (
          <ChevronDown size={16} className="text-content-muted shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-content-muted shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-content">{t(issue.titleKey)}</h4>
          <p className="text-xs text-content-secondary mt-0.5">{t(issue.descKey)}</p>
        </div>
        {issue.checkFn && checkStatus !== 'idle' && (
          <div className="shrink-0">
            {checkStatus === 'running' && (
              <Loader2 size={16} className="text-blue-400 animate-spin" />
            )}
            {checkStatus === 'pass' && <CheckCircle size={16} className="text-green-500" />}
            {checkStatus === 'fail' && <XCircle size={16} className="text-red-400" />}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 ml-7 space-y-4">
          {/* Inline check */}
          {issue.checkFn && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRunCheck}
                disabled={checkStatus === 'running'}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-surface-tertiary text-content hover:bg-surface-tertiary/80 rounded-lg transition-colors disabled:opacity-50"
              >
                {checkStatus === 'running' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <AlertTriangle size={12} />
                )}
                {t('admin.runCheck')}
              </button>
              {checkStatus === 'pass' && (
                <span className="text-xs text-green-500">{t('admin.checkPassed')}</span>
              )}
              {checkStatus === 'fail' && (
                <span className="text-xs text-red-400">{checkError || t('admin.checkFailed')}</span>
              )}
            </div>
          )}

          {/* Steps */}
          <ol className="space-y-2">
            {t(issue.stepsKey)
              .split('\n')
              .map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-content-secondary">
                  <span className="text-blue-400 font-mono shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
          </ol>

          {/* Portal link */}
          {issue.portalLink && (
            <a
              href={issue.portalLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              {tf('admin.fixInPortal', { label: issue.portalLink.label })}
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminTroubleshootTab() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <p className="text-sm text-content-secondary mb-4">{t('admin.troubleshoot.intro')}</p>
      {ISSUES.map(issue => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
