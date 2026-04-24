/**
 * Runtime configuration loader.
 *
 * Fetches env-var-based config from /config endpoint at startup.
 * Required for Azure Marketplace deployments where VITE_* env vars
 * are baked at build time but runtime values vary per deployment.
 */

export interface RuntimeConfig {
  plan: string;
  aiEndpoint: string;
  aiSearchEndpoint: string;
  aiSearchIndex: string;
  appInsightsConnectionString: string;
  voiceInputEnabled: boolean;
  speechToTextDeployment: string;
}

let cached: RuntimeConfig | null = null;

function normalizeRuntimeConfig(data: Partial<RuntimeConfig> | null | undefined): RuntimeConfig {
  return {
    plan: data?.plan || '',
    aiEndpoint: data?.aiEndpoint || '',
    aiSearchEndpoint: data?.aiSearchEndpoint || '',
    aiSearchIndex: data?.aiSearchIndex || '',
    appInsightsConnectionString: data?.appInsightsConnectionString || '',
    voiceInputEnabled: data?.voiceInputEnabled === true,
    speechToTextDeployment: data?.speechToTextDeployment || '',
  };
}

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
      const data = await res.json();
      const normalized = normalizeRuntimeConfig(data);
      // Validate that URLs use HTTPS to prevent injection
      const isValidUrl = (s: string | undefined): boolean => {
        if (!s) return true; // undefined/empty is OK (falls back to env vars)
        try {
          return new URL(s).protocol === 'https:';
        } catch {
          return false;
        }
      };
      if (!isValidUrl(normalized.aiEndpoint) || !isValidUrl(normalized.aiSearchEndpoint)) {
        console.error('Runtime config contains invalid URLs');
      } else {
        cached = normalized;
        return cached!;
      }
    }
  } catch {
    // Dev mode or tests — /config not available
  }

  // Fallback: empty config, consumers fall back to import.meta.env
  cached = normalizeRuntimeConfig(null);
  return cached;
}

/**
 * Get cached runtime config.
 * Returns null if loadRuntimeConfig() hasn't been called yet.
 */
export function getRuntimeConfig(): RuntimeConfig | null {
  return cached;
}
