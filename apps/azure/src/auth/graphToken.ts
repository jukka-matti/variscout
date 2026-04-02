/**
 * Graph token cache — EasyAuth only (ADR-059).
 *
 * getGraphToken() removed (Teams/OBO exchange removed per ADR-059).
 * clearGraphTokenCache() retained for logout cleanup (used by App.tsx).
 */

/** Clear the cached token (e.g. on logout). */
export function clearGraphTokenCache(): void {
  // No-op: token cache removed with getGraphToken (ADR-059).
}
