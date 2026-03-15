import React, { useState, useCallback, useMemo } from 'react';
import { Info, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { isTeamAIPlan, isPreviewEnabled, setPreviewEnabled } from '@variscout/core';
import { isKnowledgeBaseAvailable } from '../services/searchService';
import { getRuntimeConfig } from '../lib/runtimeConfig';

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

export function AdminKnowledgeSetup() {
  const [previewEnabled, setPreviewEnabledState] = useState(() =>
    isPreviewEnabled('knowledge-base')
  );

  const teamAIPlan = useMemo(() => isTeamAIPlan(), []);
  const config = useMemo(() => getRuntimeConfig(), []);
  const searchEndpoint = config?.aiSearchEndpoint || import.meta.env.VITE_AI_SEARCH_ENDPOINT || '';
  const hasSearchEndpoint = !!searchEndpoint;

  const handleTogglePreview = useCallback(() => {
    setPreviewEnabled('knowledge-base', !previewEnabled);
    setPreviewEnabledState(isPreviewEnabled('knowledge-base'));
  }, [previewEnabled]);

  const allReady = teamAIPlan && hasSearchEndpoint && previewEnabled;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-2xl font-bold text-content">Knowledge Base</h2>
        <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
          Preview
        </span>
      </div>
      <p className="text-content-secondary mb-8">
        Search past findings and SharePoint documents across your organization to accelerate
        investigations with institutional knowledge.
      </p>

      {/* Status checks */}
      <section className="mb-8 bg-surface-secondary/50 border border-edge rounded-lg p-4">
        <h3 className="text-lg font-semibold text-content mb-3">Status</h3>
        <StatusRow
          label="Team AI plan"
          ok={teamAIPlan}
          detail={teamAIPlan ? 'Active' : 'Required'}
        />
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
          Enable or disable the Knowledge Base preview feature. When enabled, CoScout will
          automatically search past findings and documents when answering questions.
        </p>
        <button
          onClick={handleTogglePreview}
          disabled={!teamAIPlan}
          className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
            previewEnabled
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-surface-tertiary text-content hover:bg-surface-tertiary/80'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {previewEnabled ? 'Disable Preview' : 'Enable Preview'}
        </button>
      </section>

      {/* How it works */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3">How It Works</h3>
        <ol className="space-y-3 text-sm text-content">
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">1.</span>
            <span>
              When a user asks CoScout a question, it automatically searches the Knowledge Base for
              relevant past findings and documents.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">2.</span>
            <span>
              Results are injected into the AI context with source labels (e.g., "[From: findings]",
              "[From: SOPs]") so CoScout can reference institutional knowledge.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">3.</span>
            <span>
              Findings are indexed automatically when projects are saved. SharePoint documents
              require a one-time setup.
            </span>
          </li>
        </ol>
      </section>

      {/* SharePoint setup */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3">SharePoint Setup (Optional)</h3>
        <p className="text-sm text-content-secondary mb-4">
          Connect SharePoint document libraries (SOPs, procedures, work instructions) to the
          Knowledge Base so CoScout can reference them during investigations.
        </p>
        <div className="bg-surface-secondary/50 border border-edge rounded-lg p-4">
          <div className="flex gap-3">
            <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-content-secondary">
              <p className="mb-2">
                SharePoint indexing uses Azure AI Search's{' '}
                <strong className="text-content">Foundry IQ</strong> agentic retrieval with an{' '}
                <code className="text-content">indexedSharePoint</code> knowledge source.
              </p>
              <p>
                Run the setup script from the <code className="text-content">infra/scripts/</code>{' '}
                directory or follow the instructions in{' '}
                <a
                  href="https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-indexed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Microsoft documentation
                  <ExternalLink size={12} />
                </a>
                .
              </p>
            </div>
          </div>
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
              €65-85/month to the Team AI plan cost. These resources are provisioned by the ARM
              template and managed within your Azure subscription.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
