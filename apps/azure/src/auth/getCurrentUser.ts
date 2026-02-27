/**
 * Resolve the current user's display name and email.
 *
 * Priority:
 * 1. Teams SSO JWT → decode `name` claim (no network call)
 * 2. Teams context → `userPrincipalName` (fallback if JWT decode fails)
 * 3. EasyAuth → `getEasyAuthUser().name` (Standard plan fallback)
 * 4. Local dev → "Local Developer" (mock)
 */

import { getTeamsSsoToken, getTeamsContext, isInTeams } from '../teams/teamsContext';
import { getEasyAuthUser, isLocalDev } from './easyAuth';

export interface CurrentUser {
  name: string;
  email: string;
}

/** Decode JWT payload without validation (user display only, not auth). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isLocalDev()) {
    return { name: 'Local Developer', email: 'dev@localhost' };
  }

  // 1. Try Teams SSO token for display name
  if (isInTeams()) {
    const ssoToken = await getTeamsSsoToken();
    if (ssoToken) {
      const claims = decodeJwtPayload(ssoToken);
      if (claims?.name) {
        return {
          name: claims.name as string,
          email: (claims.preferred_username as string) ?? '',
        };
      }
    }

    // 2. Fall back to Teams context UPN
    const ctx = getTeamsContext();
    if (ctx.userPrincipalName) {
      return { name: ctx.userPrincipalName, email: ctx.userPrincipalName };
    }
  }

  // 3. Fall back to EasyAuth
  const user = await getEasyAuthUser();
  return user ? { name: user.name, email: user.email } : null;
}
