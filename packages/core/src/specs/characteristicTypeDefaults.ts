import type { CharacteristicType, OutcomeSpec } from '../processHub';

const SMALLER_KEYWORDS = ['defect', 'reject', 'scrap', 'fail', 'error', 'fault'];
const LARGER_KEYWORDS = ['yield', 'uptime', 'throughput', 'recovery', 'efficiency'];

const CPK_TARGET_DEFAULT = 1.33;

export function inferOutcomeCharacteristicType(
  columnName: string,
  _values?: number[]
): CharacteristicType {
  const lower = columnName.toLowerCase();
  if (SMALLER_KEYWORDS.some(k => lower.includes(k))) return 'smallerIsBetter';
  if (LARGER_KEYWORDS.some(k => lower.includes(k))) return 'largerIsBetter';
  return 'nominalIsBest';
}

export interface DataStats {
  mean: number;
  sigma: number;
}

export function defaultSpecsFor(type: CharacteristicType, stats: DataStats): Partial<OutcomeSpec> {
  switch (type) {
    case 'nominalIsBest':
      return { target: stats.mean, cpkTarget: CPK_TARGET_DEFAULT };
    case 'smallerIsBetter':
      return { target: 0, cpkTarget: CPK_TARGET_DEFAULT };
    case 'largerIsBetter':
      return { cpkTarget: CPK_TARGET_DEFAULT };
  }
}
