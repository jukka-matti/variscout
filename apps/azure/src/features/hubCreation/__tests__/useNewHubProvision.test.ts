import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// vi.mock BEFORE component/hook imports (anti-hang rule)
vi.mock('../../../services/storage', () => ({
  useStorage: vi.fn(),
}));

import { useNewHubProvision } from '../useNewHubProvision';
import { useStorage } from '../../../services/storage';

const mockSaveProcessHub = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  (useStorage as ReturnType<typeof vi.fn>).mockReturnValue({
    saveProcessHub: mockSaveProcessHub,
  });
});

describe('useNewHubProvision', () => {
  it('calls saveProcessHub with a hub containing the goal narrative', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useNewHubProvision({ onCreated }));

    await act(async () => {
      await result.current.createHubFromGoal('We mold barrels for medical customers.');
    });

    expect(mockSaveProcessHub).toHaveBeenCalledOnce();
    const savedHub = mockSaveProcessHub.mock.calls[0][0];
    expect(savedHub.processGoal).toBe('We mold barrels for medical customers.');
    expect(savedHub.id).toBeTypeOf('string');
    expect(savedHub.id.length).toBeGreaterThan(0);
  });

  it('derives hub name from the first sentence of the goal', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useNewHubProvision({ onCreated }));

    await act(async () => {
      await result.current.createHubFromGoal('We monitor fill weight on Line 3. Nominal is best.');
    });

    const savedHub = mockSaveProcessHub.mock.calls[0][0];
    expect(savedHub.name).toBeTypeOf('string');
    expect(savedHub.name.length).toBeGreaterThan(0);
  });

  it('fires onCreated with the created hub', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useNewHubProvision({ onCreated }));

    let returnedHub;
    await act(async () => {
      returnedHub = await result.current.createHubFromGoal('Mold barrel precision.');
    });

    expect(onCreated).toHaveBeenCalledOnce();
    expect(onCreated.mock.calls[0][0]).toEqual(returnedHub);
  });

  it('creates a hub even with empty narrative (skip path)', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useNewHubProvision({ onCreated }));

    await act(async () => {
      await result.current.createHubFromGoal('');
    });

    expect(mockSaveProcessHub).toHaveBeenCalledOnce();
    const savedHub = mockSaveProcessHub.mock.calls[0][0];
    expect(savedHub.processGoal).toBeUndefined();
    expect(savedHub.name).toBe('Untitled hub');
  });

  it('returns isPending false (creation is fire-and-forget)', () => {
    const { result } = renderHook(() => useNewHubProvision({ onCreated: vi.fn() }));
    expect(result.current.isPending).toBe(false);
  });
});
