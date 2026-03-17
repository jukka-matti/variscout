import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock tier + preview
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    isTeamAIPlan: vi.fn(),
    isPreviewEnabled: vi.fn(),
  };
});

// Mock runtime config
vi.mock('../../lib/runtimeConfig', () => ({
  getRuntimeConfig: vi.fn(),
}));

// Mock auth
vi.mock('../../auth/easyAuth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
}));

import { indexFindingsToSearch } from '../indexService';
import { isTeamAIPlan, isPreviewEnabled } from '@variscout/core';
import { getRuntimeConfig } from '../../lib/runtimeConfig';
import type { Finding, Hypothesis } from '@variscout/core';

const mockIsTeamAIPlan = vi.mocked(isTeamAIPlan);
const mockIsPreviewEnabled = vi.mocked(isPreviewEnabled);
const mockGetRuntimeConfig = vi.mocked(getRuntimeConfig);

const mockFetch = vi.fn();

const sampleFindings: Finding[] = [
  {
    id: 'f1',
    text: 'High variation in Zone A',
    status: 'observed',
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    comments: [],
    statusChangedAt: Date.now(),
  } as Finding,
];

const sampleHypotheses: Hypothesis[] = [
  {
    id: 'h1',
    text: 'Temperature drift',
    status: 'untested',
    linkedFindingIds: ['f1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ideas: [],
  },
];

describe('indexService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Default: all conditions met
    mockIsTeamAIPlan.mockReturnValue(true);
    mockIsPreviewEnabled.mockReturnValue(true);
    mockGetRuntimeConfig.mockReturnValue({ functionUrl: 'https://func.example.com' } as ReturnType<
      typeof getRuntimeConfig
    >);

    mockFetch.mockResolvedValue({ ok: true });
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fetch when isTeamAIPlan returns false', async () => {
    mockIsTeamAIPlan.mockReturnValue(false);

    indexFindingsToSearch('Project', 'p1', sampleFindings);
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not fetch when preview is disabled', async () => {
    mockIsPreviewEnabled.mockReturnValue(false);

    indexFindingsToSearch('Project', 'p1', sampleFindings);
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not fetch when functionUrl is empty', async () => {
    mockGetRuntimeConfig.mockReturnValue(null);

    indexFindingsToSearch('Project', 'p1', sampleFindings);
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('debounces: only one fetch for two rapid calls', async () => {
    indexFindingsToSearch('Project', 'p1', sampleFindings);
    indexFindingsToSearch('Project', 'p1', sampleFindings);

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('debounce cancellation: sends only the last call data', async () => {
    const firstFindings = [{ ...sampleFindings[0], id: 'first' }] as Finding[];
    const secondFindings = [{ ...sampleFindings[0], id: 'second' }] as Finding[];

    indexFindingsToSearch('First', 'p1', firstFindings);
    indexFindingsToSearch('Second', 'p2', secondFindings);

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.projectName).toBe('Second');
    expect(body.projectId).toBe('p2');
    expect(body.findings[0].id).toBe('second');
  });

  it('sends correct payload with hypotheses', async () => {
    indexFindingsToSearch('My Project', 'proj-42', sampleFindings, sampleHypotheses);

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://func.example.com/api/index-findings');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers.Authorization).toBe('Bearer mock-token');

    const body = JSON.parse(options.body);
    expect(body).toEqual({
      projectName: 'My Project',
      projectId: 'proj-42',
      findings: sampleFindings,
      hypotheses: sampleHypotheses,
    });
  });

  it('defaults hypotheses to empty array when omitted', async () => {
    indexFindingsToSearch('Project', 'p1', sampleFindings);

    await vi.advanceTimersByTimeAsync(5000);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.hypotheses).toEqual([]);
  });

  it('does not throw when fetch rejects (fire-and-forget)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('Network failure'));

    indexFindingsToSearch('Project', 'p1', sampleFindings);
    await vi.advanceTimersByTimeAsync(5000);

    expect(warnSpy).toHaveBeenCalledWith('[indexService] Indexing error:', expect.any(Error));
    warnSpy.mockRestore();
  });

  it('logs warning when response is not ok', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    indexFindingsToSearch('Project', 'p1', sampleFindings);
    await vi.advanceTimersByTimeAsync(5000);

    expect(warnSpy).toHaveBeenCalledWith('[indexService] Indexing failed:', 500);
    warnSpy.mockRestore();
  });
});
