import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import type { SyncNotification } from '../services/storage';

interface SyncToastContainerProps {
  notifications: SyncNotification[];
  onDismiss: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
} as const;

const colorMap = {
  success: 'bg-green-900/90 border-green-700/50 text-green-200',
  info: 'bg-slate-800/90 border-slate-700/50 text-slate-200',
  warning: 'bg-amber-900/90 border-amber-700/50 text-amber-200',
  error: 'bg-red-900/90 border-red-700/50 text-red-200',
} as const;

const iconColorMap = {
  success: 'text-green-400',
  info: 'text-blue-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
} as const;

export const SyncToastContainer: React.FC<SyncToastContainerProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm"
      role="status"
      aria-live="polite"
    >
      {notifications.map(notif => {
        const Icon = iconMap[notif.type];
        return (
          <div
            key={notif.id}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border shadow-lg backdrop-blur-sm animate-in slide-in-from-right duration-200 ${colorMap[notif.type]}`}
          >
            <Icon size={16} className={`shrink-0 mt-0.5 ${iconColorMap[notif.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{notif.message}</p>
              {notif.action && (
                <button
                  onClick={notif.action.onClick}
                  className="mt-1 text-xs font-medium underline underline-offset-2 hover:no-underline"
                >
                  {notif.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => onDismiss(notif.id)}
              className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
