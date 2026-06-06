import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ProcessHub } from '@variscout/core/processHub';

// vi.mock BEFORE component/hook imports (anti-hang rule, writing-tests discipline)
vi.mock('../../../auth/getCurrentUser', () => ({
  getCurrentUser: vi.fn(),
}));

// NOTE: useStorage is intentionally NOT mocked here — useNewHubProvision has no
// storage import (eager-persist retired, spec §3 Word-style durability).
// The eager-persist regression is guarded by Dashboard.processHub.test.tsx's
// load-bearing control (the page-level mock still resolves the real storage seam).

import { useNewHubProvision } from '../useNewHubProvision';
import { getCurrentUser } from '../../../auth/getCurrentUser';
import { useUnsavedHubsStore } from '../../hubs/unsavedHubsStore';

// ProcessHub extended with the optional improvementProject that ensureHubProject attaches
type HubWithOptionalIP = ProcessHub & {
  improvementProject?: {
    metadata: { title: string; members: Array<{ role: string; userId: string }> };
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  // Canonical reset from unsavedHubsStore.test.ts
  useUnsavedHubsStore.setState(useUnsavedHubsStore.getInitialState(), true);
  // Default: authenticated dev user
  (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
    name: 'Local Developer',
    email: 'analyst@contoso.com',
  });
});

describe('useNewHubProvision — in-memory Untitled pair (FSJ-3a spec §3)', () => {
  it('creates the hub + Untitled project pair in-memory (Word-style: no eager persist)', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useNewHubProvision({ onCreated }));

    let hub: HubWithOptionalIP | undefined;
    await act(async () => {
      hub = (await result.current.createHubFromGoal('')) as HubWithOptionalIP;
    });

    // Hub shape
    expect(hub).toBeDefined();
    expect(hub!.name).toBe('Untitled hub');

    // IP pair present
    const ip = hub!.improvementProject;
    expect(ip).toBeTruthy();
    expect(ip!.metadata.title).toBe('Untitled project');

    // Lead member uses the mocked email
    const lead = ip!.metadata.members[0];
    expect(lead.role).toBe('lead');
    expect(lead.userId).toBe('analyst@contoso.com');

    // Registered in the unsaved store
    expect(useUnsavedHubsStore.getState().isUnsaved(hub!.id)).toBe(true);

    // onCreated fires with the same hub object
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onCreated.mock.calls[0][0]).toBe(hub);
  });

  it('derives hub + project name from the goal narrative', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useNewHubProvision({ onCreated }));

    let hub: HubWithOptionalIP | undefined;
    await act(async () => {
      hub = (await result.current.createHubFromGoal(
        'Reduce order-to-ship cycle time. Customers wait too long.'
      )) as HubWithOptionalIP;
    });

    // Name is derived, not the fallback
    expect(hub!.name).not.toBe('Untitled hub');

    // IP title mirrors hub name
    expect(hub!.improvementProject!.metadata.title).toBe(hub!.name);

    // Goal narrative is preserved
    expect(hub!.processGoal).toContain('Reduce order-to-ship');
  });

  it('pre-auth (getCurrentUser → null): hub is created WITHOUT a project (no empty-creator IP)', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const onCreated = vi.fn();
    const { result } = renderHook(() => useNewHubProvision({ onCreated }));

    let hub: HubWithOptionalIP | undefined;
    await act(async () => {
      hub = (await result.current.createHubFromGoal('')) as HubWithOptionalIP;
    });

    // No IP on a bare hub
    expect(hub!.improvementProject).toBeUndefined();

    // Still registered unsaved
    expect(useUnsavedHubsStore.getState().isUnsaved(hub!.id)).toBe(true);

    // onCreated still fires
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onCreated.mock.calls[0][0]).toBe(hub);
  });

  it('returns isPending false (creation is fire-and-forget)', () => {
    const { result } = renderHook(() => useNewHubProvision({ onCreated: vi.fn() }));
    expect(result.current.isPending).toBe(false);
  });

  it('auth fetch failure degrades to the pre-auth bare-hub path (no rejection)', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));

    const onCreated = vi.fn();
    const { result } = renderHook(() => useNewHubProvision({ onCreated }));

    let hub: HubWithOptionalIP | undefined;
    // Must resolve, not reject
    await act(async () => {
      hub = (await result.current.createHubFromGoal('')) as HubWithOptionalIP;
    });

    // No IP on the bare hub — same as the pre-auth null path
    expect(hub!.improvementProject).toBeUndefined();

    // Still registered unsaved
    expect(useUnsavedHubsStore.getState().isUnsaved(hub!.id)).toBe(true);

    // onCreated fires
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onCreated.mock.calls[0][0]).toBe(hub);
  });
});
