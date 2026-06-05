import {
  buildDocumentSnapshot,
  type BuildDocumentSnapshotOptions,
  type DocumentSnapshot,
} from './documentSnapshot';
import {
  CURRENT_DOCUMENT_SCHEMA_VERSION,
  DocumentSnapshotCorruptError,
  DocumentSnapshotVersionMismatchError,
  isDocumentSnapshot,
  validateDocumentSnapshot,
} from './documentSnapshotValidation';

export interface DocumentSnapshotVrsMetadata {
  exportSource?: 'pwa' | 'azure' | string;
  appVersion?: string;
  [key: string]: unknown;
}

export interface DocumentSnapshotVrsFile {
  kind: 'variscout.document';
  version: 1;
  exportedAt: string;
  metadata?: DocumentSnapshotVrsMetadata;
  documentSnapshot: DocumentSnapshot;
}

export interface BuildDocumentSnapshotVrsOptions {
  activeHub: NonNullable<BuildDocumentSnapshotOptions['activeHub']>;
  metadata?: DocumentSnapshotVrsMetadata;
  exportedAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function buildDocumentSnapshotVrs(options: BuildDocumentSnapshotVrsOptions): string {
  const file: DocumentSnapshotVrsFile = {
    kind: 'variscout.document',
    version: CURRENT_DOCUMENT_SCHEMA_VERSION,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    ...(options.metadata ? { metadata: options.metadata } : {}),
    documentSnapshot: buildDocumentSnapshot({ activeHub: options.activeHub }),
  };

  return JSON.stringify(file, null, 2);
}

export function isDocumentSnapshotVrsFile(value: unknown): value is DocumentSnapshotVrsFile {
  return (
    isRecord(value) &&
    value.kind === 'variscout.document' &&
    value.version === CURRENT_DOCUMENT_SCHEMA_VERSION &&
    typeof value.exportedAt === 'string' &&
    !('hub' in value) &&
    !('rawData' in value) &&
    isDocumentSnapshot(value.documentSnapshot)
  );
}

export function parseDocumentSnapshotVrs(json: string): DocumentSnapshotVrsFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new DocumentSnapshotCorruptError('Invalid file format.');
  }

  if (!isRecord(parsed) || parsed.kind !== 'variscout.document') {
    throw new DocumentSnapshotCorruptError('Invalid file format.');
  }

  // Envelope version is co-versioned with documentSnapshot.schemaVersion (always
  // written together — see buildDocumentSnapshotVrs). A different NUMERIC version
  // is a version mismatch (refresh hint); anything else is invalid format.
  if (typeof parsed.version === 'number' && parsed.version !== CURRENT_DOCUMENT_SCHEMA_VERSION) {
    throw new DocumentSnapshotVersionMismatchError(parsed.version);
  }
  if (parsed.version !== CURRENT_DOCUMENT_SCHEMA_VERSION) {
    throw new DocumentSnapshotCorruptError('Invalid file format.');
  }

  if ('hub' in parsed || 'rawData' in parsed) {
    throw new DocumentSnapshotCorruptError('Invalid file format.');
  }

  validateDocumentSnapshot(parsed.documentSnapshot);

  return parsed as unknown as DocumentSnapshotVrsFile;
}
