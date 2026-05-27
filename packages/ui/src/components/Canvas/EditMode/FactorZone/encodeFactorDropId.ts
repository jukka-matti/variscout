export const FACTOR_ZONE_GLOBAL_DROP_ID = 'factor-zone:global' as const;
const FACTOR_ZONE_STEP_PREFIX = 'factor-zone:step:';

export type FactorDropScope = 'global' | { stepId: string };
export type FactorDropId = typeof FACTOR_ZONE_GLOBAL_DROP_ID | `factor-zone:step:${string}`;
export type DecodedFactorDropScope = { scope: 'global' } | { scope: 'step'; stepId: string };

export function encodeFactorDropId(scope: FactorDropScope): FactorDropId {
  if (scope === 'global') return FACTOR_ZONE_GLOBAL_DROP_ID;
  return `${FACTOR_ZONE_STEP_PREFIX}${scope.stepId}` as FactorDropId;
}

export function isFactorDropId(value: unknown): value is FactorDropId {
  if (typeof value !== 'string') return false;
  if (value === FACTOR_ZONE_GLOBAL_DROP_ID) return true;
  if (!value.startsWith(FACTOR_ZONE_STEP_PREFIX)) return false;
  return value.length > FACTOR_ZONE_STEP_PREFIX.length;
}

export function decodeFactorDropId(value: string): DecodedFactorDropScope | null {
  if (value === FACTOR_ZONE_GLOBAL_DROP_ID) return { scope: 'global' };
  if (!value.startsWith(FACTOR_ZONE_STEP_PREFIX)) return null;
  const stepId = value.slice(FACTOR_ZONE_STEP_PREFIX.length);
  if (stepId.length === 0) return null;
  return { scope: 'step', stepId };
}
