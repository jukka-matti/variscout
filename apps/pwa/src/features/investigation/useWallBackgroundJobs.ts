/**
 * useWallBackgroundJobs — PWA stub
 *
 * The Azure app extends `aiStore` with `wallSuggestions` and runs a background
 * best-subsets detector on a 2s debounce to surface proactive CoScout hints.
 * The PWA has no aiStore (it's context-based, session-only) so there is no
 * emit target — this is a deliberate no-op that exists only so shared
 * workspace components can call `useWallBackgroundJobs()` regardless of which
 * app mounts them.
 *
 * If the PWA later grows a suggestion surface, wire the same debounced
 * detector here and emit through whatever PWA-side channel is appropriate.
 *
 * # Emit-target decision (Phase 9.2 deviation note)
 *
 * Mirrors the Azure twin's decision recorded in
 * `apps/azure/src/features/investigation/useWallBackgroundJobs.ts`.
 */

export function useWallBackgroundJobs(): void {
  // Intentionally a no-op in PWA. See JSDoc above.
}
