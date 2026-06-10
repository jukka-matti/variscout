import { detectBatchData, detectTimeColumns } from '@variscout/core';
import type { TimeDecompositionBinding } from '@variscout/core';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import type { SystemHintKind } from '../Palette/SystemHintBanner';

export interface SystemHintItem {
  /** Stable key: 'batch-detected' | 'time-detected' */
  id: string;
  kind: SystemHintKind;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export interface UseSystemHintsInput {
  columnProfiles: ReadonlyArray<ColumnParsingProfile>;
  dismissedHints: ReadonlySet<string>;
  /**
   * Time decomposition bindings — resolved from `workspaceProject.timeDecompositionBindings`
   * or local-state fallback in CanvasWorkspace. Used to suppress the time hint
   * once every detected date column has been decomposed.
   */
  timeDecompositionBindings: ReadonlyArray<TimeDecompositionBinding>;
  /** CTA callback for batch hint. When undefined, hint renders without CTA. */
  onOpenCalc?: () => void;
  /** CTA callback for time hint. When undefined, hint renders without CTA. */
  onOpenTimeAsFactors?: () => void;
}

/**
 * Pure derivation — detects system hints from column profiles + decomposition state.
 * Returns hints in stable order: batch first, then time.
 *
 * Detection delegates to canonical core detectors:
 * - Batch: `detectBatchData` (input/output mass-balance heuristic)
 * - Time: `detectTimeColumns` (date-typed columns with status 'ok')
 *
 * Time suppression: hint is hidden only when EVERY detected date column already
 * has a decomposition binding. Partial decomposition keeps the hint visible.
 */
export function useSystemHints(input: UseSystemHintsInput): SystemHintItem[] {
  const {
    columnProfiles,
    dismissedHints,
    timeDecompositionBindings,
    onOpenCalc,
    onOpenTimeAsFactors,
  } = input;

  const hints: SystemHintItem[] = [];

  // BATCH HINT — delegate to detectBatchData
  if (!dismissedHints.has('batch-detected')) {
    const batchResult = detectBatchData([...columnProfiles]);
    if (batchResult !== null) {
      const hint: SystemHintItem = {
        id: 'batch-detected',
        kind: 'batch',
        message:
          '💡 Batch data detected. Input/output mass columns found — calculate yield ratios?',
      };
      if (onOpenCalc !== undefined) {
        hint.ctaLabel = 'Calculate yield ratios →';
        hint.onCta = onOpenCalc;
      }
      hints.push(hint);
    }
  }

  // TIME HINT — delegate to detectTimeColumns
  if (!dismissedHints.has('time-detected')) {
    const timeResult = detectTimeColumns([...columnProfiles]);
    if (timeResult !== null) {
      const allColumnsDecomposed = timeResult.columns.every(col =>
        timeDecompositionBindings.some(b => b.sourceColumn === col)
      );
      if (!allColumnsDecomposed) {
        const count = timeResult.count;
        const hint: SystemHintItem = {
          id: 'time-detected',
          kind: 'time',
          message: `${count} time column${count === 1 ? '' : 's'} detected. Use time as factors →`,
        };
        if (onOpenTimeAsFactors !== undefined) {
          hint.ctaLabel = 'Use time as factors';
          hint.onCta = onOpenTimeAsFactors;
        }
        hints.push(hint);
      }
    }
  }

  return hints;
}
