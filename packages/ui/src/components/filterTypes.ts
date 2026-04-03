/**
 * Simplified filter chip data — no variation tracking dependencies.
 *
 * Previously imported from @variscout/hooks (useVariationTracking).
 * Now defined locally since variation tracking was removed.
 */
export interface FilterChipData {
  /** The factor/column name being filtered */
  factor: string;
  /** Currently selected value(s) */
  values: (string | number)[];
  /** All available values for the dropdown */
  availableValues: {
    value: string | number;
    count: number;
    isSelected: boolean;
  }[];
}
