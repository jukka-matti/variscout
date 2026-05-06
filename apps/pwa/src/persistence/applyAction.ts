// apps/pwa/src/persistence/applyAction.ts
//
// Placeholder for the per-action Immer recipe dispatcher.
// P3.2 will replace this throw with a real reduce-over-action implementation.
//
// Keeping applyAction in a separate file creates a clean expansion seam:
// P3.2 only needs to touch this file; PwaHubRepository.ts stays unchanged.

import type { HubAction } from '@variscout/core/actions';
import type { ProcessHub } from '@variscout/core/processHub';

/**
 * Apply a single HubAction to a ProcessHub snapshot and return the next snapshot.
 *
 * @throws {Error} Always — implementation deferred to P3.2.
 */
export function applyAction(_hub: ProcessHub, _action: HubAction): ProcessHub {
  throw new Error('applyAction not yet implemented (P3.2)');
}
