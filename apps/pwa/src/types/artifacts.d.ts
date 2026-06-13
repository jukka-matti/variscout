declare module '@pwa-artifacts' {
  import type { ProcessHub } from '@variscout/core';
  import type { DocumentSnapshotVrsFile } from '@variscout/stores/document-snapshot-vrs';

  export function exportVrs(options: { activeHub: ProcessHub; appVersion: string }): void;
  export function parseVrsFile(file: File): Promise<DocumentSnapshotVrsFile>;
}
