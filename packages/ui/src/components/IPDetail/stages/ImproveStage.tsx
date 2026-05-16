import { useState, type FormEvent } from 'react';
import type { ActionItem } from '@variscout/core/findings';
import { canAccess, type ProjectMember } from '@variscout/core/projectMembership';
import { ImproveStageAdvanced, type ImproveStageAdvancedProps } from './ImproveStageAdvanced';

export interface ImproveStageProps {
  projectId: string;
  actions: ActionItem[];
  members: ProjectMember[];
  currentUserId?: string;
  onActionAdd: (action: Pick<ActionItem, 'text' | 'parentImprovementProjectId'>) => void;
  onActionUpdate: (
    actionId: string,
    patch: Partial<Omit<ActionItem, 'id' | 'createdAt' | 'deletedAt'>>
  ) => void;
  onActionRemove: (actionId: string) => void;
  /** Optional pass-throughs for the Advanced PDCA workbench.
   *  Defaults to empty/no-op values when not provided. */
  advancedProps?: Partial<Omit<ImproveStageAdvancedProps, 'projectId'>>;
}

const DEFAULT_WHAT_IF_STATS = { mean: 0, stdDev: 1 };

export function ImproveStage({
  projectId,
  actions,
  members,
  currentUserId,
  onActionAdd,
  onActionUpdate,
  onActionRemove,
  advancedProps,
}: ImproveStageProps) {
  // Empty members[] is open-access (mirrors IPDetailPage hasIdentity escape): legacy IPs
  // without wedge membership data fall back to pre-WV1-1 behavior where edits were visible.
  const canEdit =
    currentUserId !== undefined &&
    (members.length === 0 || canAccess(currentUserId, members, 'edit-improve'));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onActionAdd({ text: trimmed, parentImprovementProjectId: projectId });
    setNewTitle('');
    setAddOpen(false);
  };

  return (
    <section aria-label="Improve stage">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-content text-lg font-semibold">Actions</h2>
        <div className="flex items-center gap-2">
          {canEdit && !showAdvanced && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Add action
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="text-xs text-content-secondary hover:text-content"
            aria-label={showAdvanced ? 'Simple view' : 'Advanced'}
          >
            {showAdvanced ? 'Simple view' : 'Advanced'}
          </button>
        </div>
      </header>

      {showAdvanced ? (
        <ImproveStageAdvanced
          projectId={projectId}
          causes={advancedProps?.causes ?? []}
          problemStatement={advancedProps?.problemStatement}
          synthesis={advancedProps?.synthesis}
          targetCpk={advancedProps?.targetCpk}
          currentCpk={advancedProps?.currentCpk}
          ideaGroups={advancedProps?.ideaGroups ?? []}
          onIdeaGroupCardToggleSelect={advancedProps?.onIdeaGroupCardToggleSelect}
          onIdeaGroupCardAddIdea={advancedProps?.onIdeaGroupCardAddIdea}
          onIdeaGroupCardOpenWhatIf={advancedProps?.onIdeaGroupCardOpenWhatIf}
          onOpenBrainstorm={advancedProps?.onOpenBrainstorm}
          onBrainstormAddIdea={advancedProps?.onBrainstormAddIdea}
          onBrainstormEditIdea={advancedProps?.onBrainstormEditIdea}
          onBrainstormRemoveIdea={advancedProps?.onBrainstormRemoveIdea}
          onBrainstormDone={advancedProps?.onBrainstormDone}
          matrixIdeas={advancedProps?.matrixIdeas ?? []}
          matrixXAxis={advancedProps?.matrixXAxis ?? 'benefit'}
          matrixYAxis={advancedProps?.matrixYAxis ?? 'timeframe'}
          matrixColorBy={advancedProps?.matrixColorBy ?? 'risk'}
          onMatrixToggleSelect={advancedProps?.onMatrixToggleSelect ?? (() => {})}
          onMatrixAxisChange={advancedProps?.onMatrixAxisChange ?? (() => {})}
          matrixPresets={advancedProps?.matrixPresets}
          matrixActivePreset={advancedProps?.matrixActivePreset}
          onMatrixPresetChange={advancedProps?.onMatrixPresetChange}
          whatIfMode={advancedProps?.whatIfMode ?? 'basic'}
          whatIfCurrentStats={advancedProps?.whatIfCurrentStats ?? DEFAULT_WHAT_IF_STATS}
        />
      ) : (
        <>
          {addOpen && canEdit && (
            <form onSubmit={submit} className="mb-4 p-3 border border-edge rounded">
              <label className="block text-sm text-content">
                Title
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                  aria-label="Title"
                  className="w-full mt-1 px-2 py-1 border border-edge rounded"
                />
              </label>
              <div className="mt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-3 py-1 text-content-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {actions.length === 0 ? (
            <p className="text-content-muted">No actions yet.</p>
          ) : (
            <ul className="divide-y divide-edge">
              {actions.map(a => (
                <li key={a.id} className="py-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-content">{a.text}</span>
                    <span className="text-xs text-content-secondary">{a.status ?? 'open'}</span>
                  </div>
                  <div className="text-xs text-content-muted mt-1 flex gap-3">
                    {a.assignedTo?.displayName && <span>{a.assignedTo.displayName}</span>}
                    {a.dueAt && <span>Due {a.dueAt}</span>}
                  </div>
                  {canEdit && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onActionUpdate(a.id, { status: 'done' })}
                        className="text-xs text-content-secondary hover:text-content"
                        aria-label={`Mark ${a.text} done`}
                      >
                        Mark done
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionRemove(a.id)}
                        className="text-xs text-content-secondary hover:text-content"
                        aria-label={`Remove ${a.text}`}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
