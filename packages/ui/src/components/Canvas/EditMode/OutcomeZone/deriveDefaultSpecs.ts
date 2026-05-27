import type { CharacteristicType, OutcomeSpec } from '@variscout/core';

export type DerivedSpecs = Pick<OutcomeSpec, 'target' | 'lsl' | 'usl' | 'cpkTarget'>;

export function deriveDefaultSpecs(
  values: number[],
  characteristicType: CharacteristicType
): DerivedSpecs {
  const cpkTarget = 1.33;
  if (characteristicType !== 'nominalIsBest') {
    return { target: undefined, lsl: undefined, usl: undefined, cpkTarget };
  }
  const finite = values.filter(v => Number.isFinite(v));
  if (finite.length === 0) {
    return { target: undefined, lsl: undefined, usl: undefined, cpkTarget };
  }
  const mean = finite.reduce((sum, v) => sum + v, 0) / finite.length;
  return { target: mean, lsl: undefined, usl: undefined, cpkTarget };
}
