import { useEffect, useId, useMemo, useRef, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import type { ActionItem } from '@variscout/core/findings';

export interface RecentActivityPanelProps {
  stepId: string;
  actionItems: ActionItem[];
}

function isOrphanStepAction(action: ActionItem, stepId: string): boolean {
  return (
    action.stepId === stepId &&
    action.parentImprovementProjectId === null &&
    action.parentImprovementIdeaId === null &&
    action.deletedAt === null
  );
}

function ownerLabel(action: ActionItem): string | undefined {
  return action.assignedTo?.displayName ?? action.assignedTo?.upn;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="grid gap-1 text-sm">
      <dt className="font-medium text-content-secondary">{label}</dt>
      <dd className="text-content">{value}</dd>
    </div>
  );
}

export function RecentActivityPanel({ stepId, actionItems }: RecentActivityPanelProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const orphanActions = useMemo(
    () => actionItems.filter(action => isOrphanStepAction(action, stepId)),
    [actionItems, stepId]
  );

  useEffect(() => {
    if (!selectedAction && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      openerRef.current?.focus();
    }
  }, [selectedAction]);

  const closeDialog = () => {
    shouldRestoreFocusRef.current = true;
    setSelectedAction(null);
  };

  return (
    <>
      <details className="rounded-md border border-edge bg-surface-secondary p-3">
        <summary className="cursor-pointer text-sm font-semibold text-content">
          Recent activity
        </summary>

        {orphanActions.length === 0 ? (
          <p className="mt-3 text-sm text-content-secondary">No recent activity.</p>
        ) : (
          <ul className="mt-3 space-y-2" aria-label="Recent activity actions">
            {orphanActions.map(action => (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={event => {
                    openerRef.current = event.currentTarget;
                    setSelectedAction(action);
                  }}
                  className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left text-sm text-content transition-colors hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span className="font-medium">{action.text}</span>
                  <span className="mt-1 block text-xs text-content-secondary">
                    {action.status ?? 'open'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>

      {selectedAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <FocusTrap
            focusTrapOptions={{
              allowOutsideClick: true,
              delayInitialFocus: false,
              escapeDeactivates: true,
              fallbackFocus: () => dialogRef.current ?? document.body,
              initialFocus: () => closeButtonRef.current ?? dialogRef.current ?? document.body,
              onDeactivate: closeDialog,
              returnFocusOnDeactivate: false,
              tabbableOptions: {
                displayCheck: 'none',
              },
            }}
          >
            <section
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="w-full max-w-sm rounded-lg border border-edge bg-surface p-4 shadow-xl"
            >
              <header className="flex items-start justify-between gap-3">
                <h2 id={titleId} className="text-base font-semibold text-content">
                  Action details
                </h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeDialog}
                  className="rounded-md px-2 py-1 text-sm text-content-secondary hover:bg-surface-tertiary hover:text-content focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  Close
                </button>
              </header>

              <dl className="mt-4 space-y-3">
                <DetailRow label="Text" value={selectedAction.text} />
                <DetailRow label="Status" value={selectedAction.status ?? 'open'} />
                <DetailRow label="Owner" value={ownerLabel(selectedAction)} />
                <DetailRow label="Due date" value={selectedAction.dueAt} />
                <DetailRow label="Done" value={selectedAction.doneAt} />
              </dl>
            </section>
          </FocusTrap>
        </div>
      ) : null}
    </>
  );
}
