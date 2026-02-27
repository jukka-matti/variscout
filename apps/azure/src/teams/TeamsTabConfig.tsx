/**
 * Teams Tab Configuration page.
 *
 * Shown when a user adds VariScout as a channel tab.
 * Registers the content URL with Teams and enables the "Save" button.
 */

import React, { useEffect, useState } from 'react';
import { app, pages } from '@microsoft/teams-js';
import { Activity } from 'lucide-react';

export function TeamsTabConfig() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function configure() {
      try {
        await app.initialize();

        const origin = window.location.origin;

        pages.config.registerOnSaveHandler(saveEvent => {
          pages.config.setConfig({
            suggestedDisplayName: 'VariScout',
            entityId: 'variscout-channel',
            contentUrl: origin,
            websiteUrl: origin,
          });
          saveEvent.notifySuccess();
        });

        pages.config.setValidityState(true);

        if (mounted) setReady(true);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Teams SDK');
        }
      }
    }

    configure();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-8">
        <div className="text-center">
          <p className="text-red-400 mb-2">Configuration Error</p>
          <p className="text-sm text-content-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
            <Activity className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-content">VariScout</h1>
        </div>

        {ready ? (
          <>
            <p className="text-content-secondary mb-4">
              Add VariScout as a tab in this channel. Your team will have quick access to variation
              analysis directly in Teams.
            </p>
            <p className="text-sm text-content-muted">
              Click <strong className="text-content">Save</strong> to add the tab.
            </p>
          </>
        ) : (
          <p className="text-content-secondary">Loading...</p>
        )}
      </div>
    </div>
  );
}
