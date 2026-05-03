// apps/pwa/src/components/SaveToBrowserButton.tsx
import { useEffect, useState } from 'react';
import type { ProcessHub } from '@variscout/core/processHub';
import { hubRepository } from '../db/hubRepository';

export interface SaveToBrowserButtonProps {
  currentHub: ProcessHub;
}

export function SaveToBrowserButton({ currentHub }: SaveToBrowserButtonProps) {
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hubRepository.getOptInFlag().then(setOptedIn);
  }, []);

  // Auto-save on Hub change once opted in
  useEffect(() => {
    if (optedIn) {
      void hubRepository.saveHub(currentHub);
    }
  }, [optedIn, currentHub]);

  if (optedIn === null) return null; // initial load

  if (!optedIn) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await hubRepository.setOptInFlag(true);
          await hubRepository.saveHub(currentHub);
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
      disabled={busy}
      onClick={async () => {
        if (!window.confirm('Forget this saved Hub from this browser? This cannot be undone.'))
          return;
        setBusy(true);
        await hubRepository.setOptInFlag(false);
        setOptedIn(false);
        setBusy(false);
      }}
    >
      Saved · Forget
    </button>
  );
}
