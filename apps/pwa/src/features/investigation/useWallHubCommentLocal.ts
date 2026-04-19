/**
 * useWallHubCommentLocal — PWA twin of the Azure useWallHubCommentLifecycle.
 *
 * The PWA has no server (ADR-059: browser-only processing, customer-owned
 * data) — there is no SSE endpoint to subscribe to and no multi-user
 * collaboration surface. Hub comments on the PWA are a single-user local
 * concept: they still flow through investigationStore.addHubComment's
 * optimistic append path (the store is shared), but the network POST is
 * skipped because projectStore.projectId is null on the PWA.
 *
 * This hook exists purely so InvestigationWorkspace's render tree does not
 * branch on app identity — both apps can import a matching hook signature,
 * and the PWA gets a well-documented no-op. Multi-user collaboration is
 * server-gated and stays on the Azure Team plan.
 *
 * If a future release adds a PWA-local peer discovery path (e.g. via
 * WebRTC / BroadcastChannel for same-device tabs), this hook is the right
 * place to land that implementation.
 */

export function useWallHubCommentLocal(): void {
  // Intentionally empty: PWA persistence = session-only, collaboration =
  // not available. See module JSDoc for the rationale tied to ADR-059.
}
