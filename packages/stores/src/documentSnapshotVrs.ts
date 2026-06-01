import {
  buildDocumentSnapshot,
  type BuildDocumentSnapshotOptions,
  type DocumentSnapshot,
} from './documentSnapshot';

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

function isDocumentSnapshot(value: unknown): value is DocumentSnapshot {
  if (!isRecord(value)) return false;
  return (
    value.schemaVersion === 1 &&
    'hubId' in value &&
    (isRecord(value.hub) || value.hub === null) &&
    isRecord(value.project) &&
    isRecord(value.analyze) &&
    Array.isArray(value.analyze.findings) &&
    Array.isArray(value.analyze.categories) &&
    Array.isArray(value.analyze.hypotheses) &&
    Array.isArray(value.analyze.causalLinks) &&
    Array.isArray(value.analyze.scopes) &&
    isRecord(value.canvas) &&
    'improvementProject' in value
  );
}

export function buildDocumentSnapshotVrs(options: BuildDocumentSnapshotVrsOptions): string {
  const file: DocumentSnapshotVrsFile = {
    kind: 'variscout.document',
    version: 1,
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
    value.version === 1 &&
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
    throw new Error('Invalid file format.');
  }

  if (!isRecord(parsed) || parsed.kind !== 'variscout.document' || parsed.version !== 1) {
    throw new Error('Invalid file format.');
  }

  if ('hub' in parsed || 'rawData' in parsed) {
    throw new Error('Invalid file format.');
  }

  if (!isDocumentSnapshot(parsed.documentSnapshot)) {
    throw new Error('Invalid .vrs documentSnapshot payload.');
  }

  return parsed as unknown as DocumentSnapshotVrsFile;
}
