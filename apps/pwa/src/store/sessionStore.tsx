// apps/pwa/src/store/sessionStore.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ProcessHub } from '@variscout/core/processHub';

interface SessionState {
  hub: ProcessHub | null;
  rawData: Array<Record<string, unknown>> | null;
}

interface SessionStore extends SessionState {
  setHub: (hub: ProcessHub | null) => void;
  setRawData: (data: Array<Record<string, unknown>> | null) => void;
}

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [hub, setHub] = useState<ProcessHub | null>(null);
  const [rawData, setRawData] = useState<Array<Record<string, unknown>> | null>(null);
  return (
    <SessionContext.Provider value={{ hub, rawData, setHub, setRawData }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionStore {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
