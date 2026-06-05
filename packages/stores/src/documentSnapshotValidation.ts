/**
 * PO-8a loud validation at the document hydrate seam (ADR-091 "loud validation
 * is PO-8a"; spec §16). Covers ALL load paths uniformly — Azure blob, Azure
 * Dexie cache, and .vrs import — because every path converges on
 * hydrateDocumentSnapshot.
 *
 * Dev-phase no-compat principle (spec §16, decision-log 2026-06-05): no
 * migration machinery, no newer-than-reader read-only mode. A version mismatch
 * is a stale-tab/stale-cache event in an evergreen web deployment — the remedy
 * is a refresh, so the error message says so.
 *
 * Deliberately SHALLOW: structural shape only, never field-level assertions
 * (ADR-091 codifies silent-drop for unknown/renamed member keys — the PO-7
 * legacy-scope documentation-by-test depends on this staying shallow).
 */
import type { DocumentSnapshot } from './documentSnapshot';

export const CURRENT_DOCUMENT_SCHEMA_VERSION = 1;

/** A structurally valid snapshot whose schemaVersion differs from this build's. */
export class DocumentSnapshotVersionMismatchError extends Error {
  readonly foundVersion: number;

  constructor(foundVersion: number) {
    super(
      `This project was saved by a different version of VariScout ` +
        `(schema v${foundVersion}; this app reads v${CURRENT_DOCUMENT_SCHEMA_VERSION}). ` +
        `Refresh the app to update, then try again.`
    );
    this.name = 'DocumentSnapshotVersionMismatchError';
    this.foundVersion = foundVersion;
  }
}

/** Malformed / structurally invalid snapshot data — fails loudly, never hydrates. */
export class DocumentSnapshotCorruptError extends Error {
  constructor(message = 'Invalid documentSnapshot payload.') {
    super(message);
    this.name = 'DocumentSnapshotCorruptError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasDocumentSnapshotShape(value: Record<string, unknown>): boolean {
  const analyze = value.analyze;
  if (!isRecord(analyze)) return false;
  const a = analyze as Record<string, unknown>;
  return (
    'hubId' in value &&
    (isRecord(value.hub) || value.hub === null) &&
    isRecord(value.project) &&
    Array.isArray(a.findings) &&
    Array.isArray(a.categories) &&
    Array.isArray(a.hypotheses) &&
    Array.isArray(a.causalLinks) &&
    Array.isArray(a.scopes) &&
    isRecord(value.canvas) &&
    'improvementProject' in value
  );
}

/**
 * Strict-assert that a value is a loadable current-version DocumentSnapshot.
 * Throws DocumentSnapshotVersionMismatchError for a numeric non-current
 * schemaVersion (diagnosed BEFORE shape — a foreign-version shape can't be
 * judged against this build's expectations), DocumentSnapshotCorruptError
 * for everything else. Returns the (narrowed) input on success.
 */
export function validateDocumentSnapshot(value: unknown): DocumentSnapshot {
  if (!isRecord(value)) {
    throw new DocumentSnapshotCorruptError();
  }
  if (
    typeof value.schemaVersion === 'number' &&
    value.schemaVersion !== CURRENT_DOCUMENT_SCHEMA_VERSION
  ) {
    throw new DocumentSnapshotVersionMismatchError(value.schemaVersion);
  }
  if (value.schemaVersion !== CURRENT_DOCUMENT_SCHEMA_VERSION || !hasDocumentSnapshotShape(value)) {
    throw new DocumentSnapshotCorruptError();
  }
  return value as unknown as DocumentSnapshot;
}

/** Boolean companion for callers that branch instead of throwing. */
export function isDocumentSnapshot(value: unknown): value is DocumentSnapshot {
  try {
    validateDocumentSnapshot(value);
    return true;
  } catch {
    return false;
  }
}
