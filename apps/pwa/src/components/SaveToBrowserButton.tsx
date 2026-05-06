// apps/pwa/src/components/SaveToBrowserButton.tsx
import { useEffect, useState } from 'react';
import type { ProcessHub } from '@variscout/core/processHub';
import { getOptInFlag, setOptInFlag, pwaHubRepository } from '../persistence';

export interface SaveToBrowserButtonProps {
  currentHub: ProcessHub;
}

export function SaveToBrowserButton({ currentHub }: SaveToBrowserButtonProps) {
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getOptInFlag().then(setOptedIn);
  }, []);

  // Auto-save on Hub change once opted in
  useEffect(() => {
    if (optedIn) {
      void pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: currentHub });
    }
  }, [optedIn, currentHub]);

  if (optedIn === null) return null; // initial load

  if (!optedIn) {
    return (
      <button
        type="button"
        data-testid="save-to-browser-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await setOptInFlag(true);
          await pwaHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: currentHub });
          setOptedIn(true);
          setBusy(false);
        }}
      >
        Save to this browser
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid="save-to-browser-saved"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm('Forget this saved Hub from this browser? This cannot be undone.'))
          return;
        setBusy(true);
        await setOptInFlag(false);
        setOptedIn(false);
        setBusy(false);
      }}
    >
      Saved · Forget
    </button>
  );
}
