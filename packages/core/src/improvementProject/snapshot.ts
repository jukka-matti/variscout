/**
 * D18 live-document state-machine helpers.
 *
 * `computeSourceHash(value)` produces a stable string fingerprint of a value
 * (used to detect upstream change). Lightweight — not cryptographic; suitable
 * only for change detection within a single browser session.
 *
 * `shouldShowDrift(snapshot, current)` returns true when the upstream source's
 * hash has changed since the snapshot was taken — UI uses this to surface a
 * "refresh from source" affordance per spec §11 D18.
 */

export function computeSourceHash(value: unknown): string {
  // JSON.stringify(undefined) returns undefined (not a string); normalise to a
  // sentinel literal so the function never throws on undefined inputs.
  const json = JSON.stringify(value) ?? '__undefined__';
  const lengthPart = json.length.toString(36);
  const hash = stringHash(json);
  return `${lengthPart}-${Math.abs(hash).toString(36)}`;
}

function stringHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export interface DriftableSnapshot<T> {
  value: T;
  sourceHash: string;
}

export interface DriftableCurrent<T> {
  value: T;
  hash: string;
}

export function shouldShowDrift<T>(
  snapshot: DriftableSnapshot<T>,
  current: DriftableCurrent<T>
): boolean {
  return snapshot.sourceHash !== current.hash;
}
