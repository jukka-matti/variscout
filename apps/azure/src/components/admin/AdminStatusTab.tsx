import React from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAdminHealthChecks, type CheckStatus } from '../../hooks/useAdminHealthChecks';
import type { AdminGatingMode } from '../../hooks/useAdminAccess';

function statusDot(status: CheckStatus) {
  switch (status) {
    case 'pass':
      return <CheckCircle size={18} className="text-green-500 shrink-0" />;
    case 'fail':
      return <XCircle size={18} className="text-red-400 shrink-0" />;
    case 'running':
      return <Loader2 size={18} className="text-blue-400 shrink-0 animate-spin" />;
    case 'na':
      return (
        <span className="w-[18px] h-[18px] rounded-full bg-surface-tertiary shrink-0 inline-block" />
      );
    default:
      return (
        <span className="w-[18px] h-[18px] rounded-full border-2 border-edge shrink-0 inline-block" />
      );
  }
}

const PORTAL_LINKS: Record<string, { label: string; href: string }> = {
  auth: {
    label: 'App Service → Authentication',
    href: 'https://portal.azure.com/#view/Microsoft_Azure_ApiManagement/apiManagementMenuBlade/~/authentication',
  },
  'graph-profile': {
    label: 'App Registration → API permissions',
    href: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
  },
  'graph-files': {
    label: 'App Registration → API permissions',
    href: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
  },
  'graph-channels': {
    label: 'App Registration → API permissions',
    href: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
  },
  'ai-endpoint': {
    label: 'Azure AI Services',
    href: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub',
  },
  'ai-search': {
    label: 'Azure AI Search',
    href: 'https://portal.azure.com/#view/Microsoft_Azure_Search',
  },
};

const MANAGE_IN_PORTAL = [
  {
    label: 'Client secret / certificate expiry',
    href: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
  },
  {
    label: 'App Service health & metrics',
    href: 'https://portal.azure.com/#view/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/~/overview',
  },
  {
    label: 'Cost management',
    href: 'https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis',
  },
  {
    label: 'User access & role assignments',
    href: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/EnterpriseApps',
  },
];

interface AdminStatusTabProps {
  gatingMode?: AdminGatingMode;
}

export function AdminStatusTab({ gatingMode }: AdminStatusTabProps) {
  const { checks, runAll, runOne, isRunning } = useAdminHealthChecks();

  const passCount = checks.filter(c => c.status === 'pass').length;
  const applicableCount = checks.filter(c => c.status !== 'na').length;
  const hasRun = checks.some(c => c.status !== 'idle' && c.status !== 'na');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Run all button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {hasRun && (
            <p className="text-sm text-content-secondary">
              {passCount}/{applicableCount} checks passed
            </p>
          )}
        </div>
        <button
          onClick={runAll}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Running...' : 'Run All Checks'}
        </button>
      </div>

      {/* Health check list */}
      <section className="bg-surface-secondary/50 border border-edge rounded-lg divide-y divide-edge mb-8">
        {checks.map(check => (
          <div key={check.id} className={`p-4 ${check.status === 'na' ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{statusDot(check.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-content">{check.label}</span>
                  {check.status === 'na' && (
                    <span className="text-xs text-content-muted">Not applicable to your plan</span>
                  )}
                </div>
                <p className="text-xs text-content-secondary mt-0.5">{check.description}</p>
                {check.status === 'fail' && check.error && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {check.error}
                    </p>
                    {PORTAL_LINKS[check.id] && (
                      <a
                        href={PORTAL_LINKS[check.id].href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        Fix in Azure Portal: {PORTAL_LINKS[check.id].label}
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
              </div>
              {check.status === 'fail' && (
                <button
                  onClick={() => runOne(check.id)}
                  className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* AI Search per-user caveat */}
      {checks.some(c => c.id === 'ai-search' && c.status !== 'na') && (
        <div className="bg-surface-secondary/50 border border-edge rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-content-secondary">
              The AI Search check verifies <strong className="text-content">your</strong> access.
              Other users' access depends on their individual SharePoint permissions and Conditional
              Access policies.
            </p>
          </div>
        </div>
      )}

      {/* Manage in Azure Portal */}
      <section className="bg-surface-secondary/50 border border-edge rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-content mb-3">Manage in Azure Portal</h3>
        <p className="text-xs text-content-secondary mb-3">
          These items require Azure Portal access and cannot be checked from the browser.
        </p>
        <div className="space-y-2">
          {MANAGE_IN_PORTAL.map(item => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              <ExternalLink size={12} />
              {item.label}
            </a>
          ))}
        </div>
      </section>

      {/* Admin access gating status */}
      {gatingMode && (
        <section className="bg-surface-secondary/50 border border-edge rounded-lg p-4">
          <div className="flex gap-3">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            {gatingMode === 'no-roles-fallback' ? (
              <p className="text-xs text-content-secondary">
                Admin access is currently open to all authenticated users. To restrict admin access
                to specific users,{' '}
                <a
                  href="https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  configure App Roles in Entra ID
                </a>
                .
              </p>
            ) : (
              <p className="text-xs text-content-secondary">
                Admin access restricted to users with the{' '}
                <code className="text-xs bg-surface-tertiary px-1 py-0.5 rounded">
                  VariScout.Admin
                </code>{' '}
                role.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
