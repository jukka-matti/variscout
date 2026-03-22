import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { SyncNotification } from '../services/storage';

interface ToastContextValue {
  notifications: SyncNotification[];
  /** Add a toast. If `id` is provided (e.g. bridged from storage), it's preserved. */
  showToast: (notif: Omit<SyncNotification, 'id'> & { id?: string }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback((notif: Omit<SyncNotification, 'id'> & { id?: string }) => {
    const id = notif.id || `toast-${++toastCounter}`;
    setNotifications(prev => [...prev.slice(-4), { ...notif, id }]); // max 5

    if (notif.dismissAfter) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        timersRef.current.delete(id);
      }, notif.dismissAfter);
      timersRef.current.set(id, timer);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ notifications, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
