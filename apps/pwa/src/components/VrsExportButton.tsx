// apps/pwa/src/components/VrsExportButton.tsx
import type { ProcessHub } from '@variscout/core/processHub';
import { vrsExport } from '@variscout/core';

export interface VrsExportButtonProps {
  currentHub: ProcessHub;
  currentData?: Array<Record<string, unknown>>;
}

export function VrsExportButton({ currentHub, currentData }: VrsExportButtonProps) {
  const onClick = () => {
    const json = vrsExport(currentHub, currentData, {
      exportSource: 'pwa',
      appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (currentHub.processGoal ?? 'hub').slice(0, 32).replace(/[^a-z0-9-]+/gi, '-');
    a.download = `${safeName}.vrs`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={onClick}>
      Export .vrs
    </button>
  );
}
