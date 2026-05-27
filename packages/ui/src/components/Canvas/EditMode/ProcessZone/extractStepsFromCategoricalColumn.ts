export interface ExtractedStep {
  id: string;
  name: string;
  order: number;
}

export function extractStepsFromCategoricalColumn(
  columnName: string,
  distinctValues: string[]
): ExtractedStep[] {
  return distinctValues.map((value, idx) => ({
    id: `step-${columnName}-${idx}`,
    name: value,
    order: idx,
  }));
}
