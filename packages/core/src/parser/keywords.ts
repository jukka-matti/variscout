/**
 * Keyword lists and patterns for smart column and channel detection
 */

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
