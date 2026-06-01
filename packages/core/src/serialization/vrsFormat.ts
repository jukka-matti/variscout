export const VRS_DOCUMENT_KIND = 'variscout.document' as const;
export const VRS_VERSION = 1 as const;

export interface VrsFile {
  kind: typeof VRS_DOCUMENT_KIND;
  version: typeof VRS_VERSION;
  exportedAt: string;
  metadata?: Record<string, unknown>;
  documentSnapshot: unknown;
}
