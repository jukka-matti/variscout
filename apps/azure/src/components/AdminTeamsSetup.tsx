import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Copy, Download, Check, ExternalLink, Info } from 'lucide-react';
import { isInTeams } from '../teams';

// Generate a stable manifest ID per origin using crypto.randomUUID(), persisted in localStorage.
// This avoids the weak hash that previously produced non-compliant UUIDs.
function generateManifestId(origin: string): string {
  const key = `variscout_manifest_id_${origin}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
  } catch {
    /* ignore — localStorage unavailable */
  }
  const id = crypto.randomUUID();
  try {
    localStorage.setItem(key, id);
  } catch {
    /* ignore */
  }
  return id;
}

function buildManifest(origin: string, clientId?: string): object {
  const manifest: Record<string, unknown> = {
    $schema:
      'https://developer.microsoft.com/en-us/json-schemas/teams/v1.19/MicrosoftTeams.schema.json',
    manifestVersion: '1.19',
    version: '1.1.0',
    id: generateManifestId(origin),
    developer: {
      name: 'VariScout',
      websiteUrl: 'https://variscout.com',
      privacyUrl: 'https://variscout.com/privacy',
      termsOfUseUrl: 'https://variscout.com/terms',
    },
    name: {
      short: 'VariScout',
      full: 'VariScout - Variation Analysis for Quality Teams',
    },
    description: {
      short: 'Variation analysis for quality teams',
      full: 'Collaborative variation analysis with I-Charts, Boxplots, Pareto, Capability, and Performance Mode for multi-channel tracking. Data stays in your tenant.',
    },
    icons: {
      color: 'color.png',
      outline: 'outline.png',
    },
    accentColor: '#3B82F6',
    staticTabs: [
      {
        entityId: 'variscout-personal',
        name: 'VariScout',
        contentUrl: `${origin}`,
        websiteUrl: `${origin}`,
        scopes: ['personal'],
      },
    ],
    configurableTabs: [
      {
        configurationUrl: `${origin}?teamsConfig=true`,
        canUpdateConfiguration: true,
        scopes: ['team', 'groupchat'],
        context: ['channelTab', 'privateChatTab', 'meetingChatTab'],
      },
    ],
    permissions: ['identity', 'messageTeamMembers'],
    devicePermissions: ['media'],
    validDomains: [new URL(origin).hostname],
  };

  // Add webApplicationInfo for SSO if client ID is provided
  if (clientId) {
    manifest.webApplicationInfo = {
      id: clientId,
      resource: `api://${new URL(origin).hostname}/${clientId}`,
    };
  }

  return manifest;
}

export function AdminTeamsSetup() {
  const origin = window.location.origin;
  const [clientId, setClientId] = useState('');
  const manifest = useMemo(() => buildManifest(origin, clientId || undefined), [origin, clientId]);
  const manifestJson = useMemo(() => JSON.stringify(manifest, null, 2), [manifest]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inTeams = isInTeams();

  // Auto-reset copied state after 2s with proper cleanup on unmount
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(manifestJson);
    setCopied(true);
  }, [manifestJson]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      zip.file('manifest.json', manifestJson);

      // Fetch the icon files from public/teams/
      const [colorRes, outlineRes] = await Promise.all([
        fetch('/teams/color.png'),
        fetch('/teams/outline.png'),
      ]);

      if (colorRes.ok) zip.file('color.png', await colorRes.blob());
      if (outlineRes.ok) zip.file('outline.png', await outlineRes.blob());

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'variscout-teams.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate Teams package:', err);
    } finally {
      setDownloading(false);
    }
  }, [manifestJson]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-content mb-2">Add VariScout to Microsoft Teams</h2>
      <p className="text-content-secondary mb-8">
        Generate a Teams app package for your deployment and upload it to your Teams admin center.
      </p>

      {/* Teams status indicator */}
      {inTeams && (
        <section className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-sm text-green-400 font-medium">Running inside Microsoft Teams</p>
        </section>
      )}

      {/* Client ID for SSO */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3">
          1. App Registration Client ID (Optional)
        </h3>
        <p className="text-sm text-content-secondary mb-3">
          Enter your Azure AD App Registration Client ID to enable Teams SSO in the manifest. This
          is the same Client ID used for EasyAuth.
        </p>
        <input
          type="text"
          value={clientId}
          onChange={e => setClientId(e.target.value.trim())}
          placeholder="e.g. 12345678-abcd-1234-abcd-123456789012"
          className="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-lg text-sm text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </section>

      {/* Step 2: Download */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3">
          2. Download the Teams App Package
        </h3>
        <p className="text-sm text-content-secondary mb-4">
          This .zip contains the manifest and icons pre-configured for your deployment at{' '}
          <code className="text-blue-400">{origin}</code>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            <Download size={16} />
            {downloading ? 'Generating...' : 'Download Teams App Package'}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-tertiary text-content rounded-lg hover:bg-surface-tertiary/80 transition-colors text-sm"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy manifest.json'}
          </button>
        </div>
      </section>

      {/* Step 2: Upload */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3">3. Upload to Teams Admin Center</h3>
        <ol className="space-y-3 text-sm text-content">
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">a.</span>
            <span>
              Go to{' '}
              <a
                href="https://admin.teams.microsoft.com/policies/manage-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Teams Admin Center &gt; Manage apps
                <ExternalLink size={12} />
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">b.</span>
            <span>
              Click <strong className="text-content">Upload new app</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">c.</span>
            <span>
              Select the <code className="text-blue-400">variscout-teams.zip</code> file you
              downloaded
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">d.</span>
            <span>
              The app appears under <strong className="text-content">"Built for your org"</strong>{' '}
              in the Teams app catalog for all users
            </span>
          </li>
        </ol>
      </section>

      {/* Step 4: Add to channel */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content mb-3">4. Add VariScout to a Channel</h3>
        <ol className="space-y-3 text-sm text-content">
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">a.</span>
            <span>Open a Teams channel (e.g. your Quality channel)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">b.</span>
            <span>
              Click the <strong className="text-content">+</strong> icon in the tab bar
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">c.</span>
            <span>
              Search for <strong className="text-content">VariScout</strong> and select it
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">d.</span>
            <span>
              VariScout loads as a tab — the whole team can access it from the channel's tab bar
            </span>
          </li>
        </ol>
      </section>

      {/* Custom domain note */}
      <section className="mb-8 bg-surface-secondary/50 border border-edge rounded-lg p-4">
        <div className="flex gap-3">
          <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-content mb-1">Custom Domain for Teams SSO</h4>
            <p className="text-sm text-content-secondary">
              By default, users see a one-time login redirect when opening VariScout in Teams
              because Microsoft blocks SSO on{' '}
              <code className="text-content">*.azurewebsites.net</code> domains. To enable seamless
              single sign-on, map a custom domain (e.g.{' '}
              <code className="text-content">variscout.yourcompany.com</code>) to your App Service,
              then update the <code className="text-content">contentUrl</code> and{' '}
              <code className="text-content">validDomains</code> in the manifest.
            </p>
          </div>
        </div>
      </section>

      {/* Manifest preview */}
      <section>
        <h3 className="text-lg font-semibold text-content mb-3">Manifest Preview</h3>
        <pre className="bg-surface-secondary border border-edge rounded-lg p-4 text-xs text-content overflow-x-auto max-h-96 overflow-y-auto">
          {manifestJson}
        </pre>
      </section>
    </div>
  );
}
