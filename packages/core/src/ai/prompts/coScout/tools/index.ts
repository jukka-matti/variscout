/**
 * CoScout tool registry — barrel export.
 *
 * Provides typed tool definitions with phase/mode/tier gating
 * (replaces the former `buildCoScoutTools()` from the deleted legacy.ts).
 */

export { TOOL_REGISTRY, getToolsForPhase } from './registry';
export type { ToolRegistryEntry, ToolName, BuildCoScoutToolsOptions } from './registry';
