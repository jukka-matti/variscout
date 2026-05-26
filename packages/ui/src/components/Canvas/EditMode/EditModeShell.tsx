import React from 'react';

export interface EditModeShellProps {
  /** Called when the user clicks Done to exit Edit mode (returns to State mode). */
  onDone: () => void;
  /** Process-structure zone content. In B1 this receives the existing canvas chrome
   *  (StructuralToolbar + ProcessMapBase via Canvas/CanvasWorkspace). C3 will replace
   *  it with the dedicated process-zone authoring surface. */
  children: React.ReactNode;
}

export const EditModeShell: React.FC<EditModeShellProps> = ({ onDone, children }) => {
  return (
    <section
      data-testid="edit-mode-shell"
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Edit mode"
    >
      <header className="flex items-center justify-between border-b border-edge bg-surface-secondary px-4 py-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-content">Edit map</h2>
          <p className="text-xs text-content-secondary">
            Connect your data to the process structure.
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-edge bg-surface-primary px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-tertiary"
        >
          Done
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-[14rem_18rem_minmax(0,1fr)]">
        <aside
          data-testid="edit-mode-zone-palette"
          className="flex flex-col rounded-md border border-dashed border-edge bg-surface-primary p-3"
          aria-label="Palette zone"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Palette
          </h3>
          <p className="mt-2 text-xs text-content-secondary">Column chips arrive in B2.</p>
        </aside>

        <aside
          data-testid="edit-mode-zone-outcomes-factors"
          className="flex flex-col rounded-md border border-dashed border-edge bg-surface-primary p-3"
          aria-label="Outcomes and Factors zone"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Outcomes &amp; Factors
          </h3>
          <p className="mt-2 text-xs text-content-secondary">
            Outcome and factor zones arrive in Phase C.
          </p>
        </aside>

        <section
          data-testid="edit-mode-zone-process"
          className="flex min-h-0 flex-col rounded-md border border-edge bg-surface-primary"
          aria-label="Process structure zone"
        >
          {children}
        </section>
      </div>
    </section>
  );
};

export default EditModeShell;
