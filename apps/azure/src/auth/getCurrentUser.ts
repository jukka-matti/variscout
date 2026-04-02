/**
 * Resolve the current user's display name and email.
 *
 * Priority (ADR-059 — Teams SSO removed):
 * 1. Local dev → "Local Developer" (mock)
 * 2. EasyAuth → `getEasyAuthUser().name`
 */

import { getEasyAuthUser, isLocalDev } from './easyAuth';

export interface CurrentUser {
  name: string;
  email: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isLocalDev()) {
    return { name: 'Local Developer', email: 'dev@localhost' };
  }

  const user = await getEasyAuthUser();
  return user ? { name: user.name, email: user.email } : null;
}
