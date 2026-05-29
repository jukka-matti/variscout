import type { FilterChipData } from '../components/filterTypes';

export function createTestFilterChipData(
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
