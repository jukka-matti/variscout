import { describe, it, expect } from 'vitest';
import { inferMode } from '../modeInference';
import type { ProcessMap } from '../types';

/**
 * Rule-table fixtures for `inferMode`.
 *
 * Each test documents which rule is expected to fire and why. When adding a
 * new rule, add a fixture *above* the "standard.fallback" test and update the
 * priority ordering here as needed.
 */

const baseMap = (overrides: Partial<ProcessMap> = {}): ProcessMap => ({
  version: 1,
  nodes: [{ id: 'step-1', name: 'Fill', order: 0 }],
  tributaries: [],
  createdAt: '2026-04-18T00:00:00.000Z',
  updatedAt: '2026-04-18T00:00:00.000Z',
  ...overrides,
});

describe('inferMode — rule priority', () => {
  it('fires yamazumi.tripletPresent when all three yamazumi columns are declared', () => {
    const result = inferMode({
      yamazumiMapping: {
        activityTypeColumn: 'Activity_Type',
        cycleTimeColumn: 'Cycle_Time',
        stepColumn: 'Step',
      },
    });
    expect(result.mode).toBe('yamazumi');
    expect(result.rulesSatisfied).toEqual(['yamazumi.tripletPresent']);
    expect(result.reason).toMatch(/yamazumi/i);
  });

  it('fires defect.typeAndCount when defect type and count columns are declared', () => {
    const result = inferMode({
      defectMapping: {
        defectTypeColumn: 'Defect_Type',
        countColumn: 'Count',
      },
    });
    expect(result.mode).toBe('defect');
    expect(result.rulesSatisfied).toEqual(['defect.typeAndCount']);
  });

  it('fires defect.passFail when data shape is pass-fail with a result column', () => {
    const result = inferMode({
      defectMapping: {
        dataShape: 'pass-fail',
        resultColumn: 'Pass_Fail',
      },
    });
    expect(result.mode).toBe('defect');
    expect(result.rulesSatisfied).toEqual(['defect.passFail']);
  });

  it('fires performance.threeOrMoreChannels when 3+ channels are detected', () => {
    const result = inferMode({
      performanceChannels: ['Ch1', 'Ch2', 'Ch3'],
    });
    expect(result.mode).toBe('performance');
    expect(result.rulesSatisfied).toEqual(['performance.threeOrMoreChannels']);
  });

  it('does NOT fire performance with fewer than 3 channels', () => {
    const result = inferMode({ performanceChannels: ['Ch1', 'Ch2'] });
    expect(result.mode).toBe('standard');
    expect(result.rulesSatisfied).toEqual(['standard.fallback']);
  });

  it('fires capability when outcome + spec (USL only) + subgroup axis are all present', () => {
    const result = inferMode({
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12.3 },
      processMap: baseMap({
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
        subgroupAxes: ['t-mach'],
      }),
    });
    expect(result.mode).toBe('capability');
    expect(result.rulesSatisfied).toEqual(['capability.outcomeSpecsAndSubgroups']);
  });

  it('fires capability when outcome + spec (LSL only) + subgroup axis are all present', () => {
    const result = inferMode({
      outcomeColumn: 'Tensile_N',
      specs: { lsl: 40 },
      processMap: baseMap({
        tributaries: [{ id: 't-shift', stepId: 'step-1', column: 'Shift' }],
        subgroupAxes: ['t-shift'],
      }),
    });
    expect(result.mode).toBe('capability');
  });

  it('does NOT fire capability when subgroup axis is missing', () => {
    const result = inferMode({
      outcomeColumn: 'Fill_Weight',
      specs: { lsl: 11.7, usl: 12.3 },
      processMap: baseMap({
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
        subgroupAxes: [],
      }),
    });
    expect(result.mode).toBe('standard');
  });

  it('does NOT fire capability when specs are missing (target alone is not enough)', () => {
    const result = inferMode({
      outcomeColumn: 'Fill_Weight',
      specs: { target: 12.0 }, // no LSL or USL
      processMap: baseMap({
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
        subgroupAxes: ['t-mach'],
      }),
    });
    expect(result.mode).toBe('standard');
  });

  it('does NOT fire capability when outcome column is missing', () => {
    const result = inferMode({
      specs: { lsl: 11.7, usl: 12.3 },
      processMap: baseMap({
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
        subgroupAxes: ['t-mach'],
      }),
    });
    expect(result.mode).toBe('standard');
  });

  it('falls back to standard on empty input', () => {
    const result = inferMode({});
    expect(result.mode).toBe('standard');
    expect(result.rulesSatisfied).toEqual(['standard.fallback']);
  });

  it('falls back to standard when all mode-specific inputs are partially filled', () => {
    const result = inferMode({
      yamazumiMapping: { activityTypeColumn: 'Activity_Type' }, // missing cycleTime + step
      defectMapping: { defectTypeColumn: 'Defect_Type' }, // missing count
      performanceChannels: ['Ch1'], // only 1 channel
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12.3 },
      // no subgroupAxes
    });
    expect(result.mode).toBe('standard');
  });
});

describe('inferMode — rule priority ordering', () => {
  it('yamazumi beats defect when both mappings are complete (specificity)', () => {
    const result = inferMode({
      yamazumiMapping: {
        activityTypeColumn: 'Activity_Type',
        cycleTimeColumn: 'Cycle_Time',
        stepColumn: 'Step',
      },
      defectMapping: {
        defectTypeColumn: 'Defect_Type',
        countColumn: 'Count',
      },
    });
    expect(result.mode).toBe('yamazumi');
  });

  it('defect beats performance when both would fire', () => {
    const result = inferMode({
      defectMapping: { defectTypeColumn: 'Defect_Type', countColumn: 'Count' },
      performanceChannels: ['Ch1', 'Ch2', 'Ch3'],
    });
    expect(result.mode).toBe('defect');
  });

  it('performance beats capability when both would fire', () => {
    const result = inferMode({
      performanceChannels: ['Ch1', 'Ch2', 'Ch3'],
      outcomeColumn: 'Fill_Weight',
      specs: { usl: 12.3 },
      processMap: baseMap({
        tributaries: [{ id: 't-mach', stepId: 'step-1', column: 'Machine' }],
        subgroupAxes: ['t-mach'],
      }),
    });
    expect(result.mode).toBe('performance');
  });
});

describe('inferMode — result shape', () => {
  it('always returns a human-readable reason', () => {
    const result = inferMode({});
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('always returns a non-empty rulesSatisfied array', () => {
    const result = inferMode({});
    expect(result.rulesSatisfied.length).toBeGreaterThan(0);
  });
});
