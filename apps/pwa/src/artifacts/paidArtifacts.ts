import type { ProcessHub } from '@variscout/core';
import {
  buildDocumentSnapshotVrs,
  parseDocumentSnapshotVrs,
  type DocumentSnapshotVrsFile,
} from '@variscout/stores/document-snapshot-vrs';

interface ExportVrsOptions {
  activeHub: ProcessHub;
  appVersion: string;
}

export function exportVrs({ activeHub, appVersion }: ExportVrsOptions): void {
  const json = buildDocumentSnapshotVrs({
    activeHub,
    metadata: {
      exportSource: 'pwa',
      appVersion,
    },
  });
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (activeHub.processGoal ?? 'hub').slice(0, 32).replace(/[^a-z0-9-]+/gi, '-');
  a.download = `${safeName}.vrs`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseVrsFile(file: File): Promise<DocumentSnapshotVrsFile> {
  return parseDocumentSnapshotVrs(await file.text());
}
