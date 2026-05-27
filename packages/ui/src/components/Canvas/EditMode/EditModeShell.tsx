import React from 'react';
import type { OutcomeSpec } from '@variscout/core';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';
import { Palette } from './Palette';
import { OutcomeZone } from './OutcomeZone';

export interface EditModeShellProps {
  /** Called when the user clicks Done to exit Edit mode (returns to State mode). */
  onDone: () => void;
  /** Process-structure zone content. In B1 this receives the existing canvas chrome
   *  (StructuralToolbar + ProcessMapBase via Canvas/CanvasWorkspace). C3 will replace
   *  it with the dedicated process-zone authoring surface. */
  children: React.ReactNode;
  /** Column parsing profiles to render in the palette zone. Defaults to []. */
  profiles?: ColumnParsingProfile[];
  /** Raw numeric values per column, for sparklines and OutcomeZone target seeding. Defaults to {}. */
  numericValuesByColumn?: Record<string, number[]>;
  /** Forwarded to the palette. Routed to no-op by default. */
  onMenuItemSelect?: (columnName: string, itemId: string) => void;
  /** Forwarded to the palette. Routed to no-op by default. */
  onOverrideAccept?: (columnName: string, interpretation: ParsingInterpretation) => void;
  /** Forwarded to the palette. Routed to no-op by default. */
  onApplyToSimilar?: (columnName: string, interpretation: ParsingInterpretation) => void;
  /** Forwarded to the palette. Routed to no-op by default. */
  onReviewAllWarnings?: () => void;
  /** Outcome specs to render as `<OutcomeCard>` chips in the OutcomeZone. Defaults to []. */
  outcomeSpecs?: OutcomeSpec[];
  /**
   * Called when a `column:<name>` drop lands on the OutcomeZone — wired by the
   * parent `DndContext` (`Canvas/index.tsx`) via {@link handleOutcomeDrop}.
   * EditModeShell does not own its own DndContext; this prop is plumbed
   * through OutcomeZone for the parent to invoke after routing.
   */
  onOutcomeSpecAdd?: (columnName: string, derived: Partial<OutcomeSpec>) => void;
  /** Called when the SpecsPopover Apply commits a per-spec edit. */
  onOutcomeSpecUpdate?: (specId: string, updated: OutcomeSpec) => void;
}

export const EditModeShell: React.FC<EditModeShellProps> = ({
  onDone,
  children,
  profiles = [],
  numericValuesByColumn = {},
  onMenuItemSelect,
  onOverrideAccept,
  onApplyToSimilar,
  onReviewAllWarnings,
  outcomeSpecs = [],
  onOutcomeSpecAdd,
  onOutcomeSpecUpdate,
}) => {
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
          className="flex flex-col gap-2 rounded-md border border-dashed border-edge bg-surface-primary p-3"
          aria-label="Palette zone"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Palette
          </h3>
          <Palette
            profiles={profiles}
            numericValuesByColumn={numericValuesByColumn}
            onMenuItemSelect={onMenuItemSelect}
            onOverrideAccept={onOverrideAccept}
            onApplyToSimilar={onApplyToSimilar}
            onReviewAllWarnings={onReviewAllWarnings}
          />
        </aside>

        <aside
          data-testid="edit-mode-zone-outcomes-factors"
          className="flex flex-col gap-3 rounded-md border border-dashed border-edge bg-surface-primary p-3"
          aria-label="Outcomes and Factors zone"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Outcomes &amp; Factors
          </h3>
          <OutcomeZone
            specs={outcomeSpecs}
            numericValuesByColumn={numericValuesByColumn}
            onSpecAdd={onOutcomeSpecAdd ?? (() => {})}
            onSpecUpdate={onOutcomeSpecUpdate ?? (() => {})}
          />
          <p className="text-xs text-content-tertiary">Factor zone arrives in C2.</p>
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
