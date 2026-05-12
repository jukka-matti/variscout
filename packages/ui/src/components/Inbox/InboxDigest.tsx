import React from 'react';
import type { SurveyInboxPrompt } from '@variscout/core/survey';

export interface InboxDigestPrompt {
  id: string;
  message: string;
  severity: SurveyInboxPrompt['severity'];
  action?: SurveyInboxPrompt['action'];
}

export interface InboxDigestProps {
  prompts: InboxDigestPrompt[];
  onNavigate: (prompt: InboxDigestPrompt) => void;
}

const severityClassName: Record<InboxDigestPrompt['severity'], string> = {
  critical: 'border-danger/40 bg-danger/10 text-danger',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  info: 'border-edge bg-surface-secondary text-content/70',
};

function promptCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'prompt' : 'prompts'}`;
}

export const InboxDigest: React.FC<InboxDigestProps> = ({ prompts, onNavigate }) => {
  if (prompts.length === 0) return null;

  return (
    <section className="space-y-3 rounded-lg border border-edge bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-content">Inbox</h2>
        <span className="text-xs font-medium text-content/70">
          {promptCountLabel(prompts.length)}
        </span>
      </div>

      <ul className="space-y-2">
        {prompts.map(prompt => (
          <li
            key={prompt.id}
            className="grid min-w-0 gap-3 border-t border-edge pt-3 first:border-t-0 first:pt-0 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
          >
            <span
              className={`w-fit rounded border px-2 py-0.5 text-xs font-medium ${severityClassName[prompt.severity]}`}
            >
              {prompt.severity}
            </span>
            <p className="min-w-0 break-words text-sm text-content">{prompt.message}</p>
            <button
              type="button"
              className="max-w-full break-words rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => onNavigate(prompt)}
            >
              {prompt.action?.label ?? 'Open'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
