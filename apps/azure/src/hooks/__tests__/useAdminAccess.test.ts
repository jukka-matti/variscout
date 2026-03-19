import { describe, it, expect } from 'vitest';
import { useAdminAccess } from '../useAdminAccess';
import type { EasyAuthUser } from '../../auth/easyAuth';

function makeUser(roles: string[]): EasyAuthUser {
  return { name: 'Test User', email: 'test@example.com', userId: 'u-1', roles };
}

describe('useAdminAccess', () => {
  it('returns isAdmin: false and no-user when user is null', () => {
    const result = useAdminAccess(null);
    expect(result).toEqual({ isAdmin: false, gatingMode: 'no-user' });
  });

  it('returns isAdmin: true and no-roles-fallback when roles array is empty', () => {
    const result = useAdminAccess(makeUser([]));
    expect(result).toEqual({ isAdmin: true, gatingMode: 'no-roles-fallback' });
  });

  it('returns isAdmin: true and roles-configured when user has VariScout.Admin role', () => {
    const result = useAdminAccess(makeUser(['VariScout.Admin']));
    expect(result).toEqual({ isAdmin: true, gatingMode: 'roles-configured' });
  });

  it('returns isAdmin: false and roles-configured when user has other roles but not admin', () => {
    const result = useAdminAccess(makeUser(['SomeOtherRole']));
    expect(result).toEqual({ isAdmin: false, gatingMode: 'roles-configured' });
  });

  it('returns isAdmin: true when user has multiple roles including admin', () => {
    const result = useAdminAccess(makeUser(['Reader', 'VariScout.Admin', 'Contributor']));
    expect(result).toEqual({ isAdmin: true, gatingMode: 'roles-configured' });
  });

  it('returns isAdmin: false when user has multiple roles but not admin', () => {
    const result = useAdminAccess(makeUser(['Reader', 'Contributor']));
    expect(result).toEqual({ isAdmin: false, gatingMode: 'roles-configured' });
  });
});
