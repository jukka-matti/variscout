import { useState } from 'react';
import type { FormEvent } from 'react';
import FocusTrap from 'focus-trap-react';

type LogActionMode = 'done' | 'assign';

export type LogActionPayload =
  | {
      text: string;
      status: 'done';
    }
  | {
      text: string;
      status: 'open';
      assignedTo: {
        displayName: string;
        upn: string;
      };
      dueAt?: string;
    };

export interface LogActionModalProps {
  cardTitle: string;
  onCancel: () => void;
  onLog: (payload: LogActionPayload) => void;
}

export function LogActionModal({ cardTitle, onCancel, onLog }: LogActionModalProps) {
  const [mode, setMode] = useState<LogActionMode>('done');
  const [text, setText] = useState('');
  const [owner, setOwner] = useState('');
  const [dueAt, setDueAt] = useState('');

  const title = `Log action — ${cardTitle}`;
  const whatInputId = 'log-action-what';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedText = text.trim();
    const trimmedOwner = owner.trim();
    if (!trimmedText) return;

    if (mode === 'done') {
      onLog({ text: trimmedText, status: 'done' });
      return;
    }

    if (!trimmedOwner) return;

    onLog({
      text: trimmedText,
      status: 'open',
      assignedTo: {
        displayName: trimmedOwner,
        upn: trimmedOwner,
      },
      ...(dueAt ? { dueAt } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          delayInitialFocus: false,
          escapeDeactivates: false,
          fallbackFocus: () => document.body,
          initialFocus: `#${whatInputId}`,
          tabbableOptions: {
            displayCheck: 'none',
          },
        }}
      >
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-action-modal-title"
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-lg border border-edge bg-surface p-4 shadow-xl"
        >
          <div className="space-y-4">
            <header>
              <h2 id="log-action-modal-title" className="text-base font-semibold text-content">
                {title}
              </h2>
            </header>

            <label className="block space-y-1 text-sm font-medium text-content">
              <span>What</span>
              <input
                id={whatInputId}
                required
                value={text}
                onChange={event => setText(event.target.value)}
                className="w-full rounded-md border border-edge bg-surface-primary px-3 py-2 text-sm text-content outline-none focus:ring-2 focus:ring-status-info/50"
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="sr-only">Action status</legend>
              <label className="flex items-center gap-2 text-sm text-content">
                <input
                  type="radio"
                  name="log-action-mode"
                  checked={mode === 'done'}
                  onChange={() => setMode('done')}
                />
                <span>Done now</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-content">
                <input
                  type="radio"
                  name="log-action-mode"
                  checked={mode === 'assign'}
                  onChange={() => setMode('assign')}
                />
                <span>Assign to</span>
              </label>
            </fieldset>

            {mode === 'assign' ? (
              <div className="space-y-3 rounded-md border border-edge bg-surface-secondary p-3">
                <label className="block space-y-1 text-sm font-medium text-content">
                  <span>Owner</span>
                  <input
                    required
                    value={owner}
                    onChange={event => setOwner(event.target.value)}
                    className="w-full rounded-md border border-edge bg-surface-primary px-3 py-2 text-sm text-content outline-none focus:ring-2 focus:ring-status-info/50"
                  />
                </label>
                <label className="block space-y-1 text-sm font-medium text-content">
                  <span>Due date</span>
                  <input
                    type="date"
                    value={dueAt}
                    onChange={event => setDueAt(event.target.value)}
                    className="w-full rounded-md border border-edge bg-surface-primary px-3 py-2 text-sm text-content outline-none focus:ring-2 focus:ring-status-info/50"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <footer className="mt-4 flex items-center justify-end gap-2 border-t border-edge pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-sm text-content-secondary hover:bg-surface-tertiary hover:text-content"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-status-info px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Log action
            </button>
          </footer>
        </form>
      </FocusTrap>
    </div>
  );
}
