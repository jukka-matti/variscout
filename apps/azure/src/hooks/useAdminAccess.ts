import type { EasyAuthUser } from '../auth/easyAuth';

export type AdminGatingMode = 'roles-configured' | 'no-roles-fallback' | 'no-user';

export interface AdminAccess {
  isAdmin: boolean;
  gatingMode: AdminGatingMode;
}

const ADMIN_ROLE = 'VariScout.Admin';

export function useAdminAccess(user: EasyAuthUser | null): AdminAccess {
  if (!user) {
    return { isAdmin: false, gatingMode: 'no-user' };
  }

  // No roles defined at all → App Roles not configured → show to everyone (backward compatible)
  if (user.roles.length === 0) {
    return { isAdmin: true, gatingMode: 'no-roles-fallback' };
  }

  // Roles exist → check for admin role
  if (user.roles.includes(ADMIN_ROLE)) {
    return { isAdmin: true, gatingMode: 'roles-configured' };
  }

  // Roles configured but user doesn't have admin role
  return { isAdmin: false, gatingMode: 'roles-configured' };
}
