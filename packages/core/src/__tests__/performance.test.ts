import { describe, it, expect } from 'vitest';
import {
  getChannelHealth,
  calculateChannelStats,
  calculateChannelPerformance,
  sortChannels,
  filterChannelsByHealth,
  getChannelsNeedingAttention,
  getWorstChannels,
  getBestChannels,
  CPK_THRESHOLDS,
  validateThresholds,
  type CpkThresholds,
} from '../performance';
import { detectChannelColumns, detectWideFormat } from '../parser';
import type { ChannelResult } from '../types';

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generate valve-style test data with controllable Cpk per channel
 */
function generateValveData(
  config: {
    channels: number;
    rowsPerChannel: number;
    target?: number;
    tolerance?: number;
    cpkDistribution?: 'mixed' | 'good' | 'bad';
  } = { channels: 10, rowsPerChannel: 50 }
): {
  data: Record<string, number | string>[];
  specs: { usl: number; lsl: number; target: number };
} {
  const {
    channels,
    rowsPerChannel,
    target = 330,
    tolerance = 4,
    cpkDistribution = 'mixed',
  } = config;

  const usl = target + tolerance / 2;
  const lsl = target - tolerance / 2;
  const specs = { usl, lsl, target };

  const data: Record<string, number | string>[] = [];

  // Generate row data
  for (let row = 0; row < rowsPerChannel; row++) {
    const rowData: Record<string, number | string> = {
      Batch: `Batch_${Math.floor(row / 10) + 1}`,
      Date: `2024-01-${String(row + 1).padStart(2, '0')}`,
    };

    for (let ch = 1; ch <= channels; ch++) {
      // Determine stdDev based on cpkDistribution
      let stdDev: number;
      let offset = 0;

      if (cpkDistribution === 'mixed') {
        // Mix of good and bad channels
        if (ch <= Math.floor(channels * 0.2)) {
          // 20% critical (Cpk < 1.0)
          stdDev = tolerance / 4; // Cpk ~= 0.67
          offset = tolerance * 0.1; // Slightly off-center
        } else if (ch <= Math.floor(channels * 0.4)) {
          // 20% warning (Cpk 1.0-1.33)
          stdDev = tolerance / 5; // Cpk ~= 1.1
        } else {
          // 60% good (Cpk > 1.33)
          stdDev = tolerance / 9; // Cpk ~= 1.5
        }
      } else if (cpkDistribution === 'good') {
        stdDev = tolerance / 10; // All high Cpk
      } else {
        stdDev = tolerance / 3; // All low Cpk
      }

      // Generate random value with normal-like distribution
      const mean = target + offset;
      const value = mean + (Math.random() - 0.5) * stdDev * 2;
      rowData[`V${ch}`] = Math.round(value * 100) / 100;
    }

    data.push(rowData);
  }

  return { data, specs };
}

// ============================================================================
// Health Classification Tests
// ============================================================================

describe('getChannelHealth', () => {
  it('should classify critical when Cpk < 1.0', () => {
    expect(getChannelHealth(0.5)).toBe('critical');
    expect(getChannelHealth(0.99)).toBe('critical');
    expect(getChannelHealth(0)).toBe('critical');
    expect(getChannelHealth(-0.5)).toBe('critical');
  });

  it('should classify warning when 1.0 <= Cpk < 1.33', () => {
    expect(getChannelHealth(1.0)).toBe('warning');
    expect(getChannelHealth(1.2)).toBe('warning');
    expect(getChannelHealth(1.32)).toBe('warning');
  });

  it('should classify capable when 1.33 <= Cpk < 1.67', () => {
    expect(getChannelHealth(1.33)).toBe('capable');
    expect(getChannelHealth(1.5)).toBe('capable');
    expect(getChannelHealth(1.66)).toBe('capable');
  });

  it('should classify excellent when Cpk >= 1.67', () => {
    expect(getChannelHealth(1.67)).toBe('excellent');
    expect(getChannelHealth(2.0)).toBe('excellent');
    expect(getChannelHealth(5.0)).toBe('excellent');
  });

  it('should classify critical when Cpk is undefined', () => {
    expect(getChannelHealth(undefined)).toBe('critical');
  });

  it('should match CPK_THRESHOLDS constants', () => {
    expect(getChannelHealth(CPK_THRESHOLDS.critical - 0.01)).toBe('critical');
    expect(getChannelHealth(CPK_THRESHOLDS.critical)).toBe('warning');
    expect(getChannelHealth(CPK_THRESHOLDS.warning - 0.01)).toBe('warning');
    expect(getChannelHealth(CPK_THRESHOLDS.warning)).toBe('capable');
    expect(getChannelHealth(CPK_THRESHOLDS.capable - 0.01)).toBe('capable');
    expect(getChannelHealth(CPK_THRESHOLDS.capable)).toBe('excellent');
  });
});

// ============================================================================
// Channel Statistics Tests
// ============================================================================

describe('calculateChannelStats', () => {
  it('should calculate basic stats for a single channel', () => {
    const data = [{ V1: 10 }, { V1: 12 }, { V1: 11 }, { V1: 13 }, { V1: 10 }];
    const specs = { usl: 15, lsl: 8 };

    const result = calculateChannelStats(data, 'V1', specs);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('V1');
    expect(result!.n).toBe(5);
    expect(result!.mean).toBeCloseTo(11.2, 1);
    expect(result!.stdDev).toBeGreaterThan(0);
    expect(result!.min).toBe(10);
    expect(result!.max).toBe(13);
    expect(result!.values).toHaveLength(5);
  });

  it('should calculate Cp and Cpk with two-sided specs', () => {
    // Centered data with known stdDev
    const data = [{ V1: 9 }, { V1: 10 }, { V1: 11 }];
    const specs = { usl: 13, lsl: 7 };

    const result = calculateChannelStats(data, 'V1', specs);

    expect(result).not.toBeNull();
    expect(result!.cp).toBeCloseTo(1.0, 1);
    expect(result!.cpk).toBeCloseTo(1.0, 1);
  });

  it('should calculate Cpk with one-sided spec (USL only)', () => {
    const data = [{ V1: 9 }, { V1: 10 }, { V1: 11 }];
    const specs = { usl: 13 };

    const result = calculateChannelStats(data, 'V1', specs);

    expect(result).not.toBeNull();
    expect(result!.cp).toBeUndefined();
    expect(result!.cpk).toBeCloseTo(1.0, 1);
  });

  it('should calculate out of spec percentage', () => {
    const data = [
      { V1: 5 }, // Below LSL
      { V1: 10 }, // In spec
      { V1: 10 }, // In spec
      { V1: 10 }, // In spec
      { V1: 15 }, // Above USL
    ];
    const specs = { usl: 12, lsl: 8 };

    const result = calculateChannelStats(data, 'V1', specs);

    expect(result).not.toBeNull();
    expect(result!.outOfSpecPercentage).toBe(40); // 2 out of 5
  });

  it('should return null for insufficient data', () => {
    const data = [{ V1: 10 }]; // Only 1 point
    const specs = { usl: 15, lsl: 8 };

    const result = calculateChannelStats(data, 'V1', specs);

    expect(result).toBeNull();
  });

  it('should handle missing values', () => {
    const data = [
      { V1: 10 },
      { V1: null },
      { V1: 12 },
      { V1: undefined },
      { V1: 'invalid' },
      { V1: 11 },
    ];
    const specs = { usl: 15, lsl: 8 };

    const result = calculateChannelStats(data, 'V1', specs);

    expect(result).not.toBeNull();
    expect(result!.n).toBe(3); // Only 3 valid numeric values
  });

  it('should use custom label when provided', () => {
    const data = [{ V1: 10 }, { V1: 12 }];
    const specs = { usl: 15, lsl: 8 };

    const result = calculateChannelStats(data, 'V1', specs, 'Valve 1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('V1');
    expect(result!.label).toBe('Valve 1');
  });

  it('should assign correct health classification', () => {
    // Create data that results in specific Cpk values
    // Low Cpk (high variation)
    const badData = Array.from({ length: 20 }, (_, i) => ({ V1: 5 + i })); // Large spread
    const badResult = calculateChannelStats(badData, 'V1', { usl: 25, lsl: 0 });
    expect(badResult!.health).toBe('critical');

    // High Cpk (low variation, centered)
    const goodData = Array.from({ length: 20 }, () => ({ V1: 10 + (Math.random() - 0.5) * 0.1 }));
    const goodResult = calculateChannelStats(goodData, 'V1', { usl: 15, lsl: 5, target: 10 });
    expect(['capable', 'excellent']).toContain(goodResult!.health);
  });
});

// ============================================================================
// Multi-Channel Performance Tests
// ============================================================================

describe('calculateChannelPerformance', () => {
  it('should calculate stats for all channels', () => {
    const { data, specs } = generateValveData({ channels: 5, rowsPerChannel: 20 });
    const channelIds = ['V1', 'V2', 'V3', 'V4', 'V5'];

    const result = calculateChannelPerformance(data, channelIds, specs);

    expect(result.channels).toHaveLength(5);
    expect(result.specs).toEqual(specs);
    expect(result.summary.totalChannels).toBe(5);
  });

  it('should calculate summary health counts', () => {
    const { data, specs } = generateValveData({
      channels: 10,
      rowsPerChannel: 50,
      cpkDistribution: 'mixed',
    });
    const channelIds = Array.from({ length: 10 }, (_, i) => `V${i + 1}`);

    const result = calculateChannelPerformance(data, channelIds, specs);

    const { healthCounts } = result.summary;
    const totalHealth =
      healthCounts.critical + healthCounts.warning + healthCounts.capable + healthCounts.excellent;

    expect(totalHealth).toBe(10);
    expect(result.summary.needsAttentionCount).toBe(healthCounts.critical + healthCounts.warning);
  });

  it('should calculate overall Cpk statistics', () => {
    const { data, specs } = generateValveData({ channels: 5, rowsPerChannel: 50 });
    const channelIds = ['V1', 'V2', 'V3', 'V4', 'V5'];

    const result = calculateChannelPerformance(data, channelIds, specs);

    expect(result.summary.overall.meanCpk).toBeGreaterThan(0);
    expect(result.summary.overall.minCpk).toBeLessThanOrEqual(result.summary.overall.meanCpk);
    expect(result.summary.overall.maxCpk).toBeGreaterThanOrEqual(result.summary.overall.meanCpk);
  });

  it('should skip channels with insufficient data', () => {
    const data = [
      { V1: 10, V2: 20 },
      { V1: 11, V2: 21 },
      { V1: 12 }, // V2 missing
    ];
    const specs = { usl: 25, lsl: 5 };

    const result = calculateChannelPerformance(data, ['V1', 'V2', 'V3'], specs);

    // V1: 3 values, V2: 2 values, V3: 0 values
    expect(result.channels.length).toBe(2);
  });
});

// ============================================================================
// Sorting and Filtering Tests
// ============================================================================

describe('sortChannels', () => {
  const mockChannels: ChannelResult[] = [
    {
      id: 'V2',
      label: 'V2',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 1.5,
      min: 8,
      max: 12,
      health: 'capable',
      outOfSpecPercentage: 0,
      values: [],
    },
    {
      id: 'V1',
      label: 'V1',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 0.8,
      min: 8,
      max: 12,
      health: 'critical',
      outOfSpecPercentage: 5,
      values: [],
    },
    {
      id: 'V3',
      label: 'V3',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 2.0,
      min: 8,
      max: 12,
      health: 'excellent',
      outOfSpecPercentage: 0,
      values: [],
    },
    {
      id: 'V10',
      label: 'V10',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 1.1,
      min: 8,
      max: 12,
      health: 'warning',
      outOfSpecPercentage: 2,
      values: [],
    },
  ];

  it('should sort by Cpk ascending (worst first)', () => {
    const sorted = sortChannels(mockChannels, 'cpk-asc');

    expect(sorted[0].id).toBe('V1'); // Cpk 0.8
    expect(sorted[1].id).toBe('V10'); // Cpk 1.1
    expect(sorted[2].id).toBe('V2'); // Cpk 1.5
    expect(sorted[3].id).toBe('V3'); // Cpk 2.0
  });

  it('should sort by Cpk descending (best first)', () => {
    const sorted = sortChannels(mockChannels, 'cpk-desc');

    expect(sorted[0].id).toBe('V3'); // Cpk 2.0
    expect(sorted[3].id).toBe('V1'); // Cpk 0.8
  });

  it('should sort by name with natural numeric sorting', () => {
    const sorted = sortChannels(mockChannels, 'name');

    expect(sorted[0].id).toBe('V1');
    expect(sorted[1].id).toBe('V2');
    expect(sorted[2].id).toBe('V3');
    expect(sorted[3].id).toBe('V10'); // V10 comes after V3, not after V1
  });

  it('should sort by health (worst first)', () => {
    const sorted = sortChannels(mockChannels, 'health');

    expect(sorted[0].health).toBe('critical');
    expect(sorted[1].health).toBe('warning');
    expect(sorted[2].health).toBe('capable');
    expect(sorted[3].health).toBe('excellent');
  });

  it('should not mutate original array', () => {
    const original = [...mockChannels];
    sortChannels(mockChannels, 'cpk-asc');

    expect(mockChannels).toEqual(original);
  });

  it('should handle undefined Cpk values', () => {
    const channelsWithUndefined: ChannelResult[] = [
      {
        id: 'V1',
        label: 'V1',
        n: 10,
        mean: 10,
        stdDev: 1,
        cpk: undefined,
        min: 8,
        max: 12,
        health: 'critical',
        outOfSpecPercentage: 5,
        values: [],
      },
      {
        id: 'V2',
        label: 'V2',
        n: 10,
        mean: 10,
        stdDev: 1,
        cpk: 1.0,
        min: 8,
        max: 12,
        health: 'warning',
        outOfSpecPercentage: 2,
        values: [],
      },
    ];

    const sorted = sortChannels(channelsWithUndefined, 'cpk-asc');
    expect(sorted[0].id).toBe('V1'); // Undefined treated as -Infinity
  });
});

describe('filterChannelsByHealth', () => {
  const mockChannels: ChannelResult[] = [
    {
      id: 'V1',
      label: 'V1',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 0.8,
      min: 8,
      max: 12,
      health: 'critical',
      outOfSpecPercentage: 5,
      values: [],
    },
    {
      id: 'V2',
      label: 'V2',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 1.1,
      min: 8,
      max: 12,
      health: 'warning',
      outOfSpecPercentage: 2,
      values: [],
    },
    {
      id: 'V3',
      label: 'V3',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 1.5,
      min: 8,
      max: 12,
      health: 'capable',
      outOfSpecPercentage: 0,
      values: [],
    },
    {
      id: 'V4',
      label: 'V4',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 2.0,
      min: 8,
      max: 12,
      health: 'excellent',
      outOfSpecPercentage: 0,
      values: [],
    },
  ];

  it('should filter by single health level', () => {
    const critical = filterChannelsByHealth(mockChannels, ['critical']);
    expect(critical).toHaveLength(1);
    expect(critical[0].id).toBe('V1');
  });

  it('should filter by multiple health levels', () => {
    const needsAttention = filterChannelsByHealth(mockChannels, ['critical', 'warning']);
    expect(needsAttention).toHaveLength(2);
    expect(needsAttention.map(c => c.id)).toContain('V1');
    expect(needsAttention.map(c => c.id)).toContain('V2');
  });

  it('should return empty array if no matches', () => {
    const allGood: ChannelResult[] = [
      {
        id: 'V1',
        label: 'V1',
        n: 10,
        mean: 10,
        stdDev: 1,
        cpk: 2.0,
        min: 8,
        max: 12,
        health: 'excellent',
        outOfSpecPercentage: 0,
        values: [],
      },
    ];
    const filtered = filterChannelsByHealth(allGood, ['critical']);
    expect(filtered).toHaveLength(0);
  });
});

describe('getChannelsNeedingAttention', () => {
  it('should return critical and warning channels sorted by Cpk', () => {
    const mockChannels: ChannelResult[] = [
      {
        id: 'V1',
        label: 'V1',
        n: 10,
        mean: 10,
        stdDev: 1,
        cpk: 1.1,
        min: 8,
        max: 12,
        health: 'warning',
        outOfSpecPercentage: 2,
        values: [],
      },
      {
        id: 'V2',
        label: 'V2',
        n: 10,
        mean: 10,
        stdDev: 1,
        cpk: 2.0,
        min: 8,
        max: 12,
        health: 'excellent',
        outOfSpecPercentage: 0,
        values: [],
      },
      {
        id: 'V3',
        label: 'V3',
        n: 10,
        mean: 10,
        stdDev: 1,
        cpk: 0.5,
        min: 8,
        max: 12,
        health: 'critical',
        outOfSpecPercentage: 10,
        values: [],
      },
    ];

    const needsAttention = getChannelsNeedingAttention(mockChannels);

    expect(needsAttention).toHaveLength(2);
    expect(needsAttention[0].id).toBe('V3'); // Worst first (Cpk 0.5)
    expect(needsAttention[1].id).toBe('V1'); // Cpk 1.1
  });
});

describe('getWorstChannels and getBestChannels', () => {
  const mockChannels: ChannelResult[] = [
    {
      id: 'V1',
      label: 'V1',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 0.5,
      min: 8,
      max: 12,
      health: 'critical',
      outOfSpecPercentage: 10,
      values: [],
    },
    {
      id: 'V2',
      label: 'V2',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 1.0,
      min: 8,
      max: 12,
      health: 'warning',
      outOfSpecPercentage: 5,
      values: [],
    },
    {
      id: 'V3',
      label: 'V3',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 1.5,
      min: 8,
      max: 12,
      health: 'capable',
      outOfSpecPercentage: 1,
      values: [],
    },
    {
      id: 'V4',
      label: 'V4',
      n: 10,
      mean: 10,
      stdDev: 1,
      cpk: 2.0,
      min: 8,
      max: 12,
      health: 'excellent',
      outOfSpecPercentage: 0,
      values: [],
    },
  ];

  it('should get top N worst channels', () => {
    const worst = getWorstChannels(mockChannels, 2);

    expect(worst).toHaveLength(2);
    expect(worst[0].cpk).toBe(0.5);
    expect(worst[1].cpk).toBe(1.0);
  });

  it('should get top N best channels', () => {
    const best = getBestChannels(mockChannels, 2);

    expect(best).toHaveLength(2);
    expect(best[0].cpk).toBe(2.0);
    expect(best[1].cpk).toBe(1.5);
  });

  it('should handle N larger than array length', () => {
    const all = getWorstChannels(mockChannels, 10);
    expect(all).toHaveLength(4);
  });
});

// ============================================================================
// Channel Detection Tests
// ============================================================================

describe('detectChannelColumns', () => {
  it('should detect columns matching channel patterns', () => {
    const data = [
      { Date: '2024-01-01', Batch: 'A', V1: 10, V2: 11, V3: 12 },
      { Date: '2024-01-02', Batch: 'A', V1: 10, V2: 11, V3: 12 },
    ];

    const channels = detectChannelColumns(data);

    expect(channels).toHaveLength(3);
    expect(channels.map(c => c.id)).toEqual(['V1', 'V2', 'V3']);
    expect(channels.every(c => c.matchedPattern)).toBe(true);
  });

  it('should skip known metadata columns', () => {
    const data = [
      { Date: '2024-01-01', Batch: 'A', Operator: 'John', V1: 10, V2: 11 },
      { Date: '2024-01-02', Batch: 'B', Operator: 'Jane', V1: 10, V2: 11 },
    ];

    const channels = detectChannelColumns(data);

    expect(channels.map(c => c.id)).toEqual(['V1', 'V2']);
    expect(channels.map(c => c.id)).not.toContain('Date');
    expect(channels.map(c => c.id)).not.toContain('Batch');
    expect(channels.map(c => c.id)).not.toContain('Operator');
  });

  it('should detect various channel naming patterns', () => {
    const data = [
      { Valve_1: 10, Channel_2: 11, Head3: 12, Nozzle_4: 13, CH5: 14 },
      { Valve_1: 10, Channel_2: 11, Head3: 12, Nozzle_4: 13, CH5: 14 },
    ];

    const channels = detectChannelColumns(data);

    expect(channels).toHaveLength(5);
    expect(channels.every(c => c.matchedPattern)).toBe(true);
  });

  it('should include numeric columns without pattern match', () => {
    const data = [
      { CustomCol: 10, AnotherNum: 11, V1: 12 },
      { CustomCol: 10, AnotherNum: 11, V1: 12 },
    ];

    const channels = detectChannelColumns(data);

    expect(channels).toHaveLength(3);
    const customCol = channels.find(c => c.id === 'CustomCol');
    expect(customCol?.matchedPattern).toBe(false);
  });

  it('should calculate preview stats', () => {
    const data = [{ V1: 10 }, { V1: 20 }, { V1: 30 }];

    const channels = detectChannelColumns(data);

    expect(channels[0].preview.min).toBe(10);
    expect(channels[0].preview.max).toBe(30);
    expect(channels[0].preview.mean).toBe(20);
    expect(channels[0].n).toBe(3);
  });

  it('should handle empty data', () => {
    const channels = detectChannelColumns([]);
    expect(channels).toHaveLength(0);
  });
});

describe('detectWideFormat', () => {
  it('should detect wide format with high confidence when patterns match', () => {
    const data = [
      { Date: '2024-01-01', V1: 10, V2: 11, V3: 12, V4: 13, V5: 14 },
      { Date: '2024-01-02', V1: 10, V2: 11, V3: 12, V4: 13, V5: 14 },
    ];

    const result = detectWideFormat(data);

    expect(result.isWideFormat).toBe(true);
    expect(result.confidence).toBe('high');
    expect(result.channels).toHaveLength(5);
    expect(result.metadataColumns).toContain('Date');
  });

  it('should return low confidence when few channels detected', () => {
    const data = [
      { Date: '2024-01-01', Value: 10 },
      { Date: '2024-01-02', Value: 11 },
    ];

    const result = detectWideFormat(data);

    expect(result.isWideFormat).toBe(false);
    expect(result.confidence).toBe('low');
  });

  it('should identify metadata columns separately', () => {
    const data = [
      { Date: '2024-01-01', Batch: 'A', Operator: 'John', V1: 10, V2: 11, V3: 12 },
      { Date: '2024-01-02', Batch: 'B', Operator: 'Jane', V1: 10, V2: 11, V3: 12 },
    ];

    const result = detectWideFormat(data);

    expect(result.metadataColumns).toContain('Date');
    expect(result.metadataColumns).toContain('Batch');
    expect(result.metadataColumns).toContain('Operator');
    expect(result.channels.map(c => c.id)).not.toContain('Date');
  });

  it('should provide detection reason', () => {
    const data = [
      { V1: 10, V2: 11, V3: 12, V4: 13 },
      { V1: 10, V2: 11, V3: 12, V4: 13 },
    ];

    const result = detectWideFormat(data);

    expect(result.reason).toBeTruthy();
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('should handle customizable minChannels option', () => {
    const data = [
      { V1: 10, V2: 11 },
      { V1: 10, V2: 11 },
    ];

    const defaultResult = detectWideFormat(data);
    expect(defaultResult.isWideFormat).toBe(false); // Default minChannels is 3

    const customResult = detectWideFormat(data, { minChannels: 2 });
    expect(customResult.isWideFormat).toBe(true);
  });
});

// ============================================================================
// Custom Cpk Thresholds Tests
// ============================================================================

describe('Custom Cpk Thresholds', () => {
  describe('validateThresholds', () => {
    it('should validate correct threshold ordering', () => {
      expect(validateThresholds({ critical: 1.0, warning: 1.33, capable: 1.67 })).toBe(true);
      expect(validateThresholds({ critical: 1.5, warning: 2.0, capable: 2.5 })).toBe(true);
      expect(validateThresholds({ critical: 0.5, warning: 1.0, capable: 1.5 })).toBe(true);
    });

    it('should reject invalid threshold ordering', () => {
      expect(validateThresholds({ critical: 1.5, warning: 1.0, capable: 2.0 })).toBe(false);
      expect(validateThresholds({ critical: 1.0, warning: 2.0, capable: 1.5 })).toBe(false);
      expect(validateThresholds({ critical: 2.0, warning: 1.5, capable: 1.0 })).toBe(false);
    });

    it('should reject equal threshold values', () => {
      expect(validateThresholds({ critical: 1.0, warning: 1.0, capable: 1.5 })).toBe(false);
      expect(validateThresholds({ critical: 1.0, warning: 1.5, capable: 1.5 })).toBe(false);
    });

    it('should reject zero or negative critical threshold', () => {
      expect(validateThresholds({ critical: 0, warning: 1.0, capable: 1.5 })).toBe(false);
      expect(validateThresholds({ critical: -0.5, warning: 1.0, capable: 1.5 })).toBe(false);
    });
  });

  describe('getChannelHealth with custom thresholds', () => {
    const defaultThresholds = CPK_THRESHOLDS;
    const aerospaceThresholds: CpkThresholds = { critical: 1.5, warning: 2.0, capable: 2.5 };
    const consumerThresholds: CpkThresholds = { critical: 0.67, warning: 1.0, capable: 1.33 };

    it('should use default thresholds when not specified', () => {
      expect(getChannelHealth(0.8)).toBe('critical');
      expect(getChannelHealth(1.2)).toBe('warning');
      expect(getChannelHealth(1.5)).toBe('capable');
      expect(getChannelHealth(2.0)).toBe('excellent');
    });

    it('should apply aerospace (strict) thresholds correctly', () => {
      expect(getChannelHealth(1.2, aerospaceThresholds)).toBe('critical');
      expect(getChannelHealth(1.8, aerospaceThresholds)).toBe('warning');
      expect(getChannelHealth(2.2, aerospaceThresholds)).toBe('capable');
      expect(getChannelHealth(2.6, aerospaceThresholds)).toBe('excellent');
    });

    it('should apply consumer goods (lenient) thresholds correctly', () => {
      expect(getChannelHealth(0.5, consumerThresholds)).toBe('critical');
      expect(getChannelHealth(0.8, consumerThresholds)).toBe('warning');
      expect(getChannelHealth(1.2, consumerThresholds)).toBe('capable');
      expect(getChannelHealth(1.5, consumerThresholds)).toBe('excellent');
    });

    it('should show impact of threshold changes on same Cpk value', () => {
      const cpk = 1.5;

      // Same Cpk = 1.5 classified differently by industry
      expect(getChannelHealth(cpk, defaultThresholds)).toBe('capable');
      expect(getChannelHealth(cpk, aerospaceThresholds)).toBe('warning'); // 1.5 is at aerospace critical threshold
      expect(getChannelHealth(cpk, consumerThresholds)).toBe('excellent');
    });

    it('should handle undefined Cpk as critical regardless of thresholds', () => {
      expect(getChannelHealth(undefined, defaultThresholds)).toBe('critical');
      expect(getChannelHealth(undefined, aerospaceThresholds)).toBe('critical');
      expect(getChannelHealth(undefined, consumerThresholds)).toBe('critical');
    });

    it('should handle edge case values at threshold boundaries', () => {
      const thresholds: CpkThresholds = { critical: 1.0, warning: 1.5, capable: 2.0 };

      expect(getChannelHealth(0.99, thresholds)).toBe('critical');
      expect(getChannelHealth(1.0, thresholds)).toBe('warning');
      expect(getChannelHealth(1.49, thresholds)).toBe('warning');
      expect(getChannelHealth(1.5, thresholds)).toBe('capable');
      expect(getChannelHealth(1.99, thresholds)).toBe('capable');
      expect(getChannelHealth(2.0, thresholds)).toBe('excellent');
    });
  });
});
