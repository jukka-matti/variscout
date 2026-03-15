/**
 * Runtime configuration loader.
 *
 * Fetches env-var-based config from /config endpoint at startup.
 * Required for Azure Marketplace deployments where VITE_* env vars
 * are baked at build time but runtime values vary per deployment.
 */

export interface RuntimeConfig {
  plan: string;
  functionUrl: string;
  aiEndpoint: string;
  aiSearchEndpoint: string;
  aiSearchIndex: string;
}

let cached: RuntimeConfig | null = null;

/**
 * Load runtime config from /config endpoint.
 * Called once at app startup before React renders.
 * Falls back to empty config on error (dev mode, tests).
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cached) return cached;

  try {
    const res = await fetch('/config');
    if (res.ok) {
      cached = await res.json();
      return cached!;
    }
  } catch {
    // Dev mode or tests — /config not available
  }

  // Fallback: empty config, consumers fall back to import.meta.env
  cached = {
    plan: '',
    functionUrl: '',
    aiEndpoint: '',
    aiSearchEndpoint: '',
    aiSearchIndex: '',
  };
  return cached;
}

/**
 * Get cached runtime config.
 * Returns null if loadRuntimeConfig() hasn't been called yet.
 */
export function getRuntimeConfig(): RuntimeConfig | null {
  return cached;
}
