import { VRS_DOCUMENT_KIND, VRS_VERSION, type VrsFile } from './vrsFormat';

export function vrsExport(
  documentSnapshot: unknown,
  metadata?: VrsFile['metadata'],
  exportedAt = new Date().toISOString()
): string {
  const file: VrsFile = {
    kind: VRS_DOCUMENT_KIND,
    version: VRS_VERSION,
    exportedAt,
    metadata,
    documentSnapshot,
  };
  return JSON.stringify(file, null, 2);
}
