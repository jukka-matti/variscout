import React, { type ReactNode } from 'react';
import { DndContext } from '@dnd-kit/core';
import type { OutcomeSpec } from '@variscout/core';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';
import { Palette } from './Palette';
import type { SystemHint } from './Palette';
import { OutcomeZone } from './OutcomeZone';
import { FactorZone } from './FactorZone';
import { ProcessStructureZone } from './ProcessZone';
import type { ExtractedStep } from './ProcessZone/extractStepsFromCategoricalColumn';
import { handleEditModeDragEnd } from './handleEditModeDragEnd';
import { EditModeToolbar } from './EditModeToolbar';

export interface EditModeShellProps {
  /** Called when the user clicks Done to exit Edit mode (returns to State mode). */
  onDone: () => void;
  /** Column parsing profiles to render in the palette zone. Defaults to []. */
  profiles?: ColumnParsingProfile[];
  /** Raw numeric values per column, for sparklines and OutcomeZone target seeding. Defaults to {}. */
  numericValuesByColumn?: Record<string, number[]>;
  /**
   * Categorical columns mapped to their ordered distinct values. Forwarded to
   * {@link handleEditModeDragEnd} so the process-zone drop router can extract
   * steps from a categorical column drag (C3 Task 2). Numeric columns are
   * absent from this map and therefore fall through to the outcome handler.
   * Defaults to `{}`.
   */
  categoricalDistinctValuesByColumn?: Record<string, string[]>;
  /**
   * Contextual system hints rendered above the palette chip groups.
   * Forwarded unchanged to {@link Palette}. D2 Task 11 wires the batch-detected
   * banner; future hints (parsing warnings, missing time columns, etc.) can be
   * appended to the same array. Defaults to `[]`.
   */
  systemHints?: SystemHint[];
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
   * Called when a `column:<name>` drop lands on the OutcomeZone. EditModeShell
   * owns its own `DndContext` and routes column→zone drops via
   * {@link handleEditModeDragEnd}. (Canvas keeps a separate inner `DndContext`
   * for chip→step routing; the two contexts operate independently.)
   */
  onOutcomeSpecAdd?: (columnName: string, derived: Partial<OutcomeSpec>, stepId?: string) => void;
  /** Called when the OutcomeSpecsPopover Apply commits a per-spec edit. */
  onOutcomeSpecUpdate?: (specId: string, updated: OutcomeSpec) => void;
  /** Factor controls to render as `<FactorChip>` cards in the FactorZone. Defaults to []. */
  factorControls?: ImprovementProjectFactorControl[];
  /**
   * Process steps for the ProcessStructureZone container and the
   * FactorSpecsPopover step-binding selector. Each step carries `id`, `name`,
   * and `order` (the render order in the ProcessStructureZone strip).
   * Defaults to `[]`.
   */
  steps?: { id: string; name: string; order: number }[];
  /**
   * Called when a `column:<name>` drop lands on the FactorZone (global or
   * per-step). EditModeShell owns its own `DndContext` and routes column→zone
   * drops via {@link handleEditModeDragEnd}.
   */
  onFactorControlAdd?: (columnName: string, stepId?: string) => void;
  /** Called when the FactorSpecsPopover Apply commits a per-control edit. */
  onFactorControlUpdate?: (
    originalFactorName: string,
    updated: ImprovementProjectFactorControl
  ) => void;
  /**
   * Called when a categorical column drop on the ProcessStructureZone produces
   * a fresh `ExtractedStep[]`. EditModeShell forwards the array (the consumer
   * decides whether to replace, merge, or persist) along with the source
   * column name (for provenance + future undo affordances).
   */
  onStepsReplace?: (steps: ExtractedStep[], sourceColumnName: string) => void;
  /**
   * Called when the user clicks the "Capture step timings" toolbar button.
   * Only wired when `steps.length >= 1`. Task 10 (CanvasWorkspace integration)
   * connects this to the StepTimingsModal open-state.
   */
  onCaptureStepTimings?: () => void;
  /**
   * D1 slot — timing badge nodes keyed by step id. Forwarded unchanged to
   * `<ProcessStructureZone>`, which passes each entry as `timingBadge` to the
   * matching `<StepBox>`. Task 10 (CanvasWorkspace) computes this map; Task 9
   * only establishes the conduit. Defaults to `{}`.
   */
  timingByStepId?: Record<string, ReactNode>;
}

export const EditModeShell: React.FC<EditModeShellProps> = ({
  onDone,
  profiles = [],
  numericValuesByColumn = {},
  categoricalDistinctValuesByColumn = {},
  systemHints,
  onMenuItemSelect,
  onOverrideAccept,
  onApplyToSimilar,
  onReviewAllWarnings,
  outcomeSpecs = [],
  onOutcomeSpecAdd,
  onOutcomeSpecUpdate,
  factorControls = [],
  steps = [],
  onFactorControlAdd,
  onFactorControlUpdate,
  onStepsReplace,
  onCaptureStepTimings,
  timingByStepId = {},
}) => {
  const onDragEnd = React.useCallback(
    (event: Parameters<typeof handleEditModeDragEnd>[0]) =>
      handleEditModeDragEnd(event, {
        numericValuesByColumn,
        categoricalDistinctValuesByColumn,
        onOutcomeSpecAdd,
        onFactorControlAdd,
        onStepsReplace,
      }),
    [
      numericValuesByColumn,
      categoricalDistinctValuesByColumn,
      onOutcomeSpecAdd,
      onFactorControlAdd,
      onStepsReplace,
    ]
  );
  return (
    <DndContext onDragEnd={onDragEnd}>
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

        <EditModeToolbar steps={steps} onCaptureStepTimings={onCaptureStepTimings} />

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
              systemHints={systemHints}
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
            <FactorZone
              controls={factorControls}
              steps={steps}
              onControlAdd={onFactorControlAdd ?? (() => {})}
              onControlUpdate={onFactorControlUpdate ?? (() => {})}
            />
          </aside>

          <section
            data-testid="edit-mode-zone-process"
            className="flex min-h-0 flex-col rounded-md border border-edge bg-surface-primary"
            aria-label="Process structure zone"
          >
            <ProcessStructureZone steps={steps} timingByStepId={timingByStepId} />
          </section>
        </div>
      </section>
    </DndContext>
  );
};

export default EditModeShell;
