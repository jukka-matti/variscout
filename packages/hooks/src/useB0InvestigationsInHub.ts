import { useMemo } from 'react';
import type { ProcessHubInvestigation } from '@variscout/core';

export interface UseB0InvestigationsInHubInput {
  hubId: string;
  members: readonly ProcessHubInvestigation[];
}

export interface UseB0InvestigationsInHubResult {
  unmapped: readonly ProcessHubInvestigation[];
  count: number;
}

/**
 * Enumerate hub-member investigations that are not yet mapped to canonical
 * map nodes (`nodeMappings` empty/absent) AND have not been dismissed
 * (`migrationDeclinedAt` unset). Drives the migration banner count.
 */
export function useB0InvestigationsInHub(
  input: UseB0InvestigationsInHubInput
): UseB0InvestigationsInHubResult {
  const { hubId, members } = input;
  return useMemo(() => {
    const unmapped = members.filter(m => {
      const meta = m.metadata;
      if (meta?.processHubId !== hubId) return false;
      const mappings = meta.nodeMappings ?? [];
      if (mappings.length > 0) return false;
      if (meta.migrationDeclinedAt) return false;
      return true;
    });
    return { unmapped, count: unmapped.length };
  }, [hubId, members]);
}
