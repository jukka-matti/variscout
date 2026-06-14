import type { ProcessHub } from '@variscout/core';
import type { Consultation } from '@variscout/core/consultations';
import type { DocumentSnapshotVrsFile } from '@variscout/stores/document-snapshot-vrs';
import type { ResolvedView } from '@variscout/ui';

interface ExportVrsOptions {
  activeHub: ProcessHub;
  appVersion: string;
}

export function exportVrs(_options: ExportVrsOptions): void {
  throw new Error('Artifact export is not available in this Workspace channel.');
}

export async function parseVrsFile(_file: File): Promise<DocumentSnapshotVrsFile> {
  throw new Error('Artifact import is not available in this Workspace channel.');
}

interface ExportConsultationPackOptions {
  consultation: Consultation;
  views: ResolvedView[];
  from?: string;
  appVersion: string;
}

export function exportConsultationPack(_opts: ExportConsultationPackOptions): void {
  throw new Error('Artifact export is not available in this Workspace channel.');
}
