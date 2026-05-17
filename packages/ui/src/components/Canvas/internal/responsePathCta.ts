/**
 * Maps `(path, hasHandler)` to a `ResponsePathCtaState` for each of the three
 * canvas drill-down response-path CTAs. All three (Quick action, Focused
 * investigation, Improvement Project) are always-available — `'hidden'` is
 * reserved for the case where a path's handler is not wired (we hide rather
 * than tease unfinished features).
 *
 * Wedge spec: docs/superpowers/specs/2026-05-16-wedge-architecture-design.md §3
 */

import { assertNever } from '@variscout/core/types';

export type ResponsePathKind = 'quick-action' | 'focused-investigation' | 'charter';

export type ResponsePathCtaState = { kind: 'active' } | { kind: 'hidden' };

export interface ComputeCtaStateInput {
  path: ResponsePathKind;
  hasHandler: boolean;
}

export function computeCtaState({ path, hasHandler }: ComputeCtaStateInput): ResponsePathCtaState {
  switch (path) {
    case 'quick-action':
    case 'focused-investigation':
    case 'charter':
      return hasHandler ? { kind: 'active' } : { kind: 'hidden' };
    default:
      return assertNever(path);
  }
}
