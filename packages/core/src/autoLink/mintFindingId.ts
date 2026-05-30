/**
 * Deterministic, content-derived finding-id minter for the IM-3 auto-link engine.
 *
 * The SAME (planId, column) pair always mints the SAME id — this is the
 * load-bearing idempotency guarantee shared by BOTH app hooks (Azure + PWA): a
 * reactive hook re-firing on identical data re-derives the identical id, so the
 * caller's "skip ids already in the store" dedupe makes the auto-Finding add a
 * no-op on re-run.
 *
 * Pure: a stable FNV-1a hash over `${planId}::${column}` formatted as a UUID-shaped
 * string. NO `crypto.randomUUID` / `Math.random` / `Date.now()` — keeps the engine
 * deterministic + testable and the two apps in lock-step.
 */

const AUTO_LINK_PREFIX = 'autolink';

/** FNV-1a 32-bit hash → unsigned 8-hex-char string. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV prime multiply via shifts to stay in int range.
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Mint a stable id for an auto-Finding originating from (planId, column).
 *
 * Format: `autolink-<hash(planId)>-<hash(column)>-<hash(planId::column)>` — the
 * three segments make collisions across different pairs astronomically unlikely
 * while keeping the id a pure function of its inputs.
 */
export function mintAutoLinkFindingId(planId: string, column: string): string {
  const pair = `${planId}::${column}`;
  return `${AUTO_LINK_PREFIX}-${fnv1a(planId)}-${fnv1a(column)}-${fnv1a(pair)}`;
}
