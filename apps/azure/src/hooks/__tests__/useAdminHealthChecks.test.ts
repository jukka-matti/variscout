import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../auth/easyAuth', () => ({
  isLocalDev: vi.fn(() => false),
  getAccessToken: vi.fn(() => Promise.resolve('mock-token')),
}));

vi.mock('../../services/storageDurability', () => ({
  getStorageEstimate: vi
    .fn()
    .mockResolvedValue({ usageBytes: 1_048_576, quotaBytes: 10_485_760, persisted: false }),
  formatStorageEstimate: vi.fn().mockReturnValue('Using 1.0 MB of 10.0 MB · persistent: no'),
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
import { isLocalDev } from '../../auth/easyAuth';
import { searchDocuments } from '../../services/searchService';

describe('useAdminHealthChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isLocalDev).mockReturnValue(false);
  });

  it('initializes all checks as idle', () => {
    const { result } = renderHook(() => useAdminHealthChecks());
    expect(result.current.checks).toHaveLength(5);
    expect(result.current.checks.every(c => c.status === 'idle')).toBe(true);
    expect(result.current.isRunning).toBe(false);
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

  it('runAll runs all checks in parallel', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ user_claims: [{ typ: 'name', val: 'Test' }] }]),
    });
    vi.mocked(searchDocuments).mockResolvedValue([]);

    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runAll();
    });

    expect(result.current.checks.every(c => c.status === 'pass')).toBe(true);
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

  it('PO-8b: storage-durability check reports the quota estimate as detail', async () => {
    const { result } = renderHook(() => useAdminHealthChecks());
    await act(async () => {
      await result.current.runOne('storage-durability');
    });
    const check = result.current.checks.find(c => c.id === 'storage-durability');
    expect(check?.status).toBe('pass');
    expect(check?.detail).toBe('Using 1.0 MB of 10.0 MB · persistent: no');
  });
});
