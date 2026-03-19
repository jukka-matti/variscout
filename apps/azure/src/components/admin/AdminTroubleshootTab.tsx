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
import { isLocalDev, getAccessToken } from '../../auth/easyAuth';
import { graphFetch, GRAPH_BASE } from '../../services/graphFetch';
import { searchDocuments } from '../../services/searchService';
import { getRuntimeConfig } from '../../lib/runtimeConfig';

interface TroubleshootIssue {
  id: string;
  title: string;
  description: string;
  checkFn: (() => Promise<boolean>) | null;
  steps: string[];
  portalLink?: { label: string; href: string };
}

const ISSUES: TroubleshootIssue[] = [
  {
    id: 'signin',
    title: "Users can't sign in",
    description: 'Azure AD authentication is not working or users see a blank page.',
    checkFn: async () => {
      if (isLocalDev()) return true;
      const res = await fetch('/.auth/me');
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 && data[0].user_claims?.length > 0;
    },
    steps: [
      'Verify App Service Authentication is enabled in Azure Portal.',
      'Check the Azure AD app registration has the correct redirect URIs.',
      'Ensure the app registration has "ID tokens" enabled under Authentication.',
      'Verify the tenant allows user sign-in to the app (Enterprise Applications → Properties → Enabled for users to sign-in).',
    ],
    portalLink: {
      label: 'App Service → Authentication',
      href: 'https://portal.azure.com/#view/Microsoft_Azure_ApiManagement/apiManagementMenuBlade/~/authentication',
    },
  },
  {
    id: 'onedrive',
    title: 'OneDrive sync not working',
    description: 'Projects are not syncing to OneDrive or users see permission errors.',
    checkFn: async () => {
      if (isLocalDev()) return true;
      const token = await getAccessToken();
      const res = await graphFetch(`${GRAPH_BASE}/me/drive`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    },
    steps: [
      'Verify the app registration has "Files.ReadWrite" delegated permission.',
      'Check that admin consent has been granted for the Graph permissions.',
      'Ensure the user has a OneDrive license assigned.',
      'Try signing out and signing back in to refresh the token.',
    ],
    portalLink: {
      label: 'App Registration → API permissions',
      href: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
    },
  },
  {
    id: 'coscout',
    title: 'CoScout not responding',
    description: 'The AI assistant is not generating responses or shows errors.',
    checkFn: async () => {
      const config = getRuntimeConfig();
      const endpoint = config?.aiEndpoint || import.meta.env.VITE_AI_ENDPOINT;
      if (!endpoint) return false;
      if (isLocalDev()) return true;
      const res = await fetch(endpoint, { method: 'HEAD' }).catch(() => null);
      return !!res;
    },
    steps: [
      'Verify the AI endpoint is configured in the ARM template / App Service settings.',
      'Check that the Azure AI Services resource is deployed and running.',
      'Verify the model deployment exists (e.g. gpt-4o) in the AI Services resource.',
      'Check Azure AI Services quotas — the deployment may have hit rate limits.',
    ],
    portalLink: {
      label: 'Azure AI Services',
      href: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub',
    },
  },
  {
    id: 'kb-empty',
    title: 'Knowledge Base returns no results',
    description: 'CoScout\'s "Search Knowledge Base" finds nothing despite documents existing.',
    checkFn: async () => {
      if (isLocalDev()) return true;
      await searchDocuments('test connectivity check', { top: 1 });
      return true;
    },
    steps: [
      'Verify the AI Search endpoint is configured in App Service settings.',
      'Check that the Remote SharePoint knowledge source has been created in AI Search.',
      'Ensure ≥1 Microsoft 365 Copilot license is active in the tenant.',
      'Verify the user has SharePoint access to the documents being searched.',
      'Check that the Knowledge Base preview toggle is enabled (Admin → Knowledge Base tab).',
    ],
    portalLink: {
      label: 'Azure AI Search',
      href: 'https://portal.azure.com/#view/Microsoft_Azure_Search',
    },
  },
  {
    id: 'teams-tab',
    title: 'Teams tab not showing',
    description: 'VariScout does not appear in Teams or the tab fails to load.',
    checkFn: null,
    steps: [
      'Verify the Teams app package (.zip) was uploaded to Teams Admin Center.',
      'Check that the manifest.json contentUrl matches your App Service URL.',
      'Ensure the app is approved in Teams Admin Center (not blocked by policy).',
      'Try removing and re-adding the tab in the channel.',
      "If using a custom domain, verify it's in the manifest's validDomains array.",
    ],
    portalLink: {
      label: 'Teams Admin Center → Manage apps',
      href: 'https://admin.teams.microsoft.com/policies/manage-apps',
    },
  },
  {
    id: 'new-user',
    title: "New user can't access the app",
    description: 'A newly added user sees an access denied or blank page.',
    checkFn: null,
    steps: [
      'In Azure AD, go to Enterprise Applications → VariScout → Users and groups.',
      'Add the user or their security group to the app.',
      'If using "User assignment required", ensure the user has an assignment.',
      'Check Conditional Access policies that might block the user.',
    ],
    portalLink: {
      label: 'Enterprise Applications → Users and groups',
      href: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/EnterpriseApps',
    },
  },
  {
    id: 'ai-slow',
    title: 'AI responses are slow',
    description: 'CoScout takes a long time to respond or frequently times out.',
    checkFn: null,
    steps: [
      'Check the Azure AI Services deployment region — latency increases with distance.',
      'Verify the model deployment has sufficient TPM (tokens per minute) quota.',
      'Consider upgrading to a provisioned throughput deployment for consistent latency.',
      'Check if the AI Search index is large — consider optimizing the knowledge source.',
    ],
    portalLink: {
      label: 'Azure AI Services → Deployments',
      href: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub',
    },
  },
  {
    id: 'forbidden',
    title: '"Forbidden" errors',
    description: 'Users see 403 errors when accessing certain features.',
    checkFn: null,
    steps: [
      'Check that all required Graph API permissions have admin consent.',
      'Verify the App Service Authentication token store is enabled.',
      "Ensure the user's token hasn't expired — try signing out and back in.",
      'Check Conditional Access policies for the tenant.',
    ],
    portalLink: {
      label: 'App Registration → API permissions',
      href: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
    },
  },
  {
    id: 'kb-partial',
    title: 'KB fails for some users',
    description: 'Knowledge Base search works for admins but not for other users.',
    checkFn: null,
    steps: [
      'Remote SharePoint knowledge sources use per-user permissions. Each user must have SharePoint access to the documents.',
      'Check if the affected users are blocked by Conditional Access policies.',
      'Verify admin consent was granted for the Sites.Read.All delegated permission.',
      'Ask the affected users to sign out and sign back in to refresh their token.',
    ],
    portalLink: {
      label: 'Azure AD → Enterprise Applications',
      href: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/EnterpriseApps',
    },
  },
];

type InlineCheckStatus = 'idle' | 'running' | 'pass' | 'fail';

function IssueCard({ issue }: { issue: TroubleshootIssue }) {
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
          <h4 className="text-sm font-medium text-content">{issue.title}</h4>
          <p className="text-xs text-content-secondary mt-0.5">{issue.description}</p>
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
                Run Check
              </button>
              {checkStatus === 'pass' && (
                <span className="text-xs text-green-500">
                  Check passed — this may not be the issue.
                </span>
              )}
              {checkStatus === 'fail' && (
                <span className="text-xs text-red-400">
                  {checkError || 'Check failed — follow the steps below.'}
                </span>
              )}
            </div>
          )}

          {/* Steps */}
          <ol className="space-y-2">
            {issue.steps.map((step, i) => (
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
              Fix in Azure Portal: {issue.portalLink.label}
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminTroubleshootTab() {
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <p className="text-sm text-content-secondary mb-4">
        Common issues and how to fix them. Click an issue to see step-by-step instructions.
      </p>
      {ISSUES.map(issue => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
