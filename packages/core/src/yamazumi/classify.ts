/**
 * Activity type classification — normalize raw strings to canonical ActivityType
 */

import type { ActivityType } from './types';

/** Mapping of normalized strings to canonical activity types */
const CLASSIFICATION_MAP: Record<string, ActivityType> = {
  // Value-Adding
  va: 'va',
  'value-adding': 'va',
  'value-added': 'va',
  'value added': 'va',
  'value adding': 'va',
  valueadding: 'va',
  valueadded: 'va',

  // NVA Required
  'nva-required': 'nva-required',
  'nva required': 'nva-required',
  nvarequired: 'nva-required',
  'nva-r': 'nva-required',
  'nva req': 'nva-required',
  'non-value-adding required': 'nva-required',
  'necessary non-value-adding': 'nva-required',
  'required nva': 'nva-required',
  incidental: 'nva-required',

  // Waste
  waste: 'waste',
  nva: 'waste',
  muda: 'waste',
  'non-value-adding': 'waste',
  'non-value-added': 'waste',
  'non value adding': 'waste',
  'non value added': 'waste',
  nonvalueadding: 'waste',
  nonvalueadded: 'waste',

  // Wait
  wait: 'wait',
  waiting: 'wait',
  queue: 'wait',
  idle: 'wait',
  delay: 'wait',
};

/**
 * Classify a raw activity type string to a canonical ActivityType.
 *
 * Handles common variants: "VA", "Value-Added", "NVA", "Muda", "Wait", etc.
 * Unknown values default to 'waste' with a console warning.
 *
 * @param raw - Raw string from data (case-insensitive)
 * @returns Canonical ActivityType
 */
export function classifyActivityType(raw: string): ActivityType {
  const normalized = raw.toLowerCase().trim();

  const mapped = CLASSIFICATION_MAP[normalized];
  if (mapped) return mapped;

  // Partial matching for common prefixes
  if (normalized.startsWith('va') && !normalized.startsWith('value')) return 'va';
  if (normalized.startsWith('wait')) return 'wait';
  if (normalized.includes('waste')) return 'waste';
  if (normalized.includes('muda')) return 'waste';
  if (normalized.includes('queue')) return 'wait';
  if (normalized.includes('idle')) return 'wait';
  if (normalized.includes('delay')) return 'wait';

  // Unknown → waste with warning
  console.warn(`[yamazumi] Unknown activity type "${raw}", defaulting to "waste"`);
  return 'waste';
}

/**
 * Check if a raw string is a recognized activity type value.
 * Used for auto-detection (does not warn on unknown).
 */
export function isActivityTypeValue(raw: string): boolean {
  const normalized = raw.toLowerCase().trim();
  return (
    normalized in CLASSIFICATION_MAP ||
    normalized.startsWith('wait') ||
    normalized.includes('waste') ||
    normalized.includes('muda')
  );
}
