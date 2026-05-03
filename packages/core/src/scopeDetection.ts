import type { ProcessHubInvestigation } from './processHub';

export type Scope = 'b0' | 'b1' | 'b2';

/**
 * Classify an investigation by the cardinality of its nodeMappings.
 *
 * - b0: nodeMappings absent or empty (legacy, global-spec investigations)
 * - b1: nodeMappings.length > 1 (multi-step investigation)
 * - b2: nodeMappings.length === 1 (single-step deep dive)
 *
 * Per docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md §2.
 * Mirrors the existing detectYamazumiFormat() / detectDefectFormat() pattern.
 */
export function detectScope(investigation: ProcessHubInvestigation): Scope {
  const mappings = investigation.metadata?.nodeMappings ?? [];
  if (mappings.length === 0) return 'b0';
  if (mappings.length === 1) return 'b2';
  return 'b1';
}

/**
 * Classify a project by the cardinality of its `ProcessMap.nodes`.
 *
 * Used by FrameView in surfaces that don't have a `ProcessHubInvestigation`
 * (PWA + Azure top-level FRAME workspace) — the user has a `processMap` but
 * not yet any `nodeMappings`, so we derive scope structurally from the map.
 *
 * - b0: no process steps yet (the lightweight investigator entry / "what's your Y?")
 * - b1: 2+ steps (multi-step process map)
 * - b2: exactly 1 step (single-step deep dive)
 *
 * Adding the first step in the FRAME b0 expander auto-flips b0 → b2 (then b1
 * once a second step is added). This is intentionally structural; once
 * nodeMappings exist downstream, `detectScope(investigation)` takes over.
 *
 * Accepts a structural `{ nodes }` to keep this helper independent of the
 * full ProcessMap shape (callers pass either a real ProcessMap or undefined
 * when no map exists yet).
 */
export function detectScopeFromMap(
  processMap: { nodes: readonly unknown[] } | null | undefined
): Scope {
  const nodes = processMap?.nodes ?? [];
  if (nodes.length === 0) return 'b0';
  if (nodes.length === 1) return 'b2';
  return 'b1';
}
