import { useMemo } from 'react';
import type { ProcessStepCapabilityMember } from '@variscout/core';

export interface UseB0AnalyzesInHubInput {
  hubId: string;
  members: readonly ProcessStepCapabilityMember[];
}

export interface UseB0AnalyzesInHubResult {
  unmapped: readonly ProcessStepCapabilityMember[];
  count: number;
}

/**
 * Enumerate hub-member investigations that are not yet mapped to canonical
 * map nodes (`nodeMappings` empty/absent) AND have not been dismissed
 * (`migrationDeclinedAt` unset). Drives the migration banner count.
 */
export function useB0AnalyzesInHub(input: UseB0AnalyzesInHubInput): UseB0AnalyzesInHubResult {
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
