export const OUTCOME_ZONE_DROP_ID = 'outcome-zone:singleton' as const;
export type OutcomeZoneDropId = typeof OUTCOME_ZONE_DROP_ID;

export function encodeOutcomeDropId(): OutcomeZoneDropId {
  return OUTCOME_ZONE_DROP_ID;
}

export function isOutcomeDropId(value: unknown): value is OutcomeZoneDropId {
  return value === OUTCOME_ZONE_DROP_ID;
}

export function decodeOutcomeDropId(value: string): 'singleton' | null {
  return value === OUTCOME_ZONE_DROP_ID ? 'singleton' : null;
}
