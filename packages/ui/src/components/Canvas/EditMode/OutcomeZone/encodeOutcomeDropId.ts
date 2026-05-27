export const OUTCOME_ZONE_SINGLETON_DROP_ID = 'outcome-zone:singleton' as const;
const OUTCOME_ZONE_STEP_PREFIX = 'outcome-zone:step:';

export type OutcomeDropScope = 'singleton' | { stepId: string };
export type OutcomeDropId = typeof OUTCOME_ZONE_SINGLETON_DROP_ID | `outcome-zone:step:${string}`;
export type DecodedOutcomeDropScope = { scope: 'singleton' } | { scope: 'step'; stepId: string };

export function encodeOutcomeDropId(scope: OutcomeDropScope): OutcomeDropId {
  if (scope === 'singleton') return OUTCOME_ZONE_SINGLETON_DROP_ID;
  return `${OUTCOME_ZONE_STEP_PREFIX}${scope.stepId}` as OutcomeDropId;
}

export function decodeOutcomeDropId(value: string): DecodedOutcomeDropScope | null {
  if (value === OUTCOME_ZONE_SINGLETON_DROP_ID) return { scope: 'singleton' };
  if (value.startsWith(OUTCOME_ZONE_STEP_PREFIX)) {
    const stepId = value.slice(OUTCOME_ZONE_STEP_PREFIX.length);
    if (stepId.length === 0) return null;
    return { scope: 'step', stepId };
  }
  return null;
}

export function isOutcomeDropId(value: unknown): value is OutcomeDropId {
  return typeof value === 'string' && decodeOutcomeDropId(value) !== null;
}
