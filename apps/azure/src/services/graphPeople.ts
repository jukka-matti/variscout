/**
 * Graph People API — search for colleagues relevant to the signed-in user.
 *
 * Used by PeoplePicker for the @mention workflow (Team plan only).
 * Returns people from org chart adjacency, recent collaborators, Teams channel members.
 */

import { getGraphToken } from '../auth/graphToken';

export interface GraphUser {
  /** Azure AD object ID */
  id: string;
  /** Display name */
  displayName: string;
  /** User principal name (e.g. jane@contoso.com) */
  userPrincipalName: string;
}

/**
 * Search for people relevant to the current user via Graph People API.
 *
 * GET /me/people?$search="{query}"&$top=5&$select=id,displayName,userPrincipalName
 *
 * @returns Up to 5 matching people, or empty array on error
 */
export async function searchPeople(query: string): Promise<GraphUser[]> {
  if (!query.trim()) return [];

  const token = await getGraphToken();

  const params = new URLSearchParams({
    $search: `"${query}"`,
    $top: '5',
    $select: 'id,displayName,userPrincipalName',
    $filter: "personType/class eq 'Person' and personType/subclass eq 'OrganizationUser'",
  });

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/people?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.warn('[GraphPeople] Search failed:', res.status, res.statusText);
    return [];
  }

  const data = await res.json();
  return (data.value ?? []).map((p: Record<string, string>) => ({
    id: p.id,
    displayName: p.displayName,
    userPrincipalName: p.userPrincipalName,
  }));
}
