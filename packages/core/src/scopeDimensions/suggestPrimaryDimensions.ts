// packages/core/src/scopeDimensions/suggestPrimaryDimensions.ts
const NAME_KEYWORDS = [
  'id',
  'lot',
  'batch',
  'product',
  'customer',
  'shift',
  'operator',
  'machine',
  'supplier',
  'sku',
  'plant',
  'line',
  'station',
];
const MIN_CARD = 3;
const MAX_CARD = 50;

export interface DimensionCandidate {
  name: string;
  uniqueCount: number;
}

export function suggestPrimaryDimensions(columns: DimensionCandidate[]): string[] {
  return columns
    .filter(c => c.uniqueCount >= MIN_CARD && c.uniqueCount <= MAX_CARD)
    .filter(c => {
      const lower = c.name.toLowerCase();
      return NAME_KEYWORDS.some(
        k =>
          lower === k || lower.endsWith(`_${k}`) || lower.startsWith(`${k}_`) || lower.endsWith(k)
      );
    })
    .map(c => c.name);
}
