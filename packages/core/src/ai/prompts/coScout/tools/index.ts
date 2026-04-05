/**
 * CoScout tool registry — barrel export.
 *
 * Provides typed tool definitions with phase/mode/tier gating
 * as an alternative to the legacy `buildCoScoutTools()` function.
 */

export { TOOL_REGISTRY, getToolsForPhase } from './registry';
export type { ToolRegistryEntry, ToolName } from './registry';
