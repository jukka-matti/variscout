export const PROCESS_ZONE_DROP_ID = 'process-zone:singleton' as const;
export type ProcessZoneDropId = typeof PROCESS_ZONE_DROP_ID;

export function encodeProcessDropId(): ProcessZoneDropId {
  return PROCESS_ZONE_DROP_ID;
}

export function isProcessDropId(value: unknown): value is ProcessZoneDropId {
  return value === PROCESS_ZONE_DROP_ID;
}
