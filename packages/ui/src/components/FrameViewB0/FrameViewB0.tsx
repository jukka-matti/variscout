/**
 * FrameViewB0 — FRAME b0 lightweight render composition.
 *
 * Presentational wrapper for the b0 entry point. Composes the W3 building
 * blocks into the load-bearing investigator view:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  YPickerSection                             │
 *   │  ─ + add spec opens InlineSpecEditor        │
 *   │     inline beneath the Y row                │
 *   ├─────────────────────────────────────────────┤
 *   │  XPickerSection (only after Y is selected)  │
 *   ├─────────────────────────────────────────────┤
 *   │  ProcessStepsExpander                       │
 *   │    └─ children: existing canvas             │
 *   │       (CanvasWorkspace                      │
 *   │        with showGaps={false})               │
 *   ├─────────────────────────────────────────────┤
 *   │  SeeTheDataCta                              │
 *   │    disabled until a Y is picked             │
 *   └─────────────────────────────────────────────┘
 *
 * Hard rules:
 * - Presentational primitive — props in, callbacks out. No Zustand access.
 * - i18n via useTranslation hook — no hardcoded English strings.
 * - Semantic Tailwind only.
 * - Inline editor open/close is locally managed (uncontrolled by design —
 *   simplest mental model for the caller; if a future caller needs to
 *   control it externally, lift state then).
 */

import { useState, type ReactNode } from 'react';
import { useTranslation } from '@variscout/hooks';
import { YPickerSection, type YPickerSectionCandidate } from '../YPickerSection';
import { XPickerSection, type XCandidate } from '../XPickerSection';
import { InlineSpecEditor, type SpecValues, type SpecSuggestion } from '../InlineSpecEditor';
import { ProcessStepsExpander } from '../ProcessStepsExpander';
import { SeeTheDataCta } from '../SeeTheDataCta';

// Re-export for callers — keeps a single import path for the composition.
export type FrameViewB0YCandidate = YPickerSectionCandidate;

export interface FrameViewB0Props {
  /** Pre-ranked Y candidates (caller runs rankYCandidates upstream). */
  yCandidates: ReadonlyArray<FrameViewB0YCandidate>;
  /** Currently selected Y column name, or null. */
  selectedY: string | null;
  /** Fired when user clicks a Y chip. */
  onSelectY: (columnName: string) => void;

  /** X candidates (caller filters: not Y, not run-order). */
  xCandidates: ReadonlyArray<XCandidate>;
  /** Currently selected X column names. */
  selectedXs: readonly string[];
  /** Fired when user toggles an X chip. */
  onToggleX: (columnName: string) => void;

  /** Auto-detected datetime column for run-order display. */
  runOrderColumn?: string | null;

  /** Current spec values for the selected Y (drives "spec: set" vs "not set"). */
  currentYSpec?: SpecValues;
  /** Suggested spec values from data (mean ± 3σ) — passed to InlineSpecEditor. */
  yspecSuggestion?: SpecSuggestion;
  /** Project default Cpk target. */
  defaultCpkTarget?: number;
  /** Fired when user confirms spec values in the inline editor. */
  onConfirmYSpec: (values: SpecValues) => void;

  /**
   * Children = the existing canvas component (CanvasWorkspace). Rendered
   * inside the ProcessStepsExpander.
   */
  children: ReactNode;

  /** Optional top bar (provenance + the "Fix data…" hatch) rendered above the Y picker. FSJ-2, spec §4.1. */
  topBar?: ReactNode;
  /** Optional quiet slot between the Y and X sections ("+ track another outcome"). FSJ-2, spec §4.1. Suppressed in the no-Y state (yCandidates empty). */
  belowYSlot?: ReactNode;
  /** No-Y floor banner — rendered beneath the Y picker ONLY when yCandidates is empty (spec §4.1 no-numeric-Y guard). */
  noYBanner?: ReactNode;
  /** Pending proposal state: render the top bar, then this slot instead of ordinary Y/X picking. */
  selectionDisabledSlot?: ReactNode;
  /** Alternate empty-Y disposition for accepted modes that intentionally remove ordinary Y candidates. */
  emptyYSlot?: ReactNode;

  /** Fired when the process-steps expander opens so the parent can prepare L2 authoring. */
  onProcessStepsOpen?: () => void;

  /** Fired when user clicks "See the data →". */
  onSeeData: () => void;

  /** Optional className for layout. */
  className?: string;
}

/**
 * A spec is "set" if any of the four fields is a finite number. We don't
 * require all four — partial specs (target only, or USL+LSL only) are valid.
 */
function hasAnySpec(spec: SpecValues | undefined): boolean {
  if (!spec) return false;
  const fields: Array<number | undefined> = [spec.usl, spec.lsl, spec.target, spec.cpkTarget];
  return fields.some(v => v !== undefined && Number.isFinite(v));
}

export function FrameViewB0({
  yCandidates,
  selectedY,
  onSelectY,
  xCandidates,
  selectedXs,
  onToggleX,
  runOrderColumn,
  currentYSpec,
  yspecSuggestion,
  defaultCpkTarget,
  onConfirmYSpec,
  children,
  topBar,
  belowYSlot,
  noYBanner,
  selectionDisabledSlot,
  emptyYSlot,
  onProcessStepsOpen,
  onSeeData,
  className,
}: FrameViewB0Props) {
  const { t } = useTranslation();

  // Inline-editor open/close — locally owned. Closing requires explicit
  // user action (Save or Cancel); flipping selectedY does NOT auto-close
  // (the editor is anchored to whichever Y is currently selected).
  const [editorOpen, setEditorOpen] = useState<boolean>(false);

  const handleAddSpec = () => {
    if (!selectedY) return;
    setEditorOpen(true);
  };

  const handleConfirm = (values: SpecValues) => {
    onConfirmYSpec(values);
    setEditorOpen(false);
  };

  const handleCancel = () => {
    setEditorOpen(false);
  };

  const containerClass = ['flex flex-col gap-6 mx-auto max-w-6xl px-4 py-4', className]
    .filter(Boolean)
    .join(' ');

  const ctaDisabled = selectedY === null;
  const ctaDisabledHint = ctaDisabled ? t('frame.b0.seeData.pickYHint') : undefined;
  const useEmptyYDisposition = yCandidates.length === 0 && emptyYSlot != null;

  // Inline spec editor — rendered as a floating popover anchored to the
  // +add spec trigger inside the Y picker's selected row. YPickerSection
  // owns the absolute-positioning shell (so the editor visually overlays
  // the candidate grid instead of pushing it down).
  const specEditor =
    selectedY && editorOpen ? (
      <InlineSpecEditor
        measure={selectedY}
        current={currentYSpec}
        suggestion={yspecSuggestion}
        defaultCpkTarget={defaultCpkTarget}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ) : null;

  return (
    <div className={containerClass} data-testid="frame-view-b0">
      {topBar && <div data-testid="frame-view-b0-top-bar">{topBar}</div>}

      {selectionDisabledSlot ? (
        <div data-testid="frame-view-b0-selection-disabled">{selectionDisabledSlot}</div>
      ) : useEmptyYDisposition ? (
        <div data-testid="frame-view-b0-no-y-banner">{emptyYSlot}</div>
      ) : (
        <>
          <YPickerSection
            candidates={yCandidates}
            selectedY={selectedY}
            onSelectY={onSelectY}
            onAddSpec={handleAddSpec}
            hasSpecForSelected={hasAnySpec(currentYSpec)}
            inlineSpecEditor={specEditor}
          />

          {yCandidates.length === 0 && noYBanner && (
            <div data-testid="frame-view-b0-no-y-banner">{noYBanner}</div>
          )}
          {/* belowY is gated on candidates existing: the no-Y floor (banner above) is an
              exclusive state — "track another outcome" presumes a Y exists to track. */}
          {yCandidates.length > 0 && belowYSlot && (
            <div data-testid="frame-view-b0-below-y">{belowYSlot}</div>
          )}

          {/* X picker only appears after Y is selected — frames the picker as
              "what might be affecting [the Y you just chose]". Surfacing X
              candidates before Y is meaningless and overwhelming. */}
          {selectedY && (
            <XPickerSection
              candidates={xCandidates}
              selectedXs={selectedXs}
              onToggleX={onToggleX}
              runOrderColumn={runOrderColumn}
            />
          )}
        </>
      )}

      <ProcessStepsExpander
        onOpenChange={open => {
          if (open) onProcessStepsOpen?.();
        }}
      >
        {children}
      </ProcessStepsExpander>

      <div className="flex justify-end">
        <SeeTheDataCta onClick={onSeeData} disabled={ctaDisabled} disabledHint={ctaDisabledHint} />
      </div>
    </div>
  );
}
