import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInvitationSync } from '../useInvitationSync';

describe('useInvitationSync', () => {
  it('returns a lookupUser function that resolves Azure AD user info', async () => {
    const { result } = renderHook(() => useInvitationSync());
    const user = await result.current.lookupUser('test@org.com');
    expect(user).toEqual({
      userId: 'test@org.com',
      displayName: expect.any(String),
    });
  });

  it('returns null for invalid input', async () => {
    const { result } = renderHook(() => useInvitationSync());
    const user = await result.current.lookupUser('');
    expect(user).toBeNull();
  });
});
