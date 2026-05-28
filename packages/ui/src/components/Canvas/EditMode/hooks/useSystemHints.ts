import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import type { SystemHintKind } from '../Palette/SystemHintBanner';

export interface SystemHintItem {
  /** Stable key: 'batch-detected' | 'time-column-detected' */
  id: string;
  kind: SystemHintKind;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export interface UseSystemHintsInput {
  activeIP: ImprovementProject | undefined | null;
  columnProfiles: ReadonlyArray<ColumnParsingProfile>;
  dismissedHints: ReadonlySet<string>;
  /** CTA callback for batch hint. When undefined, hint renders without CTA. */
  onOpenCalc?: () => void;
  /** CTA callback for time hint. When undefined, hint renders without CTA. */
  onOpenTimeAsFactors?: () => void;
}

/**
 * Pure derivation — detects system hints from the active IP + column profiles.
 * Returns hints in stable order: batch first, then time.
 * When `activeIP` is undefined or null, returns [].
 */
export function useSystemHints(input: UseSystemHintsInput): SystemHintItem[] {
  const { activeIP, columnProfiles, dismissedHints, onOpenCalc, onOpenTimeAsFactors } = input;

  if (activeIP == null) {
    return [];
  }

  const hints: SystemHintItem[] = [];

  // batch-detected: IP has formulaBindings OR heuristic finds 2+ _kg or 2+ _pcs columns
  const hasBatchCondition = isBatchDetected(activeIP, columnProfiles);

  if (hasBatchCondition && !dismissedHints.has('batch-detected')) {
    const hint: SystemHintItem = {
      id: 'batch-detected',
      kind: 'batch',
      message: 'Batch shape detected. Use Calc workflow to add ratios.',
    };
    if (onOpenCalc !== undefined) {
      hint.ctaLabel = 'Open calc';
      hint.onCta = onOpenCalc;
    }
    hints.push(hint);
  }

  // time-column-detected: a date column exists and no decomposition binding covers it
  const hasDateColumn = columnProfiles.some(p => p.primary?.kind === 'date');
  const existingDecompositions = activeIP.timeDecompositionBindings ?? [];
  const timeCondition = hasDateColumn && existingDecompositions.length === 0;

  if (timeCondition && !dismissedHints.has('time-column-detected')) {
    const hint: SystemHintItem = {
      id: 'time-column-detected',
      kind: 'time',
      message: 'Time column detected. Decompose into factors?',
    };
    if (onOpenTimeAsFactors !== undefined) {
      hint.ctaLabel = 'Open time-as-factors';
      hint.onCta = onOpenTimeAsFactors;
    }
    hints.push(hint);
  }

  return hints;
}

function isBatchDetected(
  activeIP: ImprovementProject,
  columnProfiles: ReadonlyArray<ColumnParsingProfile>
): boolean {
  // Primary signal: IP already has formula bindings
  if (activeIP.formulaBindings && activeIP.formulaBindings.length > 0) {
    return true;
  }

  // Heuristic: 2+ columns ending in _kg (case-insensitive)
  const kgCount = columnProfiles.filter(p =>
    p.columnName.toLowerCase().endsWith('_kg')
  ).length;
  if (kgCount >= 2) {
    return true;
  }

  // Heuristic: 2+ columns ending in _pcs (case-insensitive)
  const pcsCount = columnProfiles.filter(p =>
    p.columnName.toLowerCase().endsWith('_pcs')
  ).length;
  if (pcsCount >= 2) {
    return true;
  }

  return false;
}
