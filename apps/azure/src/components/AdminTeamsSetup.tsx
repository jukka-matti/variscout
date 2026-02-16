import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Download, Check, ExternalLink, Info } from 'lucide-react';

// Generate a deterministic GUID from the app URL so reinstalls produce the same ID
function generateManifestId(origin: string): string {
  let hash = 0;
  for (let i = 0; i < origin.length; i++) {
    hash = ((hash << 5) - hash + origin.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(1, 4)}-${hex.slice(0, 12).padEnd(12, '0')}`;
}

function buildManifest(origin: string): object {
  return {
    $schema:
      'https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json',
    manifestVersion: '1.16',
    version: '1.0.0',
    id: generateManifestId(origin),
    developer: {
      name: 'VariScout',
      websiteUrl: 'https://variscout.com',
      privacyUrl: 'https://variscout.com/privacy',
      termsOfUseUrl: 'https://variscout.com/terms',
    },
    name: {
      short: 'VariScout',
      full: 'VariScout - Statistical Process Control',
    },
    description: {
      short: 'Variation analysis for quality teams',
      full: 'Collaborative SPC tool with I-Charts, Boxplots, Pareto, Capability analysis, and Performance Mode for multi-channel tracking. Data stays in your OneDrive.',
    },
    icons: {
      color: 'color.png',
      outline: 'outline.png',
    },
    accentColor: '#3B82F6',
    staticTabs: [
      {
        entityId: 'variscout-main',
        name: 'VariScout',
        contentUrl: `${origin}`,
        websiteUrl: `${origin}`,
        scopes: ['personal'],
      },
    ],
    permissions: ['identity', 'messageTeamMembers'],
    validDomains: [new URL(origin).hostname],
  };
}

export function AdminTeamsSetup() {
  const origin = window.location.origin;
  const manifest = useMemo(() => buildManifest(origin), [origin]);
  const manifestJson = useMemo(() => JSON.stringify(manifest, null, 2), [manifest]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(manifestJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <h2 className="text-2xl font-bold text-white mb-2">Add VariScout to Microsoft Teams</h2>
      <p className="text-slate-400 mb-8">
        Generate a Teams app package for your deployment and upload it to your Teams admin center.
      </p>

      {/* Step 1: Download */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">1. Download the Teams App Package</h3>
        <p className="text-sm text-slate-400 mb-4">
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
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy manifest.json'}
          </button>
        </div>
      </section>

      {/* Step 2: Upload */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">2. Upload to Teams Admin Center</h3>
        <ol className="space-y-3 text-sm text-slate-300">
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
              Click <strong className="text-white">Upload new app</strong>
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
              The app appears under <strong className="text-white">"Built for your org"</strong> in
              the Teams app catalog for all users
            </span>
          </li>
        </ol>
      </section>

      {/* Custom domain note */}
      <section className="mb-8 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex gap-3">
          <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Custom Domain for Teams SSO</h4>
            <p className="text-sm text-slate-400">
              By default, users see a one-time login redirect when opening VariScout in Teams
              because Microsoft blocks SSO on{' '}
              <code className="text-slate-300">*.azurewebsites.net</code> domains. To enable
              seamless single sign-on, map a custom domain (e.g.{' '}
              <code className="text-slate-300">variscout.yourcompany.com</code>) to your App
              Service, then update the <code className="text-slate-300">contentUrl</code> and{' '}
              <code className="text-slate-300">validDomains</code> in the manifest.
            </p>
          </div>
        </div>
      </section>

      {/* Manifest preview */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Manifest Preview</h3>
        <pre className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto max-h-96 overflow-y-auto">
          {manifestJson}
        </pre>
      </section>
    </div>
  );
}
