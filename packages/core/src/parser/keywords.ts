/**
 * Keyword lists and patterns for smart column and channel detection
 */

import type { FactorRole } from '../ai/types';

export const OUTCOME_KEYWORDS = [
  'time',
  'duration',
  'cycle',
  'lead',
  'ct',
  'weight',
  'length',
  'width',
  'height',
  'thickness',
  'temperature',
  'temp',
  'pressure',
  'value',
  'measurement',
  'result',
  'y',
  'response',
  'yield',
  'output',
  'reading',
  'score',
  'rate',
  'speed',
  'velocity',
  'flow',
  'volume',
  'density',
  'concentration',
];

export const FACTOR_KEYWORDS = [
  'shift',
  'operator',
  'machine',
  'line',
  'cell',
  'product',
  'batch',
  'supplier',
  'day',
  'week',
  'station',
  'tool',
  'lot',
  'group',
  'team',
  'department',
  'plant',
  'site',
  'vendor',
  'type',
  'category',
  'model',
  'version',
];

export const TIME_KEYWORDS = [
  'date',
  'time',
  'timestamp',
  'datetime',
  'created',
  'recorded',
  'when',
];

/**
 * Patterns that indicate a column is a channel/measurement point
 * Matches: V1, V2, Valve_1, Channel_1, Head1, Nozzle_01, etc.
 */
export const CHANNEL_PATTERNS = [
  /^v\d+$/i, // V1, V2, V140
  /^valve[_\s-]?\d+$/i, // Valve_1, Valve-1, Valve 1
  /^channel[_\s-]?\d+$/i, // Channel_1, Channel-1
  /^head[_\s-]?\d+$/i, // Head_1, Head1
  /^nozzle[_\s-]?\d+$/i, // Nozzle_1
  /^station[_\s-]?\d+$/i, // Station_1
  /^pos(ition)?[_\s-]?\d+$/i, // Pos1, Position_1
  /^port[_\s-]?\d+$/i, // Port_1
  /^lane[_\s-]?\d+$/i, // Lane_1
  /^cavity[_\s-]?\d+$/i, // Cavity_1 (injection molding)
  /^die[_\s-]?\d+$/i, // Die_1
  /^spindle[_\s-]?\d+$/i, // Spindle_1
  /^cell[_\s-]?\d+$/i, // Cell_1
  /^unit[_\s-]?\d+$/i, // Unit_1
  /^sensor[_\s-]?\d+$/i, // Sensor_1
  /^ch\d+$/i, // CH1, CH2
  /^\d+$/, // Just numbers: 1, 2, 3...
];

/**
 * Patterns for metadata columns (non-channel columns)
 */
export const METADATA_PATTERNS = [
  /^(date|time|timestamp|datetime)$/i,
  /^(batch|lot|run|sample)([_\s-]?(id|num(ber)?|no))?$/i,
  /^(operator|tech(nician)?|inspector)$/i,
  /^(shift|line|machine)$/i,
  /^(product|part|sku|item)([_\s-]?(id|num(ber)?|no|name))?$/i,
  /^(id|row|index|record)$/i,
  /^(comment|note|remark)s?$/i,
];

/**
 * Check if a column name matches channel patterns
 */
export function matchesChannelPattern(colName: string): boolean {
  return CHANNEL_PATTERNS.some(pattern => pattern.test(colName.trim()));
}

/**
 * Check if a column name matches metadata patterns
 */
export function matchesMetadataPattern(colName: string): boolean {
  return METADATA_PATTERNS.some(pattern => pattern.test(colName.trim()));
}

/** Keyword groups for inferring factor roles (AI context) */
export const FACTOR_ROLE_KEYWORDS: Record<string, string[]> = {
  equipment: [
    'machine',
    'head',
    'nozzle',
    'cavity',
    'spindle',
    'station',
    'line',
    'cell',
    'tool',
    'die',
    'valve',
    'sensor',
    'equipment',
  ],
  temporal: ['shift', 'day', 'week', 'month', 'hour', 'date', 'time', 'period', 'quarter', 'year'],
  operator: ['operator', 'technician', 'inspector', 'worker', 'crew', 'team', 'person'],
  material: ['batch', 'lot', 'supplier', 'vendor', 'material', 'raw', 'resin', 'grade', 'compound'],
  location: ['plant', 'site', 'zone', 'area', 'department', 'building', 'room', 'floor'],
};

/**
 * Infer a factor role from column name using keyword matching.
 * Returns null if no role can be inferred.
 */
export function inferFactorRole(columnName: string): FactorRole | null {
  const lower = columnName.toLowerCase().trim();
  for (const [role, keywords] of Object.entries(FACTOR_ROLE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return role as FactorRole;
    }
  }
  return null;
}

/**
 * Find the keyword that matched a column name for tooltip display.
 * Returns null if no keyword matches.
 */
export function findMatchedFactorKeyword(columnName: string): string | null {
  const lower = columnName.toLowerCase().trim();
  for (const keywords of Object.values(FACTOR_ROLE_KEYWORDS)) {
    const match = keywords.find(kw => lower.includes(kw));
    if (match) return match;
  }
  return null;
}
