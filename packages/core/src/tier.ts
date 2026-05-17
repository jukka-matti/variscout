/**
 * Channel-limit helpers for the wedge V1 single SKU.
 *
 * Pre-wedge this module discriminated `free` vs `enterprise` tiers + a
 * `team` plan dimension. ADR-082 retires both: VariScout V1 is single-SKU
 * (€99/mo Azure tenant-wide). What survives is the platform channel limit.
 */

export const MAX_CHANNELS = 1500;
export const CHANNEL_WARNING_THRESHOLD = 700;

export interface ChannelLimitResult {
  exceeded: boolean;
  current: number;
  max: number;
  showWarning: boolean;
}

export function validateChannelCount(count: number): ChannelLimitResult {
  return {
    exceeded: count > MAX_CHANNELS,
    current: count,
    max: MAX_CHANNELS,
    showWarning: count > CHANNEL_WARNING_THRESHOLD && count <= MAX_CHANNELS,
  };
}
