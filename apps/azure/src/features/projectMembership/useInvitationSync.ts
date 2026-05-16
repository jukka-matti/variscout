import { useMemo } from 'react';

interface LookupResult {
  userId: string;
  displayName: string;
}

export function useInvitationSync() {
  return useMemo(
    () => ({
      lookupUser: async (email: string): Promise<LookupResult | null> => {
        if (!email || !email.includes('@')) return null;
        // V1 stub — real Graph API call deferred to a follow-up Azure-only task.
        return {
          userId: email,
          displayName: email.split('@')[0],
        };
      },
    }),
    []
  );
}
