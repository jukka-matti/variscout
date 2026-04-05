/**
 * Prompt tier safety regression tests.
 *
 * These are REGRESSION tests — they catch if someone accidentally puts
 * dynamic data (stats values, filter state, finding text) into the
 * cached tier (tier1Static), which must remain session-invariant.
 *
 * See ADR-068 for the tiered prompt architecture contract.
 */

import { describe, it, expect } from 'vitest';
import { assembleCoScoutPrompt } from '../prompts/coScout';
import type { AIContext } from '../types';

const RICH_CONTEXT: AIContext = {
  stats: { samples: 100, mean: 50.3, stdDev: 2.1, cp: 1.5, cpk: 1.2 },
  filters: [{ factor: 'Machine', values: ['A', 'B'] }],
  variationContributions: [{ factor: 'Machine', etaSquared: 0.45 }],
  drillPath: ['Machine'],
  process: {},
  investigation: {
    phase: 'validating',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questionTree: [{ id: 'q1', text: 'Test question?', status: 'answered', children: [] }] as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suspectedCauseHubs: [{ name: 'Nozzle Wear', status: 'suspected' }] as any,
  },
};

describe('Prompt tier safety', () => {
  it('tier1Static NEVER contains stats values', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(result.tier1Static).not.toContain('50.3');
    expect(result.tier1Static).not.toContain('2.1');
    expect(result.tier1Static).not.toContain('1.2');
  });

  it('tier1Static NEVER contains filter state', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    // Should not contain specific filter values as a filter expression
    expect(result.tier1Static).not.toMatch(/Machine.*A.*B/);
  });

  it('tier1Static NEVER contains finding/hub text', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(result.tier1Static).not.toContain('Nozzle Wear');
    expect(result.tier1Static).not.toContain('Test question');
  });

  it('tier1Static is stable across different contexts', () => {
    const minimal = assembleCoScoutPrompt({
      phase: 'frame',
      mode: 'standard',
      surface: 'fullPanel',
      context: {
        stats: undefined,
        filters: [],
        variationContributions: [],
        drillPath: [],
        process: {},
      },
    });
    const rich = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(minimal.tier1Static).toBe(rich.tier1Static);
  });

  it('tier2SemiStatic contains investigation context when present', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(result.tier2SemiStatic.length).toBeGreaterThan(100);
  });

  it('every tool in tools array has a name and type', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    for (const tool of result.tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('type', 'function');
    }
  });
});
