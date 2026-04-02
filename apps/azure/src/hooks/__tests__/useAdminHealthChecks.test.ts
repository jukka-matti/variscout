import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies before imports
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    getPlan: vi.fn(() => 'team'),
    hasTeamFeatures: vi.fn(() => true),
  };
});

vi.mock('../../auth/easyAuth', () => ({
  isLocalDev: vi.fn(() => false),
  getAccessToken: vi.fn(() => Promise.resolve('mock-token')),
}));

vi.mock('../../services/searchService', () => ({
  searchDocuments: vi.fn(),
}));

vi.mock('../../lib/runtimeConfig', () => ({
  getRuntimeConfig: vi.fn(() => ({
    aiEndpoint: 'https://ai.example.com',
    aiSearchEndpoint: 'https://search.example.com',
  })),
}));

import { useAdminHealthChecks } from '../useAdminHealthChecks';
import { hasTeamFeatures } from '@variscout/core';
import { isLocalDev } from '../../auth/easyAuth';
import { searchDocuments } from '../../services/searchService';

describe('useAdminHealthChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasTeamFeatures).mockReturnValue(true);
    vi.mocked(isLocalDev).mockReturnValue(false);
  });

  it('initializes all checks as idle when all plans are applicable', () => {
    const { result } = renderHook(() => useAdminHealthChecks());
    expect(result.current.checks).toHaveLength(4);
    expect(result.current.checks.every(c => c.status === 'idle')).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('marks team-only checks as na when plan is standard', () => {
    vi.mocked(hasTeamFeatures).mockReturnValue(false);

    const { result } = renderHook(() => useAdminHealthChecks());
    const teamChecks = result.current.checks.filter(c => c.plan === 'team');
    expect(teamChecks.every(c => c.status === 'na')).toBe(true);

    const allChecks = result.current.checks.filter(c => c.plan === 'all');
    expect(allChecks.every(c => c.status === 'idle')).toBe(true);
  });

  it('runOne sets pass on successful auth check', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ user_claims: [{ typ: 'name', val: 'Test' }] }]),
    });

    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runOne('auth');
    });

    const authCheck = result.current.checks.find(c => c.id === 'auth');
    expect(authCheck?.status).toBe('pass');
  });

  it('runOne sets fail on failed auth check', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runOne('auth');
    });

    const authCheck = result.current.checks.find(c => c.id === 'auth');
    expect(authCheck?.status).toBe('fail');
    expect(authCheck?.error).toContain('401');
  });

  it('runOne returns pass for auth on localhost', async () => {
    vi.mocked(isLocalDev).mockReturnValue(true);

    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runOne('auth');
    });

    const authCheck = result.current.checks.find(c => c.id === 'auth');
    expect(authCheck?.status).toBe('pass');
  });

  it('runOne sets pass on graph-profile check (Graph API stubbed per ADR-059)', async () => {
    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runOne('graph-profile');
    });

    const check = result.current.checks.find(c => c.id === 'graph-profile');
    expect(check?.status).toBe('pass');
  });

  it('runOne skips na checks when plan lacks team features', async () => {
    vi.mocked(hasTeamFeatures).mockReturnValue(false);

    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runOne('ai-search');
    });

    const check = result.current.checks.find(c => c.id === 'ai-search');
    expect(check?.status).toBe('na');
  });

  it('runAll runs all applicable checks in parallel', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ user_claims: [{ typ: 'name', val: 'Test' }] }]),
    });
    vi.mocked(searchDocuments).mockResolvedValue([]);

    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runAll();
    });

    const applicableChecks = result.current.checks.filter(c => c.status !== 'na');
    expect(applicableChecks.every(c => c.status === 'pass')).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('runAll handles mixed pass/fail results', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/.auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ user_claims: [{ typ: 'name', val: 'Test' }] }]),
        });
      }
      // AI endpoint check
      return Promise.resolve({ ok: true });
    });
    vi.mocked(searchDocuments).mockRejectedValue(new Error('Search failed'));

    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runAll();
    });

    const authCheck = result.current.checks.find(c => c.id === 'auth');
    expect(authCheck?.status).toBe('pass');

    // Graph checks now always pass (stubbed per ADR-059)
    const graphCheck = result.current.checks.find(c => c.id === 'graph-profile');
    expect(graphCheck?.status).toBe('pass');
  });
});
