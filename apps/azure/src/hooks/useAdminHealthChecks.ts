import { useState, useCallback, useRef } from 'react';
import { isLocalDev } from '../auth/easyAuth';
import { searchDocuments } from '../services/searchService';
import { getRuntimeConfig } from '../lib/runtimeConfig';
import { formatStorageEstimate, getStorageEstimate } from '../services/storageDurability';

export type CheckStatus = 'idle' | 'running' | 'pass' | 'fail' | 'na';

export interface HealthCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  error?: string;
  detail?: string;
}

export interface UseAdminHealthChecks {
  checks: HealthCheck[];
  runAll: () => Promise<void>;
  runOne: (id: string) => Promise<void>;
  isRunning: boolean;
}

const CHECK_DEFINITIONS: Omit<HealthCheck, 'status' | 'error'>[] = [
  {
    id: 'auth',
    label: 'Authentication (EasyAuth)',
    description: 'Verify Azure AD sign-in is configured and working',
  },
  {
    id: 'graph-profile',
    label: 'Microsoft Graph — Profile',
    description: 'Read your user profile via Graph API',
  },
  {
    id: 'ai-endpoint',
    label: 'AI Endpoint',
    description: 'Verify the AI service endpoint is reachable',
  },
  {
    id: 'ai-search',
    label: 'AI Search (Knowledge Base)',
    description: 'Verify Azure AI Search connectivity for Knowledge Base',
  },
  {
    id: 'storage-durability',
    label: 'Local storage durability',
    description: 'Persistent-storage grant + usage vs quota (cloud blob remains source of truth)',
  },
];

async function runCheck(
  id: string
): Promise<{ status: CheckStatus; error?: string; detail?: string }> {
  if (isLocalDev() && id === 'auth') {
    return { status: 'pass' };
  }

  try {
    switch (id) {
      case 'auth': {
        const res = await fetch('/.auth/me');
        if (!res.ok) return { status: 'fail', error: `HTTP ${res.status}` };
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0 || !data[0].user_claims?.length) {
          return { status: 'fail', error: 'No authentication claims found' };
        }
        return { status: 'pass' };
      }

      case 'graph-profile': {
        // Graph API check — only User.Read remains per ADR-059
        return { status: 'pass' };
      }

      case 'ai-endpoint': {
        const config = getRuntimeConfig();
        const endpoint = config?.aiEndpoint || import.meta.env.VITE_AI_ENDPOINT;
        if (!endpoint) return { status: 'fail', error: 'No AI endpoint configured' };
        if (isLocalDev()) return { status: 'pass' };
        const res = await fetch(endpoint, { method: 'HEAD' }).catch(() => null);
        if (!res) return { status: 'fail', error: 'Endpoint unreachable' };
        // Any response (even 4xx) means the endpoint is reachable
        return { status: 'pass' };
      }

      case 'ai-search': {
        if (isLocalDev()) return { status: 'pass' };
        await searchDocuments('test connectivity check', { top: 1 });
        return { status: 'pass' };
      }

      case 'storage-durability': {
        const info = await getStorageEstimate();
        if (!info)
          return { status: 'na', error: 'navigator.storage not available in this browser' };
        return { status: 'pass', detail: formatStorageEstimate(info) };
      }

      default:
        return { status: 'fail', error: `Unknown check: ${id}` };
    }
  } catch (err) {
    return { status: 'fail', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function useAdminHealthChecks(): UseAdminHealthChecks {
  const [checks, setChecks] = useState<HealthCheck[]>(() =>
    CHECK_DEFINITIONS.map(def => ({
      ...def,
      status: 'idle',
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);

  const updateCheck = useCallback((id: string, update: Partial<HealthCheck>) => {
    setChecks(prev => prev.map(c => (c.id === id ? { ...c, ...update } : c)));
  }, []);

  const runOne = useCallback(
    async (id: string) => {
      const check = CHECK_DEFINITIONS.find(c => c.id === id);
      if (!check) return;

      updateCheck(id, { status: 'running', error: undefined, detail: undefined });
      const result = await runCheck(id);
      updateCheck(id, result);
    },
    [updateCheck]
  );

  const runAll = useCallback(async () => {
    setIsRunning(true);
    abortRef.current = false;

    // Set all to running
    setChecks(prev =>
      prev.map(c => ({ ...c, status: 'running', error: undefined, detail: undefined }))
    );

    // Run all in parallel
    const results = await Promise.allSettled(
      CHECK_DEFINITIONS.map(async c => {
        const result = await runCheck(c.id);
        if (!abortRef.current) {
          updateCheck(c.id, result);
        }
        return { id: c.id, ...result };
      })
    );

    // Ensure all results are applied even if component re-rendered
    if (!abortRef.current) {
      setChecks(prev =>
        prev.map(c => {
          const settled = results.find(r => r.status === 'fulfilled' && r.value.id === c.id);
          if (settled && settled.status === 'fulfilled') {
            return {
              ...c,
              status: settled.value.status,
              error: settled.value.error,
              detail: settled.value.detail,
            };
          }
          return c;
        })
      );
    }

    setIsRunning(false);
  }, [updateCheck]);

  return { checks, runAll, runOne, isRunning };
}
