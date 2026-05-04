export interface ColumnShape {
  matched: string[];
  added: string[];
  missing: string[];
}

export interface ColumnShapeSubSummaryProps {
  shape: ColumnShape;
  /**
   * Step-anchor picker affordance — when these props are provided AND
   * `stepCandidates.length > 0` AND `onStepRejectedAtChange` is defined,
   * an inline picker renders below the "new:" row.
   *
   * The consumer (MatchSummaryCard or its caller) is responsible for
   * filtering `shape.added` down to plausible step-of-origin columns (e.g.
   * via `suggestStepRejectedAtColumn` from `@variscout/core/defect`) before
   * passing `stepCandidates`. This component has no dependency on
   * `@variscout/core` — the filtering stays out of `@variscout/ui`.
   *
   * When `stepCandidates` is undefined, empty, or `onStepRejectedAtChange`
   * is undefined the picker does not render (Mode A.1 reopen, Mode A.2 paste
   * with no defect-mode-relevant columns, etc.).
   */
  stepCandidates?: string[];
  /** Currently-selected step column (undefined = "None / not set"). */
  stepRejectedAtColumn?: string;
  /** Called when the user picks or clears the step column. */
  onStepRejectedAtChange?: (column: string | undefined) => void;
}

const NONE_VALUE = '__none__';

export function ColumnShapeSubSummary({
  shape,
  stepCandidates,
  stepRejectedAtColumn,
  onStepRejectedAtChange,
}: ColumnShapeSubSummaryProps) {
  const showPicker =
    stepCandidates !== undefined &&
    stepCandidates.length > 0 &&
    onStepRejectedAtChange !== undefined;

  return (
    <div className="text-sm space-y-1" data-testid="column-shape-summary">
      {shape.matched.length > 0 && (
        <div>
          <span className="text-green-700 font-medium">matched:</span> {shape.matched.join(', ')}
        </div>
      )}
      {shape.added.length > 0 && (
        <div>
          <span className="text-blue-700 font-medium">new:</span> {shape.added.join(', ')}
        </div>
      )}
      {shape.missing.length > 0 && (
        <div>
          <span className="text-amber-700 font-medium">missing:</span> {shape.missing.join(', ')}
        </div>
      )}

      {showPicker && (
        <div
          className="mt-2 border-l-4 border-blue-300 bg-blue-50 dark:bg-blue-950/30 p-2"
          data-testid="step-anchor-picker"
        >
          <label
            htmlFor="step-rejected-at-select"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Step of origin (optional):
          </label>
          <select
            id="step-rejected-at-select"
            data-testid="step-rejected-at-select"
            className="text-xs border rounded px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            value={stepRejectedAtColumn ?? NONE_VALUE}
            onChange={e => {
              const val = e.target.value;
              onStepRejectedAtChange!(val === NONE_VALUE ? undefined : val);
            }}
          >
            <option value={NONE_VALUE}>None — defects anchor to outcome</option>
            {stepCandidates!.map(col => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
            Identifies which step caught each defect.
          </p>
        </div>
      )}
    </div>
  );
}
