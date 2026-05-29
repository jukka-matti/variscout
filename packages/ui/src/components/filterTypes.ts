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

/**
 * Build a FilterChipData shape from a flat factor + values + availableValues
 * triple. Used by production consumers that need to feed the FilterChipDropdown
 * primitive without precomputing the full per-value shape (count + isSelected).
 *
 * Defaults `count` to 0 (FilterChipDropdown displays counts; consumers without
 * count data render `n=0`, which is acceptable for the scope-chrome surface).
 * `isSelected` is derived from `values.includes(v)`.
 */
export function buildFilterChipData(
  factor: string,
  values: (string | number)[] = [],
  availableValues: (string | number)[] = []
): FilterChipData {
  return {
    factor,
    values,
    availableValues: availableValues.map(v => ({
      value: v,
      count: 0,
      isSelected: values.includes(v),
    })),
  };
}
