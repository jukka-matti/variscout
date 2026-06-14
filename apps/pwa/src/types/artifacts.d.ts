declare module '@pwa-artifacts' {
  import type { ProcessHub } from '@variscout/core';
  import type { Consultation } from '@variscout/core/consultations';
  import type { DocumentSnapshotVrsFile } from '@variscout/stores/document-snapshot-vrs';
  import type { ResolvedView } from '@variscout/ui';

  export function exportVrs(options: { activeHub: ProcessHub; appVersion: string }): void;
  export function parseVrsFile(file: File): Promise<DocumentSnapshotVrsFile>;

  export function exportConsultationPack(options: {
    consultation: Consultation;
    views: ResolvedView[];
    from?: string;
    appVersion: string;
  }): void;
}
