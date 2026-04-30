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
