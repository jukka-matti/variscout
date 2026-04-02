import React, { useState, useCallback, useMemo } from 'react';
import {
  Info,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { hasTeamFeatures, isPreviewEnabled, setPreviewEnabled } from '@variscout/core';
import { isKnowledgeBaseAvailable, searchDocuments } from '../../services/searchService';
import { getRuntimeConfig } from '../../lib/runtimeConfig';

interface StatusRowProps {
  label: string;
  ok: boolean;
  detail?: string;
}

function StatusRow({ label, ok, detail }: StatusRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {ok ? (
        <CheckCircle size={18} className="text-green-400 shrink-0" />
      ) : (
        <XCircle size={18} className="text-red-400 shrink-0" />
      )}
      <div>
        <span className="text-sm text-content">{label}</span>
        {detail && <span className="text-xs text-content-muted ml-2">({detail})</span>}
      </div>
    </div>
  );
}

/**
 * AdminKnowledgeSetup — ADR-026 SharePoint-first Knowledge Base setup.
 *
 * Prerequisites:
 * - Team plan
 * - AI Search endpoint configured
 * - ≥1 M365 Copilot license in tenant (for Remote SharePoint knowledge sources)
 *
 * The Knowledge Base works by:
 * 1. Publishing reports to the team's SharePoint folder (same as .vrs files)
 * 2. Creating a Remote SharePoint knowledge source in AI Search
 * 3. Users search on-demand from CoScout ("💡 Search Knowledge Base?")
 */
export function AdminKnowledgeSetup() {
  const [previewEnabled, setPreviewEnabledState] = useState(() =>
    isPreviewEnabled('knowledge-base')
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const teamPlan = useMemo(() => hasTeamFeatures(), []);
  const config = useMemo(() => getRuntimeConfig(), []);
  const searchEndpoint = config?.aiSearchEndpoint || import.meta.env.VITE_AI_SEARCH_ENDPOINT || '';
  const hasSearchEndpoint = !!searchEndpoint;

  const handleTogglePreview = useCallback(() => {
    setPreviewEnabled('knowledge-base', !previewEnabled);
    setPreviewEnabledState(isPreviewEnabled('knowledge-base'));
  }, [previewEnabled]);

  const handleTestSearch = useCallback(async () => {
    setTestStatus('testing');
    setTestError(null);
    try {
      const results = await searchDocuments('test connectivity check', { top: 1 });
      // Even empty results mean the service is reachable
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
      if (results.length > 0) {
        setTestError(null);
      }
    } catch (err) {
      setTestStatus('error');
      setTestError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, []);

  const allReady = teamPlan && hasSearchEndpoint && previewEnabled;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-2xl font-bold text-content">Knowledge Base</h2>
        <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
          Preview
        </span>
      </div>
      <p className="text-content-secondary mb-8">
        Search your team's SharePoint documents from CoScout to accelerate investigations with
        institutional knowledge — SOPs, fault trees, past 8D reports, and more.
      </p>

      {/* Status checks */}
      <section className="mb-8 bg-surface-secondary/50 border border-edge rounded-lg p-4">
        <h3 className="text-lg font-semibold text-content mb-3">Status</h3>
        <StatusRow label="Team plan" ok={teamPlan} detail={teamPlan ? 'Active' : 'Required'} />
        <StatusRow
          label="Search endpoint configured"
          ok={hasSearchEndpoint}
          detail={hasSearchEndpoint ? searchEndpoint : 'Not configured'}
        />
        <StatusRow
          label="Preview feature enabled"
          ok={previewEnabled}
          detail={previewEnabled ? 'On' : 'Off'}
        />
        <div className="mt-3 pt-3 border-t border-edge">
          <StatusRow
            label="Knowledge Base available"
            ok={allReady && isKnowledgeBaseAvailable()}
            detail={allReady ? 'Ready' : 'Not all requirements met'}
          />
        </div>
      </section>

      {/* Preview toggle */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3">Preview Toggle</h3>
        <p className="text-sm text-content-secondary mb-3">
          Enable or disable the Knowledge Base preview feature. When enabled, CoScout will offer a
          "Search Knowledge Base?" button after responding — users search on demand.
        </p>
        <button
          onClick={handleTogglePreview}
          disabled={!teamPlan}
          className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
            previewEnabled
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-surface-tertiary text-content hover:bg-surface-tertiary/80'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {previewEnabled ? 'Disable Preview' : 'Enable Preview'}
        </button>
      </section>

      {/* How It Works — updated for ADR-026 */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3">How It Works</h3>
        <ol className="space-y-3 text-sm text-content">
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">1.</span>
            <span>
              <strong className="text-content">Publish reports</strong> — when users publish
              scouting reports, they're saved as Markdown files in the team's SharePoint folder
              alongside
              <code className="text-content mx-1">.vrs</code>files.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">2.</span>
            <span>
              <strong className="text-content">On-demand search</strong> — when a user asks CoScout
              a question, a "💡 Search Knowledge Base?" button appears. Clicking it searches
              SharePoint documents in the team's folder.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">3.</span>
            <span>
              <strong className="text-content">Enriched responses</strong> — results appear as
              document cards with title, snippet, and source link. CoScout cites sources naturally
              using
              <code className="text-content mx-1">[Source: name]</code>badges.
            </span>
          </li>
        </ol>
      </section>

      {/* SharePoint setup — updated for Remote SharePoint */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3 flex items-center gap-2">
          <FolderOpen size={18} />
          SharePoint Configuration
        </h3>
        <p className="text-sm text-content-secondary mb-4">
          The Knowledge Base uses Azure AI Search's{' '}
          <strong className="text-content">Remote SharePoint</strong> knowledge source. Documents
          are accessed with per-user permissions — users can only search documents they have access
          to in SharePoint.
        </p>
        <div className="bg-surface-secondary/50 border border-edge rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-content-secondary">
              <p className="mb-2">
                <strong className="text-content">Prerequisites:</strong>
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Azure AI Search service provisioned (included in ARM template)</li>
                <li>≥1 Microsoft 365 Copilot license in the tenant</li>
                <li>
                  Remote SharePoint knowledge source created via{' '}
                  <a
                    href="https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-remote"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    API setup
                    <ExternalLink size={12} />
                  </a>
                </li>
                <li>
                  Admin consent for <code className="text-content">Sites.Read.All</code> scope
                  (delegated — enables per-user SharePoint search)
                </li>
              </ul>
            </div>
          </div>

          {/* Search scope info */}
          <div className="flex gap-3 pt-2 border-t border-edge">
            <FolderOpen size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-content-secondary">
              <p>
                <strong className="text-content">Search scope:</strong> By default, CoScout searches
                the channel's SharePoint folder. Users can override this per-project in{' '}
                <strong className="text-content">Settings &gt; Knowledge Base</strong>.
              </p>
              <p className="text-xs text-content-muted mt-1">
                Add your quality documents (SOPs, FMEA, 8D reports) to the channel folder to make
                them searchable by CoScout.
              </p>
            </div>
          </div>

          {/* Test search button */}
          {allReady && (
            <div className="pt-2 border-t border-edge">
              <button
                onClick={handleTestSearch}
                disabled={testStatus === 'testing'}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-surface-tertiary text-content hover:bg-surface-tertiary/80 rounded-lg transition-colors disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                {testStatus === 'testing' ? 'Testing...' : 'Test Search Connectivity'}
              </button>
              {testStatus === 'success' && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <CheckCircle size={12} /> Connected successfully
                </p>
              )}
              {testStatus === 'error' && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <XCircle size={12} /> {testError || 'Connection failed'}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Cost estimate */}
      <section className="bg-surface-secondary/50 border border-edge rounded-lg p-4">
        <div className="flex gap-3">
          <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-content mb-1">Cost Estimate</h4>
            <p className="text-sm text-content-secondary">
              The AI resources (Azure AI Services, AI Search, model deployments) add approximately
              €65-85/month to the base plan cost. Remote SharePoint knowledge sources do not incur
              additional indexer costs — documents are accessed on demand with user credentials.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
