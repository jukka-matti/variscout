import { vrsExport, vrsImport, type VrsFile } from '@variscout/core';
import type { ProcessHub } from '@variscout/core/processHub';
import {
  buildDocumentSnapshot,
  type BuildDocumentSnapshotOptions,
  type DocumentSnapshot,
} from './documentSnapshot';

export interface DocumentSnapshotVrsFile extends VrsFile {
  documentSnapshot: DocumentSnapshot;
}

export interface BuildDocumentSnapshotVrsOptions {
  activeHub: NonNullable<BuildDocumentSnapshotOptions['activeHub']> & ProcessHub;
  metadata?: VrsFile['metadata'];
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

function legacyHubWithSnapshotProject(
  activeHub: BuildDocumentSnapshotVrsOptions['activeHub'],
  snapshot: DocumentSnapshot
): ProcessHub {
  const nextHub = { ...activeHub };
  if (snapshot.improvementProject) {
    nextHub.improvementProject = snapshot.improvementProject;
  } else {
    delete nextHub.improvementProject;
  }
  return nextHub;
}

export function buildDocumentSnapshotVrs(options: BuildDocumentSnapshotVrsOptions): string {
  const snapshot = buildDocumentSnapshot({ activeHub: options.activeHub });
  return vrsExport(
    legacyHubWithSnapshotProject(options.activeHub, snapshot),
    snapshot.project.rawData,
    options.metadata,
    snapshot,
    options.exportedAt
  );
}

export function isDocumentSnapshotVrsFile(file: VrsFile): file is DocumentSnapshotVrsFile {
  return isDocumentSnapshot(file.documentSnapshot);
}

export function parseDocumentSnapshotVrs(json: string): VrsFile | DocumentSnapshotVrsFile {
  const parsed = vrsImport(json);
  if (parsed.documentSnapshot === undefined) return parsed;
  if (!isDocumentSnapshot(parsed.documentSnapshot)) {
    throw new Error('Invalid .vrs documentSnapshot payload.');
  }
  return parsed as DocumentSnapshotVrsFile;
}
