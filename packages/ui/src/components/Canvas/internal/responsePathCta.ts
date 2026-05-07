/**
 * Maps `(path, signals, hasHandler)` to a `ResponsePathCtaState` for each of
 * the five response-path CTAs in the canvas drill-down. Charter, Sustainment,
 * and Handoff are prerequisite-gated (intervention exists / sustainment
 * confirmed); Quick action and Focused investigation are never gated.
 * `'hidden'` is reserved for the case where a path's handler is not wired —
 * we hide rather than tease unfinished features.
 *
 * Vision spec: docs/superpowers/specs/2026-05-03-variscout-vision-design.md §5.3
 */

import type { WorkflowReadinessSignals } from '@variscout/core';
import { isCharterReady, isSustainmentReady, isHandoffReady } from '@variscout/core';

export type ResponsePathKind =
  | 'quick-action'
  | 'focused-investigation'
  | 'charter'
  | 'sustainment'
  | 'handoff';

export type PrerequisiteLockedReason = 'no-intervention' | 'no-sustainment-confirmed';

export type ResponsePathCtaState =
  | { kind: 'active' }
  | { kind: 'prerequisite-locked'; reason: PrerequisiteLockedReason }
  | { kind: 'hidden' };

export interface ComputeCtaStateInput {
  path: ResponsePathKind;
  signals: WorkflowReadinessSignals;
  hasHandler: boolean;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled response-path kind: ${String(value)}`);
}

export function computeCtaState({
  path,
  signals,
  hasHandler,
}: ComputeCtaStateInput): ResponsePathCtaState {
  switch (path) {
    case 'quick-action':
    case 'focused-investigation':
      return hasHandler ? { kind: 'active' } : { kind: 'hidden' };
    case 'charter':
      // Charter has no workflow prerequisite (DMAIC Define-phase artifact).
      return hasHandler && isCharterReady(signals) ? { kind: 'active' } : { kind: 'hidden' };
    case 'sustainment':
      if (!isSustainmentReady(signals)) {
        return { kind: 'prerequisite-locked', reason: 'no-intervention' };
      }
      return hasHandler ? { kind: 'active' } : { kind: 'hidden' };
    case 'handoff':
      if (!isHandoffReady(signals)) {
        return { kind: 'prerequisite-locked', reason: 'no-sustainment-confirmed' };
      }
      return hasHandler ? { kind: 'active' } : { kind: 'hidden' };
    default:
      return assertNever(path);
  }
}
