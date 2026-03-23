import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('runtimeConfig', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.resetModules();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    consoleSpy.mockClear();
  });

  async function importModule() {
    return import('../runtimeConfig');
  }

  it('returns and caches config on successful fetch', async () => {
    const validConfig = {
      plan: 'team',
      aiEndpoint: 'https://ai.openai.azure.com',
      aiSearchEndpoint: 'https://search.windows.net',
      aiSearchIndex: 'findings',
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(validConfig),
    } as Response);

    const { loadRuntimeConfig } = await importModule();
    const result = await loadRuntimeConfig();

    expect(result).toEqual(validConfig);
    expect(fetchSpy).toHaveBeenCalledWith('/config');
  });

  it('returns cached config on second call without re-fetching', async () => {
    const validConfig = {
      plan: 'team',
      aiEndpoint: 'https://ai.openai.azure.com',
      aiSearchEndpoint: 'https://search.windows.net',
      aiSearchIndex: 'findings',
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(validConfig),
    } as Response);

    const { loadRuntimeConfig } = await importModule();
    const first = await loadRuntimeConfig();
    const second = await loadRuntimeConfig();

    expect(first).toEqual(validConfig);
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns empty config when fetch returns 404', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const { loadRuntimeConfig } = await importModule();
    const result = await loadRuntimeConfig();

    expect(result).toEqual({
      plan: '',
      aiEndpoint: '',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
      appInsightsConnectionString: '',
    });
  });

  it('returns empty config when fetch throws a network error', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'));

    const { loadRuntimeConfig } = await importModule();
    const result = await loadRuntimeConfig();

    expect(result).toEqual({
      plan: '',
      aiEndpoint: '',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
      appInsightsConnectionString: '',
    });
  });

  it('logs error and returns empty config when URLs use http://', async () => {
    const insecureConfig = {
      plan: 'team',
      aiEndpoint: 'http://ai.openai.azure.com',
      aiSearchEndpoint: 'https://search.windows.net',
      aiSearchIndex: 'findings',
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(insecureConfig),
    } as Response);

    const { loadRuntimeConfig } = await importModule();
    const result = await loadRuntimeConfig();

    expect(consoleSpy).toHaveBeenCalledWith('Runtime config contains invalid URLs');
    expect(result).toEqual({
      plan: '',
      aiEndpoint: '',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
      appInsightsConnectionString: '',
    });
  });

  it('allows empty string URLs (fallback to env vars)', async () => {
    const configWithEmptyUrls = {
      plan: 'standard',
      aiEndpoint: '',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(configWithEmptyUrls),
    } as Response);

    const { loadRuntimeConfig } = await importModule();
    const result = await loadRuntimeConfig();

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(result).toEqual(configWithEmptyUrls);
  });

  it('getRuntimeConfig returns null before loadRuntimeConfig is called', async () => {
    const { getRuntimeConfig } = await importModule();
    expect(getRuntimeConfig()).toBeNull();
  });

  it('getRuntimeConfig returns cached config after loadRuntimeConfig', async () => {
    const validConfig = {
      plan: 'team',
      aiEndpoint: 'https://ai.openai.azure.com',
      aiSearchEndpoint: 'https://search.windows.net',
      aiSearchIndex: 'findings',
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(validConfig),
    } as Response);

    const { loadRuntimeConfig, getRuntimeConfig } = await importModule();
    await loadRuntimeConfig();

    expect(getRuntimeConfig()).toEqual(validConfig);
  });
});
