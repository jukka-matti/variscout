// EasyAuth helper — wraps App Service Authentication (/.auth/*) endpoints.
// In local dev, falls back to mock data so the app runs without Azure.

export interface EasyAuthUser {
  name: string;
  email: string;
  userId: string;
}

interface EasyAuthClaim {
  typ: string;
  val: string;
}

interface EasyAuthProvider {
  provider_name: string;
  user_id: string;
  user_claims: EasyAuthClaim[];
  access_token: string;
  expires_on: string;
}

export function isLocalDev(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

const LOCAL_USER: EasyAuthUser = {
  name: 'Local Developer',
  email: 'dev@localhost',
  userId: 'local-dev',
};

function findClaim(claims: EasyAuthClaim[], type: string): string | undefined {
  return claims.find(c => c.typ === type)?.val;
}

/** Fetch the current user from the EasyAuth token store. */
export async function getEasyAuthUser(): Promise<EasyAuthUser | null> {
  if (isLocalDev()) return LOCAL_USER;

  try {
    const res = await fetch('/.auth/me');
    if (!res.ok) return null;

    const data: EasyAuthProvider[] = await res.json();
    if (!data || data.length === 0) return null;

    const provider = data[0];
    const claims = provider.user_claims;

    return {
      name:
        findClaim(claims, 'name') ||
        findClaim(claims, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name') ||
        'User',
      email:
        findClaim(claims, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') ||
        findClaim(claims, 'preferred_username') ||
        '',
      userId: provider.user_id,
    };
  } catch {
    return null;
  }
}

/** Get an access token for Graph API from the EasyAuth token store. */
export async function getAccessToken(): Promise<string> {
  if (isLocalDev()) {
    throw new Error('Graph API is not available in local development');
  }

  const res = await fetch('/.auth/me');
  if (!res.ok) throw new Error('Not authenticated');

  const data: EasyAuthProvider[] = await res.json();
  if (!data || data.length === 0) throw new Error('No auth provider found');

  const token = data[0].access_token;
  if (!token) throw new Error('No access token in EasyAuth response');

  return token;
}

/** Check whether the user has an active EasyAuth session. */
export async function isAuthenticated(): Promise<boolean> {
  if (isLocalDev()) return true;

  try {
    const user = await getEasyAuthUser();
    return user !== null;
  } catch {
    return false;
  }
}

/** Redirect to EasyAuth login (Azure AD). */
export function login(): void {
  if (isLocalDev()) {
    window.location.reload();
    return;
  }
  window.location.href = '/.auth/login/aad';
}

/** Redirect to EasyAuth logout. */
export function logout(): void {
  if (isLocalDev()) {
    window.location.reload();
    return;
  }
  window.location.href = '/.auth/logout';
}
